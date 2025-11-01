use std::fs;
use std::process::Command;
use std::sync::Mutex;
use std::time::{SystemTime, Duration};

const HOSTS_FILE: &str = "/etc/hosts";
const BLOCK_MARKER: &str = "# Focus app blocked sites";
const SUDO_TIMEOUT_SECONDS: u64 = 900; // 15 minutes default sudo timeout

// Global state to track last auth time
static LAST_AUTH_TIME: Mutex<Option<SystemTime>> = Mutex::new(None);

/// Extend sudo timestamp - prompts once and keeps it fresh for 15 minutes
pub fn authorize_once() -> Result<(), String> {
    // Try to extend existing sudo timestamp first (non-interactive)
    let extend_result = Command::new("sudo")
        .arg("-v")
        .output();
    
    if extend_result.is_ok_and(|o| o.status.success()) {
        // Successfully extended existing timestamp
        let mut last_auth = LAST_AUTH_TIME.lock().unwrap();
        *last_auth = Some(SystemTime::now());
        return Ok(());
    }
    
    // No existing timestamp, need to prompt
    // Use pkexec for GUI prompt if available
    if Command::new("which")
        .arg("pkexec")
        .output()
        .is_ok_and(|o| o.status.success())
    {
        let result = Command::new("pkexec")
            .arg("sudo")
            .arg("-v")
            .output();
        
        if result.is_ok_and(|o| o.status.success()) {
            let mut last_auth = LAST_AUTH_TIME.lock().unwrap();
            *last_auth = Some(SystemTime::now());
            return Ok(());
        } else {
            return Err("Authentication failed. Please enter your password.".to_string());
        }
    }
    
    // Fallback to regular sudo prompt
    let result = Command::new("sudo")
        .arg("-v")
        .output();
    
    if result.is_ok_and(|o| o.status.success()) {
        let mut last_auth = LAST_AUTH_TIME.lock().unwrap();
        *last_auth = Some(SystemTime::now());
        Ok(())
    } else {
        Err("Authentication failed. Please enter your password.".to_string())
    }
}

/// Refresh sudo timestamp if needed (non-interactive, fails silently if expired)
fn refresh_sudo_if_needed() {
    let should_refresh = {
        let last_auth = LAST_AUTH_TIME.lock().unwrap();
        match *last_auth {
            Some(time) => {
                time.elapsed().unwrap_or(Duration::from_secs(SUDO_TIMEOUT_SECONDS + 1))
                    >= Duration::from_secs(SUDO_TIMEOUT_SECONDS - 60) // Refresh 1 min before expiry
            }
            None => true,
        }
    };
    
    if should_refresh {
        // Try to extend non-interactively
        let _ = Command::new("sudo")
            .arg("-v")
            .output();
    }
}

fn check_sudo_auth() -> bool {
    // First try to refresh if needed
    refresh_sudo_if_needed();
    
    // Check if we have valid auth
    Command::new("sudo")
        .arg("-n")
        .arg("true")
        .output()
        .is_ok_and(|o| o.status.success())
}

fn write_hosts_with_sudo(content: &str) -> Result<(), String> {
    let output = if check_sudo_auth() {
        Command::new("sudo")
            .arg("-n")
            .arg("tee")
            .arg(HOSTS_FILE)
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .and_then(|mut child| {
                use std::io::Write;
                if let Some(mut stdin) = child.stdin.take() {
                    stdin.write_all(content.as_bytes())?;
                    drop(stdin);
                }
                child.wait_with_output()
            })
            .map_err(|e| format!("Failed to execute sudo command. Error: {}", e))?
    } else if Command::new("which")
        .arg("pkexec")
        .output()
        .is_ok_and(|o| o.status.success())
    {
        let temp_file = std::env::temp_dir().join("focus_hosts_temp");
        fs::write(&temp_file, content)
            .map_err(|e| format!("Failed to write temporary file: {}", e))?;

        let temp_file_str = temp_file
            .to_str()
            .ok_or("Failed to convert temp file path to string")?;

        let output = Command::new("pkexec")
            .arg("sudo")
            .arg("cp")
            .arg(temp_file_str)
            .arg(HOSTS_FILE)
            .output()
            .map_err(|e| format!("Failed to execute pkexec. Error: {}", e))?;

        let _ = fs::remove_file(&temp_file);

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            if stderr.contains("Not authorized")
                || stderr.contains("Authentication Failure")
                || stderr.contains("polkit")
                || stderr.contains("incorrect password")
            {
                return Err(format!(
                    "Polkit authentication failed. Please ensure:\n\n\
                    1. You're entering the correct password for your user account\n\
                    2. Your user account has sudo privileges\n\n\
                    If this persists, try installing the Polkit policy:\n\
                    sudo cp src-tauri/polkit-policy/focus.policy /usr/share/polkit-1/actions/\n\
                    sudo chmod 644 /usr/share/polkit-1/actions/focus.policy\n\n\
                    Or run the app from a terminal."
                ));
            }
        }

        output
    } else {
        let temp_file = std::env::temp_dir().join("focus_hosts_temp");
        fs::write(&temp_file, content)
            .map_err(|e| format!("Failed to write temporary file: {}", e))?;

        let output = Command::new("sudo")
            .arg("cp")
            .arg(&temp_file)
            .arg(HOSTS_FILE)
            .output()
            .map_err(|e| format!("Failed to execute sudo command. Error: {}", e))?;

        let _ = fs::remove_file(&temp_file);
        output
    };

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);

        let error_msg = if stderr.contains("Authentication Failure")
            || stderr.contains("authentication")
            || stderr.contains("polkit")
        {
            "Authentication failed. Please ensure you're entering the correct password for your user account. If this persists, try running the app from a terminal or check Polkit logs."
        } else {
            &format!(
                "Failed to write hosts file. Error: {} Output: {}",
                stderr, stdout
            )
        };

        return Err(error_msg.to_string());
    }

    Ok(())
}

pub fn block_sites(sites: &[String]) -> Result<(), String> {
    if sites.is_empty() {
        return Ok(());
    }

    let hosts_content = fs::read_to_string(HOSTS_FILE).map_err(|e| {
        format!(
            "Failed to read hosts file: {}. Note: This requires sudo privileges.",
            e
        )
    })?;

    let domains_to_block: Vec<String> = sites
        .iter()
        .map(|s| extract_domain(s))
        .filter(|d| !d.is_empty())
        .collect();

    let mut lines: Vec<String> = hosts_content
        .lines()
        .filter(|line| {
            if line.contains(BLOCK_MARKER) {
                return false;
            }
            if line.contains("# Focus") {
                return false;
            }
            let line_trimmed = line.trim();
            for domain in &domains_to_block {
                if line_trimmed.contains(domain)
                    && (line_trimmed.starts_with("0.0.0.0")
                        || line_trimmed.starts_with("::1")
                        || line_trimmed.starts_with("127.0.0.1"))
                {
                    return false;
                }
            }
            true
        })
        .map(|s| s.to_string())
        .collect();

    lines.push(BLOCK_MARKER.to_string());
    let mut domains_added = Vec::new();

    for site in sites {
        let domain = extract_domain(site);
        if !domain.is_empty() && !domains_added.contains(&domain) {
            domains_added.push(domain.clone());
            let block_line_ipv4 = format!("0.0.0.0 {}", domain);
            let block_line_ipv6 = format!("::1 {}", domain);
            let www_block_line_ipv4 = format!("0.0.0.0 www.{}", domain);
            let www_block_line_ipv6 = format!("::1 www.{}", domain);
            println!("Blocking domain: {} (IPv4 and IPv6)", domain);
            lines.push(block_line_ipv4);
            lines.push(block_line_ipv6);
            lines.push(www_block_line_ipv4);
            lines.push(www_block_line_ipv6);
        } else if domain.is_empty() {
            println!("Warning: Could not extract domain from: {}", site);
        }
    }

    println!("Total domains to block: {}", domains_added.len());

    let new_content = lines.join("\n");
    println!("Writing hosts file with {} lines", lines.len());
    println!("Domains being blocked: {:?}", domains_added);
    if lines.len() >= 4 {
        let len = lines.len();
        let sample_lines: Vec<String> = lines[len.saturating_sub(4)..].to_vec();
        println!("Sample block lines:\n{}", sample_lines.join("\n"));
    }
    write_hosts_with_sudo(&new_content)?;
    println!("Hosts file written successfully");

    if !domains_added.is_empty() {
        let verify_content = fs::read_to_string(HOSTS_FILE).unwrap_or_default();
        let domain_to_check = &domains_added[0];
        if verify_content.contains(domain_to_check) && verify_content.contains("0.0.0.0") {
            println!("✓ Verification: Hosts file contains blocked domains");
            let focus_lines: Vec<&str> = verify_content
                .lines()
                .filter(|line| line.contains(domain_to_check))
                .collect();
            println!(
                "Found {} lines with {}: {:?}",
                focus_lines.len(),
                domain_to_check,
                focus_lines
            );
        } else {
            println!("✗ Warning: Verification failed - hosts file may not contain blocked domains");
            let all_lines: Vec<&str> = verify_content.lines().collect();
            let len = all_lines.len();
            let start_idx = if len > 20 { len - 20 } else { 0 };
            let last_lines: Vec<&str> = all_lines[start_idx..].to_vec();
            println!(
                "Hosts file content (last {} lines):\n{}",
                last_lines.len(),
                last_lines.join("\n")
            );
        }
    }

    println!("Flushing DNS cache and restarting systemd-resolved...");

    println!("Restarting systemd-resolved service...");
    if check_sudo_auth() {
        let restart_output = Command::new("sudo")
            .arg("-n")
            .arg("systemctl")
            .arg("restart")
            .arg("systemd-resolved")
            .output();
        match restart_output {
            Ok(o) if o.status.success() => println!("✓ systemd-resolved restarted successfully"),
            Ok(o) => println!(
                "⚠ systemd-resolved restart failed: {}",
                String::from_utf8_lossy(&o.stderr)
            ),
            Err(e) => println!("⚠ Could not restart systemd-resolved: {}", e),
        }
    } else {
        // Don't prompt again - log that restart failed due to expired auth
        println!("⚠ Skipping systemd-resolved restart - sudo authorization expired. Please grant permission again.");
    }

    // DNS flush commands - try without sudo first, then with cached sudo
    let flush_commands = vec![
        ("resolvectl", vec!["flush-caches"]),
        ("systemd-resolve", vec!["--flush-caches"]),
    ];

    for (cmd, args) in flush_commands {
        // Try without sudo first (some systems allow this)
        let no_sudo_result = Command::new(cmd).args(&args).output();
        if no_sudo_result.is_ok_and(|o| o.status.success()) {
            continue; // Success without sudo
        }
        
        // If that fails, use cached sudo auth
        if check_sudo_auth() {
            let _ = Command::new("sudo").arg("-n").arg(cmd).args(args).output();
        }
        // Don't fall back to pkexec here - if sudo auth expired, user should re-authorize
    }

    if check_sudo_auth() {
        let _ = Command::new("sudo")
            .arg("-n")
            .arg("systemctl")
            .arg("restart")
            .arg("nscd")
            .output();
    }

    println!("DNS cache flushed and systemd-resolved restarted");
    println!("⚠ IMPORTANT: Please restart your browser for site blocking to take effect!");
    println!("   Browsers cache DNS and may not respect hosts file changes immediately.");

    if !domains_added.is_empty() {
        let verify_content = fs::read_to_string(HOSTS_FILE).unwrap_or_default();
        let domain_to_check = &domains_added[0];
        if verify_content.contains(domain_to_check) && verify_content.contains("0.0.0.0") {
            println!("✓ Hosts file verified: {} is blocked", domain_to_check);
        }
    }

    Ok(())
}

pub fn unblock_sites() -> Result<(), String> {
    let hosts_content =
        fs::read_to_string(HOSTS_FILE).map_err(|e| format!("Failed to read hosts file: {}", e))?;

    let mut lines: Vec<String> = Vec::new();
    let mut in_focus_block = false;

    for line in hosts_content.lines() {
        let line_trimmed = line.trim();

        if line.contains(BLOCK_MARKER) {
            in_focus_block = true;
            continue;
        }

        if in_focus_block {
            if line_trimmed.starts_with("0.0.0.0")
                || line_trimmed.starts_with("::1")
                || line_trimmed.starts_with("127.0.0.1")
            {
                continue;
            }

            if line_trimmed.is_empty()
                || (!line_trimmed.starts_with("#")
                    && !line_trimmed.starts_with("0.0.0.0")
                    && !line_trimmed.starts_with("::1")
                    && !line_trimmed.starts_with("127.0.0.1"))
            {
                in_focus_block = false;
            }
        }

        if line.contains("# Focus") {
            continue;
        }

        if !in_focus_block {
            if (line_trimmed.starts_with("0.0.0.0") || line_trimmed.starts_with("::1"))
                && !line_trimmed.starts_with("#")
                && !line_trimmed.contains("localhost")
                && !line_trimmed.contains("127.0.0.1")
            {
                let domain_part = line_trimmed.split_whitespace().nth(1).unwrap_or("");
                if !domain_part.is_empty()
                    && (domain_part.contains("facebook")
                        || domain_part.contains("twitter")
                        || domain_part.contains("instagram")
                        || domain_part.contains("youtube")
                        || domain_part.contains("reddit")
                        || domain_part.contains("tiktok")
                        || domain_part.contains("snapchat")
                        || domain_part.contains("discord")
                        || domain_part.contains("netflix")
                        || domain_part.contains("x.com"))
                {
                    println!("Removing orphaned Focus block: {}", line_trimmed);
                    continue;
                }
            }
        }

        lines.push(line.to_string());
    }

    let new_content = lines.join("\n");
    println!("Removing Focus app blocks from hosts file...");
    write_hosts_with_sudo(&new_content)?;
    println!("Hosts file updated successfully");

    println!("Flushing DNS cache and restarting systemd-resolved...");

    println!("Restarting systemd-resolved service...");
    if check_sudo_auth() {
        let restart_output = Command::new("sudo")
            .arg("-n")
            .arg("systemctl")
            .arg("restart")
            .arg("systemd-resolved")
            .output();
        match restart_output {
            Ok(o) if o.status.success() => println!("✓ systemd-resolved restarted successfully"),
            Ok(o) => println!(
                "⚠ systemd-resolved restart failed: {}",
                String::from_utf8_lossy(&o.stderr)
            ),
            Err(e) => println!("⚠ Could not restart systemd-resolved: {}", e),
        }
    } else {
        println!("⚠ Skipping systemd-resolved restart - sudo authorization expired. Please grant permission again.");
    }

    // DNS flush commands - try without sudo first, then with cached sudo
    let flush_commands = vec![
        ("resolvectl", vec!["flush-caches"]),
        ("systemd-resolve", vec!["--flush-caches"]),
    ];

    for (cmd, args) in flush_commands {
        // Try without sudo first (some systems allow this)
        let no_sudo_result = Command::new(cmd).args(&args).output();
        if no_sudo_result.is_ok_and(|o| o.status.success()) {
            continue; // Success without sudo
        }
        
        // If that fails, use cached sudo auth
        if check_sudo_auth() {
            let _ = Command::new("sudo").arg("-n").arg(cmd).args(args).output();
        }
    }

    if check_sudo_auth() {
        let _ = Command::new("sudo")
            .arg("-n")
            .arg("systemctl")
            .arg("restart")
            .arg("nscd")
            .output();
    }

    println!("DNS cache flushed and systemd-resolved restarted");
    println!("⚠ IMPORTANT: You may need to refresh your browser or clear its DNS cache for sites to work immediately!");
    println!("   Some browsers cache DNS very aggressively. Try: Ctrl+Shift+R (hard refresh)");

    Ok(())
}

fn extract_domain(url_or_domain: &str) -> String {
    let mut cleaned = url_or_domain.trim().to_lowercase();

    if cleaned.starts_with("https://") {
        cleaned = cleaned
            .strip_prefix("https://")
            .unwrap_or(&cleaned)
            .to_string();
    } else if cleaned.starts_with("http://") {
        cleaned = cleaned
            .strip_prefix("http://")
            .unwrap_or(&cleaned)
            .to_string();
    }

    if cleaned.starts_with("www.") {
        cleaned = cleaned.strip_prefix("www.").unwrap_or(&cleaned).to_string();
    }

    cleaned
        .split('/')
        .next()
        .unwrap_or(&cleaned)
        .split(':')
        .next()
        .unwrap_or(&cleaned)
        .to_string()
}
