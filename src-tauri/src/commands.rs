use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::Path;

use crate::block;

#[derive(Serialize, Deserialize, Debug)]
pub struct Store {
    goal: String,
    duration: u64,
    blocked_things: Vec<String>,
}

type Result<T> = std::result::Result<T, String>;
const STORAGE_DIR: &str = "/home/dipxsy/.focus_sessions";

#[tauri::command]
pub fn create_and_store_session(goal: String, duration: u64, blocked_things: Vec<String>) -> Result<String> {
    if !blocked_things.is_empty() {
        block::block_sites(&blocked_things)
            .map_err(|e| format!("Failed to block sites: {}", e))?;
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
    block::unblock_sites()
        .map_err(|e| format!("Failed to unblock sites: {}", e))?;
    Ok("Sites unblocked successfully".to_string())
}
