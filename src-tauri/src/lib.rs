mod block;
mod commands;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                use tauri::PhysicalSize;
                let _ = window.unmaximize();
                let _ = window.set_fullscreen(false);
                let _ = window.set_size(PhysicalSize::new(1600, 1200));
                let _ = window.center();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::setup_persistent_authorization,
            commands::check_authorization_status,
            commands::remove_authorization,
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
