const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn, exec } = require("child_process");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 480,
    resizable: false,
    frame: process.platform === "darwin",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : undefined,
    backgroundColor: "#2a4459",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  void mainWindow.loadFile(path.join(__dirname, "index.html"));
}

void app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- IPC Handlers ---

ipcMain.handle("get-platform", () => {
  return {
    platform: process.platform,
    arch: process.arch,
    isWSL: false,
  };
});

/**
 * Run a shell command, streaming stdout/stderr back to the renderer via IPC events.
 * Returns a promise that resolves with { code, stdout, stderr }.
 */
function runCommand(command, args, env) {
  return new Promise((resolve, reject) => {
    const mergedEnv = { ...process.env, ...env };

    // On Windows, use shell mode so global npm bins resolve via PATH
    const shell = process.platform === "win32";

    const child = spawn(command, args, {
      env: mergedEnv,
      shell,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("progress", text);
      }
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("progress", text);
      }
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

/**
 * Parse a semver-like version string "vX.Y.Z" and return the major version number.
 */
function parseNodeMajor(versionStr) {
  const match = versionStr.trim().match(/^v?(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Step 1: Check Node.js
ipcMain.handle("check-node", async () => {
  try {
    const result = await runCommand("node", ["--version"]);
    if (result.code !== 0) {
      return {
        ok: false,
        error: "Node.js is not installed or not in PATH.",
        version: null,
      };
    }
    const version = result.stdout.trim();
    const major = parseNodeMajor(version);
    if (major < 22) {
      return {
        ok: false,
        error: `Node.js ${version} found, but version 22+ is required. Please update at https://nodejs.org`,
        version,
      };
    }
    return { ok: true, version, error: null };
  } catch (err) {
    return {
      ok: false,
      error: `Node.js not found: ${err.message}. Install it from https://nodejs.org`,
      version: null,
    };
  }
});

/**
 * Run a command with elevated privileges using the platform's native auth dialog.
 * - macOS: osascript (shows a standard macOS password prompt)
 * - Linux:  pkexec
 * - Windows: runs via cmd with UAC (electron handles UAC natively on win32)
 */
function runElevated(command) {
  return new Promise((resolve) => {
    let elevated;

    if (process.platform === "darwin") {
      // Escape double-quotes inside the shell command string
      const escaped = command.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      elevated = `osascript -e 'do shell script "${escaped}" with administrator privileges'`;
    } else if (process.platform === "linux") {
      elevated = `pkexec ${command}`;
    } else {
      // Windows — prepend cmd /c; UAC is triggered by electron-builder's manifest
      elevated = `cmd /c ${command}`;
    }

    exec(elevated, (error, _stdout, stderr) => {
      if (error) {
        resolve({
          ok: false,
          error: `Install failed (elevated): ${error.message}\n${stderr || ""}`,
        });
      } else {
        resolve({ ok: true, error: null });
      }
    });
  });
}

// Step 2: Install OpenClaw via npm
ipcMain.handle("install-openclaw", async () => {
  try {
    const result = await runCommand("npm", ["install", "-g", "openclaw"]);
    if (result.code === 0) {
      return { ok: true, error: null };
    }

    // Permission error — retry with elevated privileges (shows native OS auth dialog)
    const needsElevation =
      result.stderr.includes("EACCES") ||
      result.stderr.includes("permission denied") ||
      result.stderr.includes("errno -13");

    if (needsElevation) {
      return await runElevated("npm install -g openclaw");
    }

    return {
      ok: false,
      error: `npm install failed (exit ${result.code}):\n${result.stderr}`,
    };
  } catch (err) {
    return { ok: false, error: `Install failed: ${err.message}` };
  }
});

// Step 3: Run onboard
ipcMain.handle("run-onboard", async () => {
  try {
    const result = await runCommand("openclaw", ["onboard", "--install-daemon"]);
    if (result.code !== 0) {
      return {
        ok: false,
        error: `Onboard failed (exit ${result.code}):\n${result.stderr}`,
      };
    }
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: `Onboard failed: ${err.message}` };
  }
});

// Step 4: Verify with openclaw doctor
ipcMain.handle("run-doctor", async () => {
  try {
    const result = await runCommand("openclaw", ["doctor"]);
    if (result.code !== 0) {
      return {
        ok: false,
        error: `Doctor check returned warnings (exit ${result.code}):\n${result.stdout}${result.stderr}`,
      };
    }
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: `Doctor check failed: ${err.message}` };
  }
});

// Launch openclaw gateway
ipcMain.handle("launch-openclaw", async () => {
  try {
    const child = spawn("openclaw", ["gateway", "--port", "18789"], {
      detached: true,
      stdio: "ignore",
      shell: process.platform === "win32",
    });
    child.unref();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
