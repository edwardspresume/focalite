
use std::sync::Mutex;
use tauri::{Manager, Emitter};

// Global state to track break overlay windows
static BREAK_OVERLAYS: Mutex<Vec<String>> = Mutex::new(Vec::new());

#[tauri::command]
async fn create_break_overlays(app_handle: tauri::AppHandle) -> Result<(), String> {
    let mut overlays = BREAK_OVERLAYS.lock().map_err(|e| e.to_string())?;

    // Close any existing overlays first
    for window_label in overlays.iter() {
        if let Some(window) = app_handle.get_webview_window(window_label) {
            let _ = window.close();
        }
    }
    overlays.clear();

    // Create a single break overlay window for now to avoid Wayland issues
    let window_label = "break_overlay".to_string();

    let window_builder = tauri::WebviewWindowBuilder::new(
        &app_handle,
        &window_label,
        tauri::WebviewUrl::App("break-overlay/".into())
    )
    .title("Break Time")
    .inner_size(800.0, 600.0)
    .always_on_top(true)
    .decorations(false)
    .resizable(false);

    let _window = window_builder.build().map_err(|e| e.to_string())?;
    overlays.push(window_label);

    Ok(())
}

#[tauri::command]
async fn close_break_overlays(app_handle: tauri::AppHandle) -> Result<(), String> {
    let mut overlays = BREAK_OVERLAYS.lock().map_err(|e| e.to_string())?;

    for window_label in overlays.iter() {
        if let Some(window) = app_handle.get_webview_window(window_label) {
            let _ = window.close();
        }
    }
    overlays.clear();

    Ok(())
}

#[tauri::command]
async fn end_break_from_overlay(app_handle: tauri::AppHandle) -> Result<(), String> {
    // Close all overlay windows
    close_break_overlays(app_handle.clone()).await?;

    // Emit event to main window to end break
    if let Some(main_window) = app_handle.get_webview_window("main") {
        let _ = main_window.emit("break_ended", ());
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            create_break_overlays,
            close_break_overlays,
            end_break_from_overlay
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
