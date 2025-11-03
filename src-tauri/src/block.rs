use std::fs;
use std::process::Command;

const HOSTS_FILE: &str = "/etc/hosts";
const BLOCK_MARKER: &str = "# Focus app blocked sites";

fn write_hosts_with_sudo(content: &str) -> Result<(), String> {
    let output = Command::new("sudo")
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
        .map_err(|e| format!("Failed to execute sudo command. Error: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);

        let error_msg = if stderr.contains("password is required")
            || stderr.contains("a password is required")
        {
            "Authorization not configured. Please complete the onboarding process or run: sudo -v"
        } else if stderr.contains("Authentication Failure")
            || stderr.contains("authentication")
        {
            "Authentication failed. Please ensure you're entering the correct password for your user account."
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
            println!("? Verification: Hosts file contains blocked domains");
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
            println!("? Warning: Verification failed - hosts file may not contain blocked domains");
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
    let restart_output = Command::new("sudo")
        .arg("-n")
        .arg("systemctl")
        .arg("restart")
        .arg("systemd-resolved")
        .output();
    match restart_output {
        Ok(o) if o.status.success() => println!("? systemd-resolved restarted successfully"),
        Ok(o) => println!(
            "? systemd-resolved restart failed: {}",
            String::from_utf8_lossy(&o.stderr)
        ),
        Err(e) => println!("? Could not restart systemd-resolved: {}", e),
    }

    // DNS flush commands - try without sudo first, then with passwordless sudo
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
        
        // If that fails, use passwordless sudo
        let _ = Command::new("sudo").arg("-n").arg(cmd).args(args).output();
    }

    // Try to restart nscd (not critical if it fails)
    let _ = Command::new("sudo")
        .arg("-n")
        .arg("systemctl")
        .arg("restart")
        .arg("nscd")
        .output();

    println!("DNS cache flushed and systemd-resolved restarted");
    println!("? IMPORTANT: Please restart your browser for site blocking to take effect!");
    println!("   Browsers cache DNS and may not respect hosts file changes immediately.");

    if !domains_added.is_empty() {
        let verify_content = fs::read_to_string(HOSTS_FILE).unwrap_or_default();
        let domain_to_check = &domains_added[0];
        if verify_content.contains(domain_to_check) && verify_content.contains("0.0.0.0") {
            println!("? Hosts file verified: {} is blocked", domain_to_check);
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
    let restart_output = Command::new("sudo")
        .arg("-n")
        .arg("systemctl")
        .arg("restart")
        .arg("systemd-resolved")
        .output();
    match restart_output {
        Ok(o) if o.status.success() => println!("? systemd-resolved restarted successfully"),
        Ok(o) => println!(
            "? systemd-resolved restart failed: {}",
            String::from_utf8_lossy(&o.stderr)
        ),
        Err(e) => println!("? Could not restart systemd-resolved: {}", e),
    }

  
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
        
        // If that fails, use passwordless sudo
        let _ = Command::new("sudo").arg("-n").arg(cmd).args(args).output();
    }

    // Try to restart nscd (not critical if it fails)
    let _ = Command::new("sudo")
        .arg("-n")
        .arg("systemctl")
        .arg("restart")
        .arg("nscd")
        .output();

    println!("DNS cache flushed and systemd-resolved restarted");
    println!("? IMPORTANT: You may need to refresh your browser or clear its DNS cache for sites to work immediately!");
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
