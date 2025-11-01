mod block;
mod commands;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                // Unmaximize if maximized (safe to call even if not maximized)
                let _ = window.unmaximize();
                // Ensure it's not fullscreen
                let _ = window.set_fullscreen(false);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::authorize_admin,
            commands::create_and_store_session,
            commands::unblock_all_sites,
            commands::get_all_sessions,
            commands::resize_window_to_widget,
            commands::resize_window_to_main,
            commands::resize_window_to_stats
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
