use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

#[cfg(target_os = "linux")]
use std::process::Stdio;

#[derive(Debug, Clone)]
pub struct BlockedApp {
    pub name: String,
    pub executable: String,
}

#[derive(Debug, Clone)]
pub struct AppBlocker {
    blocked_apps: Arc<Mutex<Vec<BlockedApp>>>,
    is_running: Arc<Mutex<bool>>,
    block_attempts: Arc<Mutex<HashMap<String, u32>>>,
}

impl AppBlocker {
    pub fn new() -> Self {
        Self {
            blocked_apps: Arc::new(Mutex::new(Vec::new())),
            is_running: Arc::new(Mutex::new(false)),
            block_attempts: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn start_blocking(&self, apps: Vec<BlockedApp>) -> Result<(), String> {
        {
            let mut blocked = self.blocked_apps.lock().unwrap();
            *blocked = apps.clone();
        }

        {
            let mut running = self.is_running.lock().unwrap();
            if *running {
                return Err("App blocker is already running".to_string());
            }
            *running = true;
        }

        let blocked_apps = Arc::clone(&self.blocked_apps);
        let is_running = Arc::clone(&self.is_running);
        let block_attempts = Arc::clone(&self.block_attempts);

        thread::spawn(move || {
            println!("?? App blocker started");

            loop {
                {
                    let running = is_running.lock().unwrap();
                    if !*running {
                        println!("?? App blocker stopped");
                        break;
                    }
                }

                let apps_to_block = {
                    let blocked = blocked_apps.lock().unwrap();
                    blocked.clone()
                };

                for app in &apps_to_block {
                    if let Ok(pids) = find_process_by_name(&app.executable) {
                        if !pids.is_empty() {
                            println!("?? Detected blocked app: {} (PIDs: {:?})", app.name, pids);

                            {
                                let mut attempts = block_attempts.lock().unwrap();
                                *attempts.entry(app.name.clone()).or_insert(0) += 1;
                            }

                            show_block_notification(&app.name);

                            for pid in pids {
                                if let Err(e) = kill_process(pid) {
                                    eprintln!("Failed to kill process {}: {}", pid, e);
                                } else {
                                    println!("? Killed process {} ({})", pid, app.name);
                                }
                            }
                        }
                    }
                }

                thread::sleep(Duration::from_millis(500));
            }
        });

        Ok(())
    }

    pub fn stop_blocking(&self) -> Result<(), String> {
        let mut running = self.is_running.lock().unwrap();
        *running = false;

        {
            let mut blocked = self.blocked_apps.lock().unwrap();
            blocked.clear();
        }

        {
            let mut attempts = self.block_attempts.lock().unwrap();
            attempts.clear();
        }

        Ok(())
    }

    pub fn get_block_attempts(&self) -> HashMap<String, u32> {
        let attempts = self.block_attempts.lock().unwrap();
        attempts.clone()
    }
}

fn find_process_by_name(name: &str) -> Result<Vec<u32>, String> {
    let mut pids = Vec::new();

    let proc_dir = Path::new("/proc");
    if let Ok(entries) = fs::read_dir(proc_dir) {
        for entry in entries.flatten() {
            let path = entry.path();

            if let Some(file_name) = path.file_name() {
                if let Some(file_name_str) = file_name.to_str() {
                    if let Ok(pid) = file_name_str.parse::<u32>() {
                        if is_process_match(&path, name) {
                            pids.push(pid);
                        }
                    }
                }
            }
        }
    }

    Ok(pids)
}

fn is_process_match(proc_path: &Path, target: &str) -> bool {
    let comm_path = proc_path.join("comm");
    if let Ok(comm) = fs::read_to_string(&comm_path) {
        let comm_clean = comm.trim().to_lowercase();
        if comm_clean == target.to_lowercase() || comm_clean.contains(&target.to_lowercase()) {
            return true;
        }
    }

    let cmdline_path = proc_path.join("cmdline");
    if let Ok(cmdline) = fs::read_to_string(&cmdline_path) {
        let cmdline_clean = cmdline.replace('\0', " ").to_lowercase();
        if cmdline_clean.contains(&target.to_lowercase()) {
            return true;
        }
    }
    let exe_path = proc_path.join("exe");
    if let Ok(exe) = fs::read_link(&exe_path) {
        if let Some(exe_name) = exe.file_name() {
            if let Some(exe_str) = exe_name.to_str() {
                if exe_str.to_lowercase() == target.to_lowercase()
                    || exe_str.to_lowercase().contains(&target.to_lowercase())
                {
                    return true;
                }
            }
        }
    }

    false
}

fn kill_process(pid: u32) -> Result<(), String> {
    let term_result = Command::new("kill")
        .arg("-15")
        .arg(pid.to_string())
        .output();

    match term_result {
        Ok(output) if output.status.success() => {
            thread::sleep(Duration::from_millis(100));
            if process_exists(pid) {
                let kill_result = Command::new("kill").arg("-9").arg(pid.to_string()).output();

                match kill_result {
                    Ok(output) if output.status.success() => Ok(()),
                    Ok(_) => Err(format!("Failed to kill process {}", pid)),
                    Err(e) => Err(format!("Failed to execute kill command: {}", e)),
                }
            } else {
                Ok(())
            }
        }
        Ok(_) => {
            let kill_result = Command::new("kill").arg("-9").arg(pid.to_string()).output();

            match kill_result {
                Ok(output) if output.status.success() => Ok(()),
                Ok(_) => Err(format!("Failed to kill process {}", pid)),
                Err(e) => Err(format!("Failed to execute kill command: {}", e)),
            }
        }
        Err(e) => Err(format!("Failed to execute kill command: {}", e)),
    }
}

fn process_exists(pid: u32) -> bool {
    Path::new(&format!("/proc/{}", pid)).exists()
}

pub fn search_installed_apps(query: &str) -> Result<Vec<InstalledApp>, String> {
    let mut apps = Vec::new();
    let mut seen_names = HashSet::new();

    let query_lower = query.to_lowercase();

    let home = std::env::var("HOME").unwrap_or_default();
    let user_apps = format!("{}/.local/share/applications", home);
    let flatpak_apps = format!("{}/.local/share/flatpak/exports/share/applications", home);

    let search_paths = vec![
        "/usr/share/applications",
        "/usr/local/share/applications",
        user_apps.as_str(),
        "/var/lib/flatpak/exports/share/applications",
        flatpak_apps.as_str(),
    ];

    for search_path in search_paths {
        if let Ok(entries) = fs::read_dir(search_path) {
            for entry in entries.flatten() {
                let path = entry.path();

                if path.extension().and_then(|s| s.to_str()) == Some("desktop") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        if let Some(app) = parse_desktop_file(&content, &query_lower) {
                            if !seen_names.contains(&app.name) {
                                seen_names.insert(app.name.clone());
                                apps.push(app);
                            }
                        }
                    }
                }
            }
        }
    }

    apps.sort_by(|a, b| {
        let a_exact = a.name.to_lowercase() == query_lower;
        let b_exact = b.name.to_lowercase() == query_lower;

        match (a_exact, b_exact) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.cmp(&b.name),
        }
    });

    apps.truncate(10);

    Ok(apps)
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct InstalledApp {
    pub name: String,
    pub display_name: String,
    pub executable: String,
    pub icon: Option<String>,
    pub categories: Vec<String>,
}

fn parse_desktop_file(content: &str, query: &str) -> Option<InstalledApp> {
    let mut name = None;
    let mut exec = None;
    let mut icon = None;
    let mut categories = Vec::new();
    let mut no_display = false;
    let mut hidden = false;

    for line in content.lines() {
        let line = line.trim();

        if line.starts_with("Name=") {
            name = Some(line.strip_prefix("Name=")?.to_string());
        } else if line.starts_with("Exec=") {
            exec = Some(line.strip_prefix("Exec=")?.to_string());
        } else if line.starts_with("Icon=") {
            icon = Some(line.strip_prefix("Icon=")?.to_string());
        } else if line.starts_with("Categories=") {
            let cats = line.strip_prefix("Categories=")?;
            categories = cats
                .split(';')
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string())
                .collect();
        } else if line.starts_with("NoDisplay=true") {
            no_display = true;
        } else if line.starts_with("Hidden=true") {
            hidden = true;
        }
    }

    if no_display || hidden {
        return None;
    }

    let name = name?;
    let exec = exec?;

    let executable = exec
        .split_whitespace()
        .next()?
        .trim_matches('"')
        .split('/')
        .last()?
        .to_string();

    if !name.to_lowercase().contains(query)
        && !executable.to_lowercase().contains(query)
        && !categories.iter().any(|c| c.to_lowercase().contains(query))
    {
        return None;
    }

    Some(InstalledApp {
        display_name: name.clone(),
        name: name.clone(),
        executable,
        icon,
        categories,
    })
}

fn show_block_notification(app_name: &str) {
    #[cfg(target_os = "linux")]
    {
        let _ = Command::new("notify-send")
            .arg("-u")
            .arg("critical")
            .arg("-t")
            .arg("3000")
            .arg("-i")
            .arg("dialog-error")
            .arg(format!("{} Blocked", app_name))
            .arg("This app is blocked during your focus session")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn();
    }
}
