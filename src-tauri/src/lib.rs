
use tauri::Manager;

#[tauri::command]
async fn enter_break_mode(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(main_window) = app_handle.get_webview_window("main") {
        // Make window fullscreen and always on top
        let _ = main_window.set_fullscreen(true);
        let _ = main_window.set_always_on_top(true);
        let _ = main_window.set_decorations(false);
        let _ = main_window.set_focus();
    }
    Ok(())
}

#[tauri::command]
async fn exit_break_mode(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(main_window) = app_handle.get_webview_window("main") {
        // Restore normal window state
        let _ = main_window.set_fullscreen(false);
        let _ = main_window.set_always_on_top(false);
        let _ = main_window.set_decorations(true);
    }
    Ok(())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            enter_break_mode,
            exit_break_mode
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
