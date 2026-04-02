use std::path::PathBuf;
use std::sync::Arc;

use tokio::process::{Child, Command};
use tokio::sync::Mutex;

use crate::error::CoreError;
use crate::models::process::ProcessStatus;

/// MediaMTX 프로세스 생명주기 관리자
pub struct ProcessManager {
    child: Arc<Mutex<Option<Child>>>,
    binary_path: PathBuf,
    config_path: Option<PathBuf>,
    status: Arc<Mutex<ProcessStatus>>,
}

impl ProcessManager {
    pub fn new(binary_path: PathBuf) -> Self {
        Self {
            child: Arc::new(Mutex::new(None)),
            binary_path,
            config_path: None,
            status: Arc::new(Mutex::new(ProcessStatus::Stopped)),
        }
    }

    pub fn set_config_path(&mut self, path: PathBuf) {
        self.config_path = Some(path);
    }

    pub fn set_binary_path(&mut self, path: PathBuf) {
        self.binary_path = path;
    }

    /// 현재 프로세스 상태 조회
    pub async fn status(&self) -> ProcessStatus {
        // 실행 중인 프로세스가 종료되었는지 확인
        let mut child = self.child.lock().await;
        let mut status = self.status.lock().await;

        if let Some(ref mut c) = *child {
            match c.try_wait() {
                Ok(Some(exit)) => {
                    *child = None;
                    if exit.success() {
                        *status = ProcessStatus::Stopped;
                    } else {
                        *status = ProcessStatus::Error {
                            message: format!("Process exited with: {exit}"),
                        };
                    }
                }
                Ok(None) => {
                    // 아직 실행 중
                    *status = ProcessStatus::Running;
                }
                Err(e) => {
                    *status = ProcessStatus::Error {
                        message: e.to_string(),
                    };
                }
            }
        }

        status.clone()
    }

    /// MediaMTX 프로세스 시작
    pub async fn start(&self) -> Result<(), CoreError> {
        if !self.binary_path.exists() {
            return Err(CoreError::BinaryNotFound(
                self.binary_path.display().to_string(),
            ));
        }

        let mut child_lock = self.child.lock().await;
        if child_lock.is_some() {
            return Err(CoreError::Process("Process is already running".into()));
        }

        *self.status.lock().await = ProcessStatus::Starting;

        let mut cmd = Command::new(&self.binary_path);
        if let Some(ref config_path) = self.config_path {
            cmd.arg(config_path);
        }

        let child = cmd
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .map_err(|e| CoreError::Process(format!("Failed to start: {e}")))?;

        *child_lock = Some(child);
        *self.status.lock().await = ProcessStatus::Running;

        tracing::info!("MediaMTX started: {}", self.binary_path.display());
        Ok(())
    }

    /// MediaMTX 프로세스 중지
    pub async fn stop(&self) -> Result<(), CoreError> {
        let mut child_lock = self.child.lock().await;
        let child = child_lock
            .as_mut()
            .ok_or_else(|| CoreError::Process("Process is not running".into()))?;

        *self.status.lock().await = ProcessStatus::Stopping;

        child
            .kill()
            .await
            .map_err(|e| CoreError::Process(format!("Failed to stop: {e}")))?;

        *child_lock = None;
        *self.status.lock().await = ProcessStatus::Stopped;

        tracing::info!("MediaMTX stopped");
        Ok(())
    }

    /// MediaMTX 프로세스 재시작
    pub async fn restart(&self) -> Result<(), CoreError> {
        // 실행 중이면 중지
        if self.child.lock().await.is_some() {
            self.stop().await?;
        }
        self.start().await
    }
}
