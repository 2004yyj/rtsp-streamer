use mediamtx_manager_core::AppState;
use tauri::State;

#[tauri::command]
pub async fn start_publish(
    state: State<'_, AppState>,
    path_name: String,
    file_path: String,
    looped: Option<bool>,
) -> Result<(), String> {
    state
        .publish_manager
        .start(&path_name, &file_path, looped.unwrap_or(true))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn stop_publish(
    state: State<'_, AppState>,
    path_name: String,
) -> Result<(), String> {
    state
        .publish_manager
        .stop(&path_name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_publishing(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    Ok(state.publish_manager.list().await)
}
