pub mod api_client;
pub mod config_file;
pub mod error;
pub mod models;
pub mod process;

pub use api_client::MediaMtxClient;
pub use config_file::ConfigFileManager;
pub use error::CoreError;
pub use models::config::{GlobalConfig, PathConfig, PathConfigList};
pub use models::path::{PathItem, PathList};
pub use models::process::{BinaryInfo, ProcessStatus};
pub use process::download::BinaryDownloader;
pub use process::lifecycle::ProcessManager;
pub use process::publish::PublishManager;

use std::path::PathBuf;

/// 앱 전체 설정
#[derive(Debug, Clone)]
pub struct AppConfig {
    pub mediamtx_api_url: String,
    pub mediamtx_binary_dir: PathBuf,
    pub mediamtx_config_path: PathBuf,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            mediamtx_api_url: "http://127.0.0.1:9997".into(),
            mediamtx_binary_dir: PathBuf::from("."),
            mediamtx_config_path: PathBuf::from("mediamtx.yml"),
        }
    }
}

/// 공유 애플리케이션 상태 — Tauri managed state 및 axum State로 사용
pub struct AppState {
    pub api_client: MediaMtxClient,
    pub process_manager: ProcessManager,
    pub config_file_manager: ConfigFileManager,
    pub downloader: BinaryDownloader,
    pub publish_manager: PublishManager,
}

impl AppState {
    pub fn new(config: AppConfig) -> Self {
        let binary_name = if cfg!(windows) {
            "mediamtx.exe"
        } else {
            "mediamtx"
        };
        let binary_path = config.mediamtx_binary_dir.join(binary_name);

        let mut process_manager = ProcessManager::new(binary_path);
        process_manager.set_config_path(config.mediamtx_config_path.clone());

        // RTSP URL을 API URL 기반으로 유추 (같은 호스트, 포트 8554)
        let rtsp_base = config
            .mediamtx_api_url
            .replace("9997", "8554")
            .replace("http://", "rtsp://");

        Self {
            api_client: MediaMtxClient::new(&config.mediamtx_api_url),
            process_manager,
            config_file_manager: ConfigFileManager::new(config.mediamtx_config_path),
            downloader: BinaryDownloader::new(config.mediamtx_binary_dir),
            publish_manager: PublishManager::new(&rtsp_base),
        }
    }
}
