use std::collections::HashMap;
use std::sync::Arc;

use tokio::process::{Child, Command};
use tokio::sync::Mutex;

use crate::error::CoreError;

/// FFmpeg를 사용해 영상 파일을 MediaMTX에 발행하는 관리자
pub struct PublishManager {
    /// path name → FFmpeg child process
    processes: Arc<Mutex<HashMap<String, Child>>>,
    rtsp_base_url: String,
}

impl PublishManager {
    pub fn new(rtsp_base_url: &str) -> Self {
        Self {
            processes: Arc::new(Mutex::new(HashMap::new())),
            rtsp_base_url: rtsp_base_url.trim_end_matches('/').to_string(),
        }
    }

    /// 파일을 특정 경로로 발행 시작
    pub async fn start(
        &self,
        path_name: &str,
        file_path: &str,
        looped: bool,
    ) -> Result<(), CoreError> {
        let mut procs = self.processes.lock().await;

        if procs.contains_key(path_name) {
            return Err(CoreError::Process(format!(
                "Already publishing to '{path_name}'"
            )));
        }

        let rtsp_url = format!("{}/{}", self.rtsp_base_url, path_name);

        let mut args = Vec::new();

        if looped {
            args.extend_from_slice(&["-stream_loop", "-1"]);
        }

        args.extend_from_slice(&[
            "-re",            // 실시간 속도로 읽기
            "-i", file_path,  // 입력 파일
            "-c", "copy",     // 코덱 복사 (재인코딩 없음)
            "-f", "rtsp",     // RTSP 출력
            "-rtsp_transport", "tcp",
            &rtsp_url,
        ]);

        let child = Command::new("ffmpeg")
            .args(&args)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .map_err(|e| CoreError::Process(format!("Failed to start ffmpeg: {e}")))?;

        tracing::info!("Publishing '{file_path}' to {rtsp_url}");
        procs.insert(path_name.to_string(), child);
        Ok(())
    }

    /// 특정 경로의 발행 중지
    pub async fn stop(&self, path_name: &str) -> Result<(), CoreError> {
        let mut procs = self.processes.lock().await;
        let child = procs.get_mut(path_name).ok_or_else(|| {
            CoreError::Process(format!("No publish process for '{path_name}'"))
        })?;

        child
            .kill()
            .await
            .map_err(|e| CoreError::Process(format!("Failed to stop ffmpeg: {e}")))?;

        procs.remove(path_name);
        tracing::info!("Stopped publishing to '{path_name}'");
        Ok(())
    }

    /// 현재 발행 중인 경로 목록
    pub async fn list(&self) -> Vec<String> {
        let mut procs = self.processes.lock().await;
        // 이미 종료된 프로세스 정리
        let mut finished = Vec::new();
        for (name, child) in procs.iter_mut() {
            if let Ok(Some(_)) = child.try_wait() {
                finished.push(name.clone());
            }
        }
        for name in &finished {
            procs.remove(name);
        }
        procs.keys().cloned().collect()
    }

    /// 모든 발행 프로세스 종료
    pub async fn stop_all(&self) {
        let mut procs = self.processes.lock().await;
        for (name, mut child) in procs.drain() {
            if let Err(e) = child.kill().await {
                tracing::warn!("Failed to stop publish for '{name}': {e}");
            }
        }
    }
}
