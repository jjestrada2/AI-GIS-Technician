# OpenClaw Installation Specification (v2026.2.27)

## Document Purpose

This specification details the complete installation requirements, steps, and platform-specific considerations for OpenClaw v2026.2.27. This document is used by installer development teams to build cross-platform GUI installers.

---

## 1. System Requirements

### Runtime

- **Node.js**: Version ≥ 22.12.0 (minimum 22.x series)
- **Package Manager**: pnpm 10.23.0 (primary), npm 10+, or Bun (optional for CLI-only)
  - **NOTE**: Bun is **NOT recommended for the Gateway runtime** (known WhatsApp/Telegram bugs)
  - Preferred: Node + pnpm or npm for full stability

### Operating Systems

- **macOS**: 10.13+ (Sparkle auto-updates for released builds)
- **Linux**: Ubuntu 20.04+ (systemd user services), Fedora/RHEL, Debian
- **Windows**: WSL2 Ubuntu recommended (native Windows support planned)
- **Raspberry Pi**: ARM-based Linux (tested)
- **iOS/Android**: Native companion apps (separate build)

### Network & Permissions

- Internet connectivity (required for onboarding, model APIs, messaging channels)
- For daemon/service mode: ability to create user systemd services (Linux) or launchd agents (macOS)
- TCC permissions on macOS (Notifications, Accessibility, Screen Recording, Microphone, Speech Recognition, Automation)

---

## 2. Package Information

### NPM Registry Details

- **Package Name**: `openclaw`
- **Published On**: npm registry (https://www.npmjs.com/package/openclaw)
- **Distribution Tags**:
  - `latest`: stable releases (tagged versions like `vYYYY.M.D`)
  - `beta`: prerelease versions (tagged like `vYYYY.M.D-beta.N`)
  - `dev`: moving head of main branch
- **Current Version**: 2026.2.27
- **License**: MIT
- **Repository**: https://github.com/openclaw/openclaw

### Exported Binaries

- **CLI Entry**: `openclaw` (global command after install)
- **Binary Path After Install**:
  - macOS/Linux: `$(npm prefix -g)/bin/openclaw`
  - Windows: `$(npm prefix -g)\openclaw.cmd` (via npm/pnpm)
  - From source: linked via `pnpm link --global`

### Files Included in Package

```
- dist/                    # Compiled JavaScript (TypeScript transpiled)
- extensions/              # Official channel plugins (Discord, Slack, Telegram, etc.)
- docs/                    # Documentation files
- assets/                  # UI assets and resources
- skills/                  # CLI skill definitions
- CHANGELOG.md
- LICENSE
- README.md
- openclaw.mjs            # Main CLI entry point (ESM)
```

---

## 3. Installation Methods

### Method A: Installer Script (Recommended for End Users)

#### 3.1 macOS / Linux / WSL2

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

**What it does**:

1. Detects OS (macOS/Linux)
2. Installs Homebrew if missing (macOS only)
3. Installs Node 22 via Homebrew (macOS) or NodeSource setup (Linux apt/dnf/yum)
4. Installs Git if missing
5. Installs OpenClaw via npm (global) by default
6. Runs `openclaw doctor` on upgrades
7. Launches onboarding wizard (if TTY available)
8. Sets `SHARP_IGNORE_GLOBAL_LIBVIPS=1` by default

**Variants**:

```bash
# Skip onboarding
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard

# Use git install method (clone repo, pnpm install, build)
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git

# Beta version
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta

# Dry run (preview, no changes)
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --dry-run
```

**Environment Variables**:

- `OPENCLAW_INSTALL_METHOD=git|npm`
- `OPENCLAW_VERSION=latest|beta|next|<version>`
- `OPENCLAW_GIT_DIR=<path>` (checkout directory, default: ~/openclaw)
- `OPENCLAW_NO_ONBOARD=1` (skip onboarding)
- `SHARP_IGNORE_GLOBAL_LIBVIPS=0|1` (default: 1)

#### 3.2 Windows (PowerShell)

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

**What it does**:

1. Requires PowerShell 5+
2. Installs Node 22 via winget → Chocolatey → Scoop (in fallback order)
3. Installs OpenClaw via npm (global) by default
4. Installs wrapper at `%USERPROFILE%\.local\bin\openclaw.cmd`
5. Adds PATH entry if needed
6. Runs `openclaw doctor --non-interactive`

**Variants**:

```powershell
# Skip onboarding
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard

# Git install
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git

# Beta
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta

# Dry run
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
```

**Environment Variables**:

- `OPENCLAW_INSTALL_METHOD=git|npm`
- `OPENCLAW_GIT_DIR=<path>` (default: %USERPROFILE%\openclaw)
- `OPENCLAW_NO_ONBOARD=1`

---

### Method B: NPM / pnpm Global Install

For users who already have Node 22+ and want to manage the install manually.

#### 3.2.1 Using npm

```bash
npm install -g openclaw@latest
npm install -g openclaw@beta        # Beta version

# After install, run onboarding to set up daemon
openclaw onboard --install-daemon
```

**Sharp build issues workaround**:

```bash
# If sharp fails due to libvips, force prebuilt binaries:
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

#### 3.2.2 Using pnpm

```bash
pnpm add -g openclaw@latest

# Approve build scripts when prompted
pnpm approve-builds -g        # Select openclaw, node-llama-cpp, sharp

# After install
openclaw onboard --install-daemon
```

**Note**: pnpm requires explicit build script approval via interactive `pnpm approve-builds -g`.

---

### Method C: Build from Source (Development)

For contributors or self-hosted deployments.

#### 3.3.1 Clone and Build

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw

pnpm install                    # Install dependencies
pnpm ui:build                   # Build Control UI (auto-installs on first run)
pnpm build                      # Compile TypeScript → dist/
```

#### 3.3.2 Global Link (CLI Access)

```bash
# Make 'openclaw' command globally available
pnpm link --global

# Alternatively, run commands without global install:
pnpm openclaw ...               # From inside repo
```

#### 3.3.3 Onboarding

```bash
openclaw onboard --install-daemon
```

---

### Method D: Local Prefix Install (install-cli.sh)

For environments requiring no system Node dependency or no-root install.

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

**What it does**:

1. Downloads Node 22 tarball to `~/.openclaw/tools/node-v<version>`
2. Verifies SHA-256
3. Installs OpenClaw under `~/.openclaw` prefix
4. Writes wrapper to `~/.openclaw/bin/openclaw`
5. Optional: runs onboarding

**Variants**:

```bash
# Custom prefix and version
curl -fsSL https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest

# With onboarding
curl -fsSL https://openclaw.ai/install-cli.sh | bash -s -- --onboard

# JSON output (automation)
curl -fsSL https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
```

---

## 4. Post-Installation Configuration

### 4.1 Verify Installation

```bash
node -v                        # Should be v22.x.x or higher
npm -v                         # Check npm is available
openclaw --version             # Verify CLI is in PATH
```

### 4.2 PATH Setup (if `openclaw: command not found`)

```bash
# Find npm global prefix
npm prefix -g

# Add to PATH (macOS/Linux ~/.zshrc or ~/.bashrc)
export PATH="$(npm prefix -g)/bin:$PATH"

# Windows: Add $(npm prefix -g) to System → Environment Variables → PATH
```

### 4.3 Daemon/Service Installation

```bash
# Primary method (interactive wizard)
openclaw onboard --install-daemon

# Alternative (CLI)
openclaw gateway install

# Or as part of configure
openclaw configure
```

**Platform Details**:

- **macOS**: LaunchAgent at `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
- **Linux**: systemd user service at `~/.config/systemd/user/openclaw-gateway.service`
- **Windows (WSL2)**: systemd user service inside WSL

### 4.4 Configuration Files Created

After onboarding, these paths are created:

- `~/.openclaw/openclaw.json` — main configuration
- `~/.openclaw/credentials/` — encrypted API keys (GitHub, OpenAI, etc.)
- `~/.openclaw/sessions/` — conversation transcripts
- `~/.openclaw/workspace/` — workspace data
- `~/.openclaw/exec-approvals.json` — macOS system.run approval list (macOS only)

### 4.5 Environment Variables

Optional overrides:

- `OPENCLAW_HOME` — home directory base (default: ~/.openclaw)
- `OPENCLAW_STATE_DIR` — mutable state location
- `OPENCLAW_CONFIG_PATH` — config file location
- `OPENCLAW_PROFILE` — named profile (default: empty, uses main config)

---

## 5. Platform-Specific Installation Details

### 5.1 macOS

#### Prerequisites

- Xcode Command Line Tools (optional, for from-source builds)
- Homebrew (recommended, auto-installed by script)
- Code signing certificate (if packaging for distribution)

#### Install via Script

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Homebrew auto-installs Node if missing; subsequent `npm install -g openclaw` completes the install.

#### macOS App (Bundled Gateway)

The macOS companion app (`OpenClaw.app`) includes:

- Native menu bar UI
- Embedded Gateway binary (optional, can connect to remote)
- TCC permission prompts (Notifications, Accessibility, Screen Recording, Microphone, Speech Recognition, Automation)
- Sparkle auto-update framework (signed apps only)

**Building the app** (for release):

```bash
# Set version and bundle ID
BUNDLE_ID=ai.openclaw.mac \
APP_VERSION=2026.2.27 \
APP_BUILD="$(git rev-list --count HEAD)" \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Name> (<TEAMID>)" \
scripts/package-mac-app.sh
```

Outputs:

- `dist/OpenClaw.app` — macOS app bundle
- Can be zipped for distribution: `ditto -c -k --sequesterRsrc --keepParent dist/OpenClaw.app dist/OpenClaw-2026.2.27.zip`
- Can be packaged as DMG: `scripts/create-dmg.sh dist/OpenClaw.app dist/OpenClaw-2026.2.27.dmg`

**Notarization** (for Gatekeeper):

```bash
NOTARIZE=1 NOTARYTOOL_PROFILE=openclaw-notary \
BUNDLE_ID=ai.openclaw.mac \
APP_VERSION=2026.2.27 \
APP_BUILD="$(git rev-list --count HEAD)" \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Name> (<TEAMID>)" \
scripts/package-mac-dist.sh
```

Requires:

- `SPARKLE_PRIVATE_KEY_FILE` env var (path to ed25519 private key)
- `APP_STORE_CONNECT_API_KEY_P8`, `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID` (notary credentials)

#### Daemon Management (macOS)

```bash
# Start/stop via launchctl
launchctl kickstart -k gui/$UID/ai.openclaw.gateway      # Start
launchctl bootout gui/$UID/ai.openclaw.gateway           # Stop

# Or via CLI
openclaw gateway restart
openclaw gateway status
```

---

### 5.2 Linux

#### Install via Script

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Detects Linux distro and uses appropriate package manager:

- **Ubuntu/Debian**: `apt` via NodeSource setup script
- **Fedora/RHEL**: `dnf`
- **Other**: manual Node installation may be needed

#### Daemon Installation

```bash
openclaw onboard --install-daemon
```

Creates systemd **user service** (not system-wide):

- Service file: `~/.config/systemd/user/openclaw-gateway.service`
- Enable: `systemctl --user enable openclaw-gateway`
- Start: `systemctl --user start openclaw-gateway`
- Status: `systemctl --user status openclaw-gateway`

#### Systemd Lingering (if logging out)

Ensure the service survives logout:

```bash
loginctl enable-linger $USER
```

---

### 5.3 Windows (WSL2 Recommended)

#### Prerequisites

- Windows 10/11 Build 19041+
- WSL2 enabled: `wsl --install` (from PowerShell as Admin)
- Ubuntu 22.04 LTS recommended

#### Install Inside WSL2

Open WSL2 terminal:

```bash
# Method 1: Installer script
curl -fsSL https://openclaw.ai/install.sh | bash

# Method 2: Manual npm
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

#### Enable systemd in WSL2 (required for daemon)

Edit `/etc/wsl.conf` inside WSL:

```ini
[boot]
systemd=true
```

Restart WSL from PowerShell:

```powershell
wsl --shutdown
# Re-open Ubuntu
```

#### Expose WSL Gateway to Windows (optional)

For other machines to reach the Gateway via Windows:

```powershell
# As Administrator in PowerShell
$WslIp = (wsl -- hostname -I).Trim().Split(" ")[0]
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=18789 `
  connectaddress=$WslIp connectport=18789
```

Refresh after WSL restart as needed.

---

### 5.4 Docker & Container Deployments

Official Docker images available. Minimal Dockerfile example:

```dockerfile
FROM node:22-alpine
RUN npm install -g openclaw@latest
RUN openclaw onboard --no-onboard
EXPOSE 18789
CMD ["openclaw", "gateway", "--port", "18789", "--bind", "0.0.0.0"]
```

Relevant env vars:

- `OPENCLAW_HOME` — config location (e.g., `/data/.openclaw`)
- `NODE_ENV=production` (optional)

---

## 6. Build Commands (For Development / From Source)

```bash
# Root directory commands
pnpm install                        # Install all dependencies
pnpm ui:build                       # Build Control UI (runs on first invocation automatically)
pnpm build                          # Compile TypeScript to dist/
pnpm check                          # Lint + format check
pnpm test                           # Run unit tests
pnpm test:coverage                  # Unit tests with coverage report

# macOS app
pnpm mac:package                    # Build OpenClaw.app (dev config)
pnpm mac:open                       # Open dist/OpenClaw.app in Finder

# Gateway daemon
openclaw gateway --port 18789       # Start Gateway (default port)
openclaw gateway --force            # Force port if already in use
openclaw doctor                     # Check configuration + migrate legacy settings
```

---

## 7. Gateway Runtime

### 7.1 Starting the Gateway

**Interactive (foreground)**:

```bash
openclaw gateway --port 18789 --verbose
```

**As a daemon** (recommended for production):

```bash
openclaw onboard --install-daemon
openclaw gateway status              # Check status
```

### 7.2 Gateway Ports & URLs

- **Default port**: 18789
- **Local access**: `http://127.0.0.1:18789/`
- **Control UI**: Served at gateway port (web dashboard)
- **WebSocket**: Same port for agent + node connections

### 7.3 Configuration

Main config file: `~/.openclaw/openclaw.json`

Key settings:

```json
{
  "gateway": {
    "port": 18789,
    "bind": "loopback", // "loopback" or "lan"
    "auth": "token", // "none", "token", or "password"
    "tls": {
      "enabled": false // Set true for HTTPS
    }
  },
  "update": {
    "channel": "stable", // "stable", "beta", or "dev"
    "checkOnStart": true // Check for updates on startup
  }
}
```

---

## 8. Updating OpenClaw

### 8.1 Preferred Method (Re-run Installer)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Detects existing install and upgrades in place; runs `openclaw doctor` as needed.

### 8.2 Global Install Update

```bash
npm update -g openclaw@latest
# or
pnpm add -g openclaw@latest
```

### 8.3 Source Install Update

```bash
openclaw update --channel stable

# Or manually:
git pull --rebase
pnpm install
pnpm build
openclaw doctor
openclaw gateway restart
```

### 8.4 Channel Switching

```bash
openclaw update --channel stable|beta|dev
```

---

## 9. Environment Variables (Complete List)

| Variable                      | Default                        | Description                                                                |
| ----------------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| `OPENCLAW_HOME`               | `~/.openclaw`                  | Home directory for config/credentials                                      |
| `OPENCLAW_STATE_DIR`          | `$OPENCLAW_HOME/state`         | Mutable state location                                                     |
| `OPENCLAW_CONFIG_PATH`        | `$OPENCLAW_HOME/openclaw.json` | Config file location                                                       |
| `OPENCLAW_PROFILE`            | (none)                         | Named profile suffix                                                       |
| `OPENCLAW_INSTALL_METHOD`     | `npm`                          | `npm` or `git` (installer scripts)                                         |
| `OPENCLAW_NO_ONBOARD`         | (unset)                        | Skip onboarding if set to `1`                                              |
| `OPENCLAW_VERSION`            | `latest`                       | npm version or dist-tag                                                    |
| `SHARP_IGNORE_GLOBAL_LIBVIPS` | `1`                            | Avoid system libvips (for sharp)                                           |
| `NODE_EXTRA_CA_CERTS`         | (unset)                        | Custom CA cert path (macOS launchd sets to `/etc/ssl/cert.pem` by default) |
| `NODE_ENV`                    | (unset)                        | Can set to `production` for optimization                                   |

---

## 10. CLI Commands (Quick Reference)

```bash
# Onboarding & setup
openclaw onboard                    # Interactive setup wizard
openclaw onboard --install-daemon   # Install daemon service
openclaw configure                  # Interactive config editor
openclaw doctor                     # Check + repair configuration

# Gateway management
openclaw gateway                    # Start gateway (foreground)
openclaw gateway --port 18789       # Custom port
openclaw gateway --force            # Force port if busy
openclaw gateway status             # Check running status
openclaw gateway restart            # Restart daemon
openclaw gateway install            # Install systemd/launchd service
openclaw gateway stop               # Stop daemon

# Usage
openclaw message send --to <number> --message "text"
openclaw agent --message "Hello"
openclaw dashboard                  # Open Control UI

# Utilities
openclaw --version                  # Show version
openclaw update                     # Update to latest (source installs)
openclaw update --channel beta      # Switch to beta
openclaw doctor --non-interactive   # Non-interactive repair
```

---

## 11. Verification After Installation

### 11.1 Basic Checks

```bash
# Verify Node
node -v                            # Should show v22.x.x+

# Verify CLI installation
openclaw --version                 # Should show 2026.2.27

# Verify PATH (if openclaw not found)
echo $PATH | grep -o "$(npm prefix -g)/bin"
```

### 11.2 Gateway Health

```bash
openclaw doctor                    # Full diagnostic
openclaw gateway status            # Running status
openclaw dashboard                 # Open web UI (if running)
```

### 11.3 Onboarding

```bash
openclaw onboard --install-daemon
# Follow interactive prompts for:
# - Model selection (Claude/GPT/Gemini)
# - API key authentication
# - Channel setup (WhatsApp/Telegram/Discord/etc.)
# - Daemon service installation
```

---

## 12. macOS App Distribution Artifacts

### 12.1 Build Outputs

- `dist/OpenClaw.app/` — Signed app bundle
- `OpenClaw-2026.2.27.zip` — Zipped for delta updates (Sparkle)
- `OpenClaw-2026.2.27.dmg` — User-friendly disk image
- `OpenClaw-2026.2.27.dSYM.zip` — Debug symbols

### 12.2 Code Signing & Notarization

- **Signing cert**: Developer ID Application (release builds)
- **Notarization**: Optional, required for auto-updates on newer macOS
- **Sparkle feed**: `appcast.xml` (in repo root, signed entries)
- **Public key**: Baked into Info.plist

### 12.3 Publishing

- Upload zip + dSYM to GitHub Release for tag `v2026.2.27`
- Update `appcast.xml` with signed entry
- Verify with `curl -I` on both appcast and zip URLs
- Test update flow from previous version

---

## 13. Troubleshooting Quick Reference

### "openclaw: command not found"

```bash
npm prefix -g                       # Find npm global prefix
echo $PATH                          # Check if prefix/bin is in PATH
# Add to shell rc file:
export PATH="$(npm prefix -g)/bin:$PATH"
```

### Node version issues

```bash
node -v                            # Should be v22.12.0+
# If too old, reinstall Node (Homebrew/apt/brew/winget)
```

### `EACCES` permission errors on Linux

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
export PATH="~/.npm-global/bin:$PATH"
# Add export to ~/.bashrc or ~/.zshrc
```

### sharp build failures

```bash
# Prebuilt binary workaround
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

### Gateway won't start

```bash
openclaw doctor                    # Run full diagnostics
lsof -i :18789                     # Check if port is in use
openclaw gateway --force --port 18790  # Use different port if needed
```

---

## 14. Installer GUI Implementation Checklist

For teams building cross-platform GUI installers, use this as the step-by-step flow:

- [ ] **System check**: Verify Node 22+ installed; offer to install if missing
- [ ] **Package manager check**: Verify pnpm/npm/bun available
- [ ] **Download**: Fetch openclaw@latest from npm or git clone
- [ ] **Install globally**: `npm install -g openclaw@latest` or equiv.
- [ ] **Verify PATH**: Check openclaw binary is accessible, update PATH if needed
- [ ] **Run doctor**: `openclaw doctor` to validate environment
- [ ] **Onboarding**: Launch `openclaw onboard --install-daemon` (optional, can be deferred)
- [ ] **Create daemon**: Install launchd (macOS) or systemd (Linux) service
- [ ] **Verify daemon**: Run `openclaw gateway status` to confirm service installed
- [ ] **Summary screen**: Display success, next steps, relevant docs links

---

## 15. Version & Release Information

- **Current Release**: 2026.2.27 (stable)
- **Release Date**: February 27, 2026
- **Changelog**: See `CHANGELOG.md` in repo root
- **Latest npm**: `npm view openclaw version --userconfig "$(mktemp)"`
- **Beta availability**: Check npm dist-tags or GitHub releases

---

## 16. References & Documentation

- **Official Docs**: https://docs.openclaw.ai
- **GitHub Repo**: https://github.com/openclaw/openclaw
- **Getting Started**: https://docs.openclaw.ai/start/getting-started
- **Install Guide**: https://docs.openclaw.ai/install
- **Gateway Docs**: https://docs.openclaw.ai/gateway
- **Platform-specific**:
  - macOS: https://docs.openclaw.ai/platforms/macos
  - Linux: https://docs.openclaw.ai/platforms/linux
  - Windows (WSL2): https://docs.openclaw.ai/platforms/windows
  - iOS: https://docs.openclaw.ai/platforms/ios
  - Android: https://docs.openclaw.ai/platforms/android
- **Updating**: https://docs.openclaw.ai/install/updating
- **Discord**: https://discord.gg/clawd

---

## End of Specification

This document is accurate as of OpenClaw v2026.2.27. See `CHANGELOG.md` and official docs for updates to newer versions.
