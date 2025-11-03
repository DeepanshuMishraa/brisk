use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::Path;
use std::process::Command;
use tauri::{AppHandle, Manager, PhysicalSize};

use crate::block;

#[derive(Serialize, Deserialize, Debug)]
pub struct Store {
    goal: String,
    duration: u64,
    blocked_things: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Session {
    goal: String,
    duration: u64,
    blocked_things: Vec<String>,
    timestamp: i64,
}

type Result<T> = std::result::Result<T, String>;
const STORAGE_DIR: &str = "/home/dipxsy/.focus_sessions";

#[tauri::command]
pub fn setup_persistent_authorization() -> Result<String> {
    const SUDOERS_FILE: &str = "/etc/sudoers.d/focus";

    if Path::new(SUDOERS_FILE).exists() {
        return Ok("Authorization already configured".to_string());
    }

    let username = std::env::var("USER")
        .or_else(|_| std::env::var("USERNAME"))
        .map_err(|_| "Failed to get username".to_string())?;

    let sudoers_content = format!(
        "# Focus App - Passwordless sudo for specific commands\n\
         {} ALL=(ALL) NOPASSWD: /usr/bin/tee /etc/hosts\n\
         {} ALL=(ALL) NOPASSWD: /usr/bin/cp * /etc/hosts\n\
         {} ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart systemd-resolved\n\
         {} ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nscd\n\
         {} ALL=(ALL) NOPASSWD: /usr/bin/resolvectl flush-caches\n\
         {} ALL=(ALL) NOPASSWD: /usr/bin/systemd-resolve --flush-caches\n",
        username, username, username, username, username, username
    );

    let temp_file = std::env::temp_dir().join("focus_sudoers_temp");
    fs::write(&temp_file, &sudoers_content)
        .map_err(|e| format!("Failed to create temporary file: {}", e))?;

    let temp_file_str = temp_file
        .to_str()
        .ok_or("Failed to convert temp file path to string")?;


    if !Command::new("which")
        .arg("pkexec")
        .output()
        .is_ok_and(|o| o.status.success())
    {
        let _ = fs::remove_file(&temp_file);
        return Err(
            "pkexec is not installed. Please install it:\n\n\
             Ubuntu/Debian: sudo apt install policykit-1\n\
             Arch Linux: sudo pacman -S polkit\n\
             Fedora: sudo dnf install polkit\n\n\
             Or run the app from terminal and it will use sudo instead."
                .to_string(),
        );
    }

    let script_path = std::env::temp_dir().join("focus_install_sudoers.sh");
    let script_content = format!(
        "#!/bin/bash\n\
         cp {} /etc/sudoers.d/focus\n\
         chmod 440 /etc/sudoers.d/focus\n\
         chown root:root /etc/sudoers.d/focus\n",
        temp_file_str
    );
    
    fs::write(&script_path, script_content)
        .map_err(|e| format!("Failed to create install script: {}", e))?;

    #[cfg(target_os = "linux")]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&script_path)
            .map_err(|e| format!("Failed to get script permissions: {}", e))?
            .permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&script_path, perms)
            .map_err(|e| format!("Failed to set script permissions: {}", e))?;
    }

    let script_str = script_path
        .to_str()
        .ok_or("Failed to convert script path to string")?;

    let output = Command::new("pkexec")
        .arg("bash")
        .arg(script_str)
        .output()
        .map_err(|e| format!("Failed to execute pkexec: {}", e))?;

    let _ = fs::remove_file(&script_path);
    let _ = fs::remove_file(&temp_file);

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        
        if stderr.contains("dismissed") || stderr.contains("cancelled") {
            return Err("Authentication cancelled by user.".to_string());
        }
        
        return Err(format!(
            "Failed to install sudoers file. Please ensure:\n\
             1. You entered the correct password\n\
             2. Your user has sudo privileges\n\n\
             Error: {}",
            stderr
        ));
    }

    Ok("Authorization configured successfully".to_string())
}

#[tauri::command]
pub fn check_authorization_status() -> Result<bool> {
    const SUDOERS_FILE: &str = "/etc/sudoers.d/focus";
    Ok(Path::new(SUDOERS_FILE).exists())
}

#[tauri::command]
pub fn remove_authorization() -> Result<String> {
    const SUDOERS_FILE: &str = "/etc/sudoers.d/focus";
    
    if !Path::new(SUDOERS_FILE).exists() {
        return Ok("No authorization to remove".to_string());
    }

    if !Command::new("which")
        .arg("pkexec")
        .output()
        .is_ok_and(|o| o.status.success())
    {
        return Err(
            "pkexec is not installed. Please remove the file manually:\n\
             sudo rm /etc/sudoers.d/focus"
                .to_string(),
        );
    }

    let output = Command::new("pkexec")
        .arg("rm")
        .arg(SUDOERS_FILE)
        .output()
        .map_err(|e| format!("Failed to remove authorization: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to remove authorization: {}", stderr));
    }

    Ok("Authorization removed successfully".to_string())
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

#[tauri::command]
pub fn get_all_sessions() -> Result<Vec<Session>> {
    let dir = Path::new(STORAGE_DIR);

    if !dir.exists() {
        return Ok(Vec::new());
    }

    let mut sessions = Vec::new();

    let entries = fs::read_dir(dir).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("json") {
            if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                // Extract timestamp from filename: session_1762021023.json
                if let Some(timestamp_str) = file_name
                    .strip_prefix("session_")
                    .and_then(|s| s.strip_suffix(".json"))
                {
                    if let Ok(timestamp) = timestamp_str.parse::<i64>() {
                        let content = fs::read_to_string(&path).map_err(|e| {
                            format!("Failed to read file {}: {}", path.display(), e)
                        })?;

                        let store: Store = serde_json::from_str(&content).map_err(|e| {
                            format!("Failed to parse JSON in {}: {}", path.display(), e)
                        })?;

                        sessions.push(Session {
                            goal: store.goal,
                            duration: store.duration,
                            blocked_things: store.blocked_things,
                            timestamp,
                        });
                    }
                }
            }
        }
    }

    // Sort by timestamp descending (newest first)
    sessions.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    Ok(sessions)
}

const MAIN_WINDOW_WIDTH: u32 = 1600;
const MAIN_WINDOW_HEIGHT: u32 = 1200;
const MAIN_WINDOW_MIN_WIDTH: u32 = 900;
const MAIN_WINDOW_MIN_HEIGHT: u32 = 600;

const STATS_WINDOW_WIDTH: u32 = 1600;
const STATS_WINDOW_HEIGHT: u32 = 1200;

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

    // Ensure window is not maximized or fullscreen first
    let _ = window.set_fullscreen(false);
    let _ = window.unmaximize();
    let _ = window.set_always_on_top(false);

    // Ensure window is visible and focused
    let _ = window.show();
    let _ = window.set_focus();

    // First, ensure window is resizable
    window
        .set_resizable(true)
        .map_err(|e| format!("Failed to set window resizable: {}", e))?;

    // Step 1: Clear ALL constraints first to remove stats/widget mode restrictions
    window
        .set_max_size(None::<PhysicalSize<u32>>)
        .map_err(|e| format!("Failed to remove max size: {}", e))?;

    window
        .set_min_size(None::<PhysicalSize<u32>>)
        .map_err(|e| format!("Failed to clear min size: {}", e))?;

    // Small delay to ensure constraints are cleared
    std::thread::sleep(std::time::Duration::from_millis(50));

    // Step 2: Set both min and max to 900x600 to lock the window at that size
    window
        .set_min_size(Some(PhysicalSize::new(
            MAIN_WINDOW_WIDTH,
            MAIN_WINDOW_HEIGHT,
        )))
        .map_err(|e| format!("Failed to set min size: {}", e))?;

    window
        .set_max_size(Some(PhysicalSize::new(
            MAIN_WINDOW_WIDTH,
            MAIN_WINDOW_HEIGHT,
        )))
        .map_err(|e| format!("Failed to set max size: {}", e))?;

    // Step 3: Set the window size to main dimensions
    window
        .set_size(PhysicalSize::new(MAIN_WINDOW_WIDTH, MAIN_WINDOW_HEIGHT))
        .map_err(|e| format!("Failed to set window size: {}", e))?;

    // Small delay to ensure size is applied
    std::thread::sleep(std::time::Duration::from_millis(50));

    // Verify the size was set correctly, retry if needed
    let current_size = window
        .inner_size()
        .map_err(|e| format!("Failed to get current size: {}", e))?;

    if current_size.width != MAIN_WINDOW_WIDTH || current_size.height != MAIN_WINDOW_HEIGHT {
        println!(
            "Warning: Window size is {}x{}, retrying...",
            current_size.width, current_size.height
        );

        // Try again with more aggressive approach
        window
            .set_size(PhysicalSize::new(MAIN_WINDOW_WIDTH, MAIN_WINDOW_HEIGHT))
            .map_err(|e| format!("Failed to retry window size: {}", e))?;

        std::thread::sleep(std::time::Duration::from_millis(100));
    }

    let _ = window.center();

    let final_size = window
        .inner_size()
        .map_err(|e| format!("Failed to get final size: {}", e))?;
    println!(
        "Window resized to main size: {}x{} (requested: {}x{})",
        final_size.width, final_size.height, MAIN_WINDOW_WIDTH, MAIN_WINDOW_HEIGHT
    );

    Ok(format!(
        "Window resized to main size: {}x{}",
        final_size.width, final_size.height
    ))
}

#[tauri::command]
pub async fn resize_window_to_stats(app: AppHandle) -> Result<String> {
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;
    
    let _ = window.set_fullscreen(false);
    let _ = window.unmaximize();
    let _ = window.set_always_on_top(false);
    let _ = window.show();
    let _ = window.set_focus();
    
    
    window
        .set_resizable(true)
        .map_err(|e| format!("Failed to set window resizable: {}", e))?;
    window
        .set_max_size(None::<PhysicalSize<u32>>)
        .map_err(|e| format!("Failed to remove max size: {}", e))?;

    window
        .set_min_size(None::<PhysicalSize<u32>>)
        .map_err(|e| format!("Failed to clear min size: {}", e))?;
    window
        .set_min_size(Some(PhysicalSize::new(
            STATS_WINDOW_WIDTH,
            STATS_WINDOW_HEIGHT,
        )))
        .map_err(|e| format!("Failed to set min size: {}", e))?;

    window
        .set_max_size(Some(PhysicalSize::new(
            STATS_WINDOW_WIDTH,
            STATS_WINDOW_HEIGHT,
        )))
        .map_err(|e| format!("Failed to set max size: {}", e))?;
    window
        .set_size(PhysicalSize::new(STATS_WINDOW_WIDTH, STATS_WINDOW_HEIGHT))
        .map_err(|e| format!("Failed to set window size: {}", e))?;

    let _ = window.center();

    let current_size = window
        .inner_size()
        .map_err(|e| format!("Failed to get current size: {}", e))?;
    println!(
        "Window resized to stats size: {}x{} (requested: {}x{})",
        current_size.width, current_size.height, STATS_WINDOW_WIDTH, STATS_WINDOW_HEIGHT
    );

    Ok(format!(
        "Window resized to stats size: {}x{}",
        current_size.width, current_size.height
    ))
}
