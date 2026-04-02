#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use mediamtx_manager_core::{AppConfig, AppState};
use tauri::{Manager, RunEvent};

fn main() {
    tracing_subscriber::fmt::init();

    tauri::Builder::default()
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
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let RunEvent::ExitRequested { .. } = event {
                // 앱 종료 시 MediaMTX 프로세스도 정리
                let state = app_handle.state::<AppState>();
                tauri::async_runtime::block_on(async {
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

    // 프로세스 시작
    match state.process_manager.start().await {
        Ok(()) => tracing::info!("MediaMTX auto-started"),
        Err(e) => tracing::error!("Failed to auto-start MediaMTX: {e}"),
    }
}
