#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use mediamtx_manager_core::{AppConfig, AppState};
use tauri::{Manager, RunEvent};

fn main() {
    tracing_subscriber::fmt::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");

            let config = AppConfig {
                mediamtx_api_url: "http://127.0.0.1:9997".into(),
                mediamtx_binary_dir: data_dir.clone(),
                mediamtx_config_path: data_dir.join("mediamtx.yml"),
            };

            let state = AppState::new(config);
            app.manage(state);

            // 바이너리 자동 다운로드 + 자동 시작
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let state = app_handle.state::<AppState>();
                auto_setup(&state).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::process::start_mediamtx,
            commands::process::stop_mediamtx,
            commands::process::restart_mediamtx,
            commands::process::get_process_status,
            commands::process::download_mediamtx,
            commands::paths::list_path_configs,
            commands::paths::get_path_config,
            commands::paths::add_path_config,
            commands::paths::update_path_config,
            commands::paths::delete_path_config,
            commands::paths::list_paths,
            commands::paths::get_path,
            commands::config::get_global_config,
            commands::config::patch_global_config,
            commands::config_file::read_config_file,
            commands::config_file::write_config_file,
            commands::publish::start_publish,
            commands::publish::stop_publish,
            commands::publish::list_publishing,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let RunEvent::ExitRequested { .. } = event {
                // 앱 종료 시 발행 프로세스 및 MediaMTX 프로세스 정리
                let state = app_handle.state::<AppState>();
                tauri::async_runtime::block_on(async {
                    state.publish_manager.stop_all().await;
                    if let Err(e) = state.process_manager.stop().await {
                        tracing::warn!("Failed to stop MediaMTX on exit: {e}");
                    }
                });
            }
        });
}

/// 바이너리가 없으면 다운로드하고, MediaMTX를 자동 시작
async fn auto_setup(state: &AppState) {
    // 바이너리가 없으면 다운로드
    if state.downloader.installed_binary_path().is_none() {
        tracing::info!("MediaMTX binary not found, downloading...");
        match state.downloader.download(None).await {
            Ok(info) => {
                tracing::info!("Downloaded MediaMTX {} to {}", info.version, info.path.display());
            }
            Err(e) => {
                tracing::error!("Failed to download MediaMTX: {e}");
                return;
            }
        }
    }

    // 설정 파일이 없으면 API 활성화된 기본 설정 생성
    ensure_config(&state.config_file_manager).await;

    // 프로세스 시작
    match state.process_manager.start().await {
        Ok(()) => tracing::info!("MediaMTX auto-started"),
        Err(e) => tracing::error!("Failed to auto-start MediaMTX: {e}"),
    }
}

/// 설정 파일의 API가 활성화되어 있는지 확인하고, 아니면 활성화
async fn ensure_config(cfm: &mediamtx_manager_core::ConfigFileManager) {
    match cfm.read_as_string().await {
        Ok(content) => {
            // api: no 또는 api: false → api: yes로 교체
            if content.contains("api: no") || content.contains("api: false") {
                let patched = content
                    .replace("api: no", "api: yes")
                    .replace("api: false", "api: yes");
                if let Err(e) = cfm.write_string(&patched).await {
                    tracing::error!("Failed to enable API in config: {e}");
                } else {
                    tracing::info!("Enabled API in existing config");
                }
            }
        }
        Err(_) => {
            // 설정 파일이 없으면 기본 설정 생성
            let default_config = "\
# MediaMTX configuration (managed by MediaMTX Manager)
api: yes
apiAddress: :9997
";
            if let Err(e) = cfm.write_string(default_config).await {
                tracing::error!("Failed to create default config: {e}");
            } else {
                tracing::info!("Created default config with API enabled");
            }
        }
    }
}
