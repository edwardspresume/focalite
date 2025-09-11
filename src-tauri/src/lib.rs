
#[tauri::command]
async fn focus_window(window: tauri::Window) -> Result<(), String> {
    // Try to ensure the window is visible and in front.
    // On Windows, stealing focus can be restricted; combining these helps.
    if let Err(e) = window.unminimize() {
        eprintln!("unminimize failed: {e}");
    }
    if let Err(e) = window.show() {
        eprintln!("show failed: {e}");
    }
    if let Err(e) = window.set_focus() {
        eprintln!("set_focus failed: {e}");
    }
    if let Err(e) = window.request_user_attention(Some(tauri::UserAttentionType::Critical)) {
        eprintln!("request_user_attention failed: {e}");
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![focus_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
