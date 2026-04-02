mod error;
mod routes;

use std::net::SocketAddr;
use std::sync::Arc;

use mediamtx_manager_core::{AppConfig, AppState};
use tower_http::cors::CorsLayer;
use tower_http::services::{ServeDir, ServeFile};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let config = AppConfig::default();
    let state = Arc::new(AppState::new(config));

    // 자동 다운로드 + API 활성화 + 자동 시작
    auto_setup(&state).await;

    let shutdown_state = state.clone();
    let api_router = routes::create_router(state);

    // 프론트엔드 static 파일 서빙 (SPA fallback)
    let frontend_dir = std::env::var("FRONTEND_DIR").unwrap_or_else(|_| "frontend/dist".into());
    let spa_fallback = ServeFile::new(format!("{frontend_dir}/index.html"));
    let static_files = ServeDir::new(&frontend_dir).not_found_service(spa_fallback);

    let app = api_router
        .fallback_service(static_files)
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("Web server listening on http://{addr}");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal(shutdown_state))
        .await
        .unwrap();
}

async fn shutdown_signal(state: Arc<AppState>) {
    tokio::signal::ctrl_c()
        .await
        .expect("failed to listen for ctrl+c");
    tracing::info!("Shutting down...");
    state.publish_manager.stop_all().await;
    if let Err(e) = state.process_manager.stop().await {
        tracing::warn!("Failed to stop MediaMTX: {e}");
    }
    tracing::info!("MediaMTX stopped");
}

async fn auto_setup(state: &AppState) {
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

    ensure_config(&state.config_file_manager).await;

    match state.process_manager.start().await {
        Ok(()) => tracing::info!("MediaMTX auto-started"),
        Err(e) => tracing::error!("Failed to auto-start MediaMTX: {e}"),
    }
}

async fn ensure_config(cfm: &mediamtx_manager_core::ConfigFileManager) {
    match cfm.read_as_string().await {
        Ok(content) => {
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
            let default_config = "\
# MediaMTX configuration (managed by RTSP Streamer)
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
