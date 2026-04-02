use std::sync::Arc;

use axum::extract::{Path, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use mediamtx_manager_core::AppState;
use serde::Deserialize;

use crate::error::AppError;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartRequest {
    pub path_name: String,
    pub file_path: String,
    pub looped: Option<bool>,
}

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/publish", get(list))
        .route("/publish/start", post(start))
        .route("/publish/stop/{name}", post(stop))
}

async fn start(
    State(state): State<Arc<AppState>>,
    Json(req): Json<StartRequest>,
) -> Result<(), AppError> {
    state
        .publish_manager
        .start(&req.path_name, &req.file_path, req.looped.unwrap_or(true))
        .await?;
    Ok(())
}

async fn stop(
    State(state): State<Arc<AppState>>,
    Path(name): Path<String>,
) -> Result<(), AppError> {
    state.publish_manager.stop(&name).await?;
    Ok(())
}

async fn list(State(state): State<Arc<AppState>>) -> Json<Vec<String>> {
    Json(state.publish_manager.list().await)
}
