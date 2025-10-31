# Installation Instructions for Focus App Polkit Policy

This policy file allows the Focus app to modify `/etc/hosts` using Polkit (GUI password prompt).

## Installation

Run these commands in your terminal:

```bash
sudo cp src-tauri/polkit-policy/focus.policy /usr/share/polkit-1/actions/com.focus.write-hosts.policy
sudo chmod 644 /usr/share/polkit-1/actions/com.focus.write-hosts.policy
```

**Note:** The policy file must be named `com.focus.write-hosts.policy` (matching the action ID in the XML).

After installation, restart the Focus app and the GUI password prompt should work correctly.

## Alternative Solution

If you don't want to install the policy file, you can run the app from a terminal with:
```bash
sudo ./focus
```

This will use sudo authentication instead of Polkit.

