# OpenClaw GUI Installer

An Electron-based cross-platform GUI installer for [OpenClaw](https://github.com/openclaw/openclaw).

## Prerequisites

- **Node.js 18+** (for running Electron dev mode)
- **npm** or **pnpm**

## Development

```bash
cd installer

# Install dependencies
npm install

# Run the installer in dev mode
npm start
```

## Building Distributable Packages

```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build:mac      # macOS (DMG — arm64 + x64)
npm run build:win      # Windows (NSIS installer — x64)
npm run build:linux    # Linux (AppImage — x64)

# Build for all platforms (requires cross-compilation support)
npm run build:all
```

Built artifacts are written to `dist/`.

## Project Structure

```
installer/
├── assets/
│   ├── README.md               # Icon generation instructions
│   └── entitlements.mac.plist  # macOS entitlements for hardened runtime
├── scripts/
│   ├── build-all.sh            # CI build script (macOS/Linux)
│   └── build-all.ps1           # CI build script (Windows)
├── src/
│   ├── main.js                 # Electron main process + IPC handlers
│   ├── preload.js              # Context bridge (renderer ↔ main)
│   ├── index.html              # UI markup (4 screens)
│   ├── renderer.js             # UI logic + install flow orchestration
│   └── styles.css              # Dark theme styling
├── electron-builder.yml        # Electron Builder packaging config
├── package.json
├── RELEASE.md                  # Release process documentation
└── README.md                   # This file
```

## How It Works

The installer walks through four steps:

1. **Check Node.js** — verifies `node --version` is v22+
2. **Install OpenClaw** — runs `npm install -g openclaw`
3. **Run Setup** — runs `openclaw onboard --install-daemon`
4. **Verify** — runs `openclaw doctor`

Each step streams stdout/stderr from child processes back to the renderer via IPC, displayed in a terminal-style log area. On Windows, a WSL2 notice is shown since OpenClaw works best under WSL2.

## UI Screens

| Screen   | Description                                             |
| -------- | ------------------------------------------------------- |
| Welcome  | Logo, description, "Begin Installation" button          |
| Progress | Step list with status icons, progress bar, terminal log |
| Success  | Green checkmark, "Launch OpenClaw" + "Close" buttons    |
| Error    | Red X, error details, "Retry" + "Quit" buttons          |

## Icons

Before building distributable packages, place icon files in `assets/`. See `assets/README.md` for generation instructions.
