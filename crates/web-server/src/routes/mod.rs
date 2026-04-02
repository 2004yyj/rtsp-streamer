pub mod config;
pub mod config_file;
pub mod paths;
pub mod process;
pub mod publish;

use std::sync::Arc;

use axum::Router;
use mediamtx_manager_core::AppState;

pub fn create_router(state: Arc<AppState>) -> Router {
    let api = Router::new()
        .merge(process::routes())
        .merge(paths::routes())
        .merge(config::routes())
        .merge(config_file::routes())
        .merge(publish::routes())
        .with_state(state);

    Router::new().nest("/api", api)
}
