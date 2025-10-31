use std::fs;
use std::process::Command;

const HOSTS_FILE: &str = "/etc/hosts";
const BLOCK_MARKER: &str = "# Focus app blocked sites";

fn check_sudo_auth() -> bool {
    // Check if sudo authentication is still valid
    Command::new("sudo")
        .arg("-n")
        .arg("true")
        .output()
        .is_ok_and(|o| o.status.success())
}

fn authenticate_sudo() -> Result<(), String> {
    // Use pkexec for GUI password prompt, then refresh sudo timestamp
    // pkexec shows a nice GUI dialog instead of terminal prompt
    if Command::new("which").arg("pkexec").output().is_ok_and(|o| o.status.success()) {
        // Use pkexec to authenticate and refresh sudo timestamp
        let output = Command::new("pkexec")
            .arg("sudo")
            .arg("-v")
            .output()
            .map_err(|e| format!("Failed to execute pkexec. Make sure polkit is installed. Error: {}", e))?;
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Authentication failed: {}", stderr));
        }
    } else {
        // Fallback: use sudo directly (will prompt in terminal)
        let output = Command::new("sudo")
            .arg("-v")
            .output()
            .map_err(|e| format!("Failed to execute sudo. Error: {}", e))?;
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Authentication failed: {}", stderr));
        }
    }
    
    Ok(())
}

fn write_hosts_with_sudo(content: &str) -> Result<(), String> {
    // Check if we need to authenticate
    if !check_sudo_auth() {
        authenticate_sudo()?;
    }
    
    // Create a temporary file
    let temp_file = std::env::temp_dir().join("focus_hosts_temp");
    
    // Write content to temp file
    fs::write(&temp_file, content)
        .map_err(|e| format!("Failed to write temporary file: {}", e))?;

    // Now use sudo -n (non-interactive) since we've authenticated
    let output = Command::new("sudo")
        .arg("-n")
        .arg("cp")
        .arg(&temp_file)
        .arg(HOSTS_FILE)
        .output()
        .map_err(|e| format!("Failed to execute sudo command. Error: {}", e))?;

    // Clean up temp file
    let _ = fs::remove_file(&temp_file);

    if !output.status.success() {
        // If sudo -n failed, try authenticating again
        authenticate_sudo()?;
        
        // Retry with fresh auth
        let temp_file_retry = std::env::temp_dir().join("focus_hosts_temp");
        fs::write(&temp_file_retry, content)
            .map_err(|e| format!("Failed to write temporary file: {}", e))?;
        
        let output_retry = Command::new("sudo")
            .arg("-n")
            .arg("cp")
            .arg(&temp_file_retry)
            .arg(HOSTS_FILE)
            .output()
            .map_err(|e| format!("Failed to execute sudo command. Error: {}", e))?;
        
        let _ = fs::remove_file(&temp_file_retry);
        
        if !output_retry.status.success() {
            let stderr = String::from_utf8_lossy(&output_retry.stderr);
            return Err(format!(
                "Failed to write hosts file. Error: {}",
                stderr
            ));
        }
    }

    Ok(())
}

pub fn block_sites(sites: &[String]) -> Result<(), String> {
    if sites.is_empty() {
        return Ok(());
    }

    // Read current hosts file (requires sudo, but reading usually works)
    let hosts_content = fs::read_to_string(HOSTS_FILE)
        .map_err(|e| format!("Failed to read hosts file: {}. Note: This requires sudo privileges.", e))?;

    // Remove existing Focus app blocks
    let mut lines: Vec<String> = hosts_content
        .lines()
        .filter(|line| {
            !line.contains(BLOCK_MARKER) && 
            !(line.starts_with("127.0.0.1") && line.contains("# Focus"))
        })
        .map(|s| s.to_string())
        .collect();

    // Add new blocks
    lines.push(BLOCK_MARKER.to_string());
    let mut domains_added = Vec::new();
    
    for site in sites {
        // Extract domain from URL or use as-is
        let domain = extract_domain(site);
        if !domain.is_empty() && !domains_added.contains(&domain) {
            domains_added.push(domain.clone());
            let block_line = format!("127.0.0.1 {} # Focus", domain);
            let www_block_line = format!("127.0.0.1 www.{} # Focus", domain);
            println!("Blocking domain: {}", domain);
            lines.push(block_line);
            lines.push(www_block_line);
        } else if domain.is_empty() {
            println!("Warning: Could not extract domain from: {}", site);
        }
    }
    
    println!("Total domains to block: {}", domains_added.len());

    // Write back to hosts file using sudo/pkexec
    let new_content = lines.join("\n");
    println!("Writing hosts file with {} lines", lines.len());
    println!("Domains being blocked: {:?}", domains_added);
    write_hosts_with_sudo(&new_content)?;
    println!("Hosts file written successfully");
    
    // Verify the hosts file was written correctly
    if !domains_added.is_empty() {
        let verify_content = fs::read_to_string(HOSTS_FILE)
            .unwrap_or_default();
        if verify_content.contains(&domains_added[0]) {
            println!("Verification: Hosts file contains blocked domains");
        } else {
            println!("Warning: Verification failed - hosts file may not contain blocked domains");
        }
    }

    // Flush DNS cache using sudo -n (non-interactive, should work if auth is fresh)
    let flush_commands = vec![
        ("resolvectl", vec!["flush-caches"]),
        ("systemd-resolve", vec!["--flush-caches"]),
    ];

    for (cmd, args) in flush_commands {
        let _ = Command::new("sudo")
            .arg("-n")
            .arg(cmd)
            .args(args)
            .output();
    }

    println!("DNS cache flushed");

    Ok(())
}

pub fn unblock_sites() -> Result<(), String> {
    // Read current hosts file
    let hosts_content = fs::read_to_string(HOSTS_FILE)
        .map_err(|e| format!("Failed to read hosts file: {}", e))?;

    // Remove Focus app blocks
    let lines: Vec<String> = hosts_content
        .lines()
        .filter(|line| {
            !line.contains(BLOCK_MARKER) && 
            !(line.starts_with("127.0.0.1") && line.contains("# Focus"))
        })
        .map(|s| s.to_string())
        .collect();

    // Write back to hosts file using sudo (with authentication check)
    let new_content = lines.join("\n");
    write_hosts_with_sudo(&new_content)?;
    
    // Flush DNS cache
    let flush_commands = vec![
        ("resolvectl", vec!["flush-caches"]),
        ("systemd-resolve", vec!["--flush-caches"]),
    ];

    for (cmd, args) in flush_commands {
        let _ = Command::new("sudo")
            .arg("-n")
            .arg(cmd)
            .args(args)
            .output();
    }

    Ok(())
}

fn extract_domain(url_or_domain: &str) -> String {
    let mut cleaned = url_or_domain.trim().to_lowercase();
    
    // Remove protocol if present
    if cleaned.starts_with("https://") {
        cleaned = cleaned.strip_prefix("https://").unwrap_or(&cleaned).to_string();
    } else if cleaned.starts_with("http://") {
        cleaned = cleaned.strip_prefix("http://").unwrap_or(&cleaned).to_string();
    }
    
    // Remove www. prefix
    if cleaned.starts_with("www.") {
        cleaned = cleaned.strip_prefix("www.").unwrap_or(&cleaned).to_string();
    }
    
    // Take the first part (domain) before any path
    cleaned
        .split('/')
        .next()
        .unwrap_or(&cleaned)
        .split(':')
        .next()
        .unwrap_or(&cleaned)
        .to_string()
}
