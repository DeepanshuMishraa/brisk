use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::Path;
use tauri::{AppHandle, Manager, PhysicalSize};

use crate::block;

#[derive(Serialize, Deserialize, Debug)]
pub struct Store {
    goal: String,
    duration: u64,
    blocked_things: Vec<String>,
}

type Result<T> = std::result::Result<T, String>;
const STORAGE_DIR: &str = "/home/dipxsy/.focus_sessions";

/// Authorize once at app start - extends sudo timestamp for 15 minutes
#[tauri::command]
pub fn authorize_admin() -> Result<String> {
    block::authorize_once()
        .map(|_| {
            "Authorization successful. You won't be prompted again for 15 minutes.".to_string()
        })
        .map_err(|e| format!("Authorization failed: {}", e))
}

#[tauri::command]
pub fn create_and_store_session(
    goal: String,
    duration: u64,
    blocked_things: Vec<String>,
) -> Result<String> {
    if !blocked_things.is_empty() {
        block::block_sites(&blocked_things).map_err(|e| format!("Failed to block sites: {}", e))?;
    }
    let store = Store {
        goal,
        duration,
        blocked_things,
    };

    let dir = Path::new(STORAGE_DIR);

    if !dir.exists() {
        fs::create_dir_all(dir).map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    let file_name = format!("session_{}.json", Utc::now().timestamp());
    let file_path = dir.join(file_name);

    let json_data =
        serde_json::to_string_pretty(&store).map_err(|e| format!("Failed to serialize {}", e))?;

    let mut file =
        fs::File::create(&file_path).map_err(|e| format!("Failed to create file {}", e))?;

    file.write_all(json_data.as_bytes())
        .map_err(|e| format!("Failed to write: {}", e))?;

    println!("New session stored at {:?}", file_path);
    Ok(format!("Session created successfully at {:?}", file_path))
}

#[tauri::command]
pub fn unblock_all_sites() -> Result<String> {
    block::unblock_sites().map_err(|e| format!("Failed to unblock sites: {}", e))?;
    Ok("Sites unblocked successfully".to_string())
}

const MAIN_WINDOW_WIDTH: u32 = 900;
const MAIN_WINDOW_HEIGHT: u32 = 600;
const MAIN_WINDOW_MIN_WIDTH: u32 = 400;
const MAIN_WINDOW_MIN_HEIGHT: u32 = 300;

const WIDGET_WINDOW_WIDTH: u32 = 400;
const WIDGET_WINDOW_HEIGHT: u32 = 80;

#[tauri::command]
pub async fn resize_window_to_widget(app: AppHandle) -> Result<String> {
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    let _ = window.unmaximize();
    let _ = window.set_fullscreen(false);

    window
        .set_size(PhysicalSize::new(WIDGET_WINDOW_WIDTH, WIDGET_WINDOW_HEIGHT))
        .map_err(|e| format!("Failed to set window size: {}", e))?;

    window
        .set_min_size(Some(PhysicalSize::new(
            WIDGET_WINDOW_WIDTH,
            WIDGET_WINDOW_HEIGHT,
        )))
        .map_err(|e| format!("Failed to set min size: {}", e))?;

    window
        .set_max_size(Some(PhysicalSize::new(
            WIDGET_WINDOW_WIDTH,
            WIDGET_WINDOW_HEIGHT,
        )))
        .map_err(|e| format!("Failed to set max size: {}", e))?;

    window
        .set_always_on_top(true)
        .map_err(|e| format!("Failed to set always on top: {}", e))?;

    Ok("Window resized to widget size".to_string())
}

#[tauri::command]
pub async fn resize_window_to_main(app: AppHandle) -> Result<String> {
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    let _ = window.unmaximize();
    let _ = window.set_fullscreen(false);

    let _ = window.set_always_on_top(false);

    window
        .set_resizable(true)
        .map_err(|e| format!("Failed to set window resizable: {}", e))?;

    // Clear all size constraints first
    window
        .set_max_size(None::<PhysicalSize<u32>>)
        .map_err(|e| format!("Failed to remove max size: {}", e))?;

    window
        .set_min_size(None::<PhysicalSize<u32>>)
        .map_err(|e| format!("Failed to clear min size: {}", e))?;

    // Set the window size to main dimensions
    window
        .set_size(PhysicalSize::new(MAIN_WINDOW_WIDTH, MAIN_WINDOW_HEIGHT))
        .map_err(|e| format!("Failed to set window size: {}", e))?;

      let _ = window.center();

    let current_size = window
        .inner_size()
        .map_err(|e| format!("Failed to get current size: {}", e))?;
    println!(
        "Window resized to main size: {}x{} (requested: {}x{})",
        current_size.width, current_size.height, MAIN_WINDOW_WIDTH, MAIN_WINDOW_HEIGHT
    );

    Ok(format!(
        "Window resized to main size: {}x{}",
        current_size.width, current_size.height
    ))
}
