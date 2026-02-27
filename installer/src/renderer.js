// --- DOM References ---
const screens = {
  welcome: document.getElementById("screen-welcome"),
  progress: document.getElementById("screen-progress"),
  success: document.getElementById("screen-success"),
  error: document.getElementById("screen-error"),
};

const elements = {
  btnBegin: document.getElementById("btn-begin"),
  btnLaunch: document.getElementById("btn-launch"),
  btnCloseSuccess: document.getElementById("btn-close-success"),
  btnRetry: document.getElementById("btn-retry"),
  btnCloseError: document.getElementById("btn-close-error"),
  progressBar: document.getElementById("progress-bar"),
  terminal: document.getElementById("terminal"),
  errorMessage: document.getElementById("error-message"),
  wslNotice: document.getElementById("wsl-notice"),
};

const steps = {
  "check-node": document.querySelector('[data-step="check-node"]'),
  install: document.querySelector('[data-step="install"]'),
  onboard: document.querySelector('[data-step="onboard"]'),
  verify: document.querySelector('[data-step="verify"]'),
};

// --- Screen Management ---
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// --- Step State Management ---
function setStepState(stepKey, state) {
  const el = steps[stepKey];
  if (!el) {
    return;
  }
  el.className = `step ${state}`;

  const iconEl = el.querySelector(".step-icon span");
  switch (state) {
    case "pending":
      iconEl.textContent = Object.keys(steps).indexOf(stepKey) + 1;
      break;
    case "running":
      iconEl.innerHTML = "&#8635;";
      break;
    case "done":
      iconEl.innerHTML = "&#10003;";
      break;
    case "failed":
      iconEl.innerHTML = "&#10007;";
      break;
  }
}

// --- Progress Bar ---
function setProgress(percent) {
  elements.progressBar.style.width = `${percent}%`;
}

// --- Terminal Log ---
function appendLog(text, type) {
  const line = document.createElement("div");
  line.className = `terminal-line${type ? ` ${type}` : ""}`;
  line.textContent = text;
  elements.terminal.appendChild(line);
  elements.terminal.scrollTop = elements.terminal.scrollHeight;
}

function clearLog() {
  elements.terminal.innerHTML = "";
}

// --- Platform Detection ---
async function detectPlatform() {
  try {
    const info = await window.installer.getPlatform();
    if (info.platform === "win32") {
      elements.wslNotice.classList.remove("hidden");
    }
  } catch {
    // Ignore — platform detection is non-critical
  }
}

// --- Installation Flow ---
async function runInstallation() {
  showScreen("progress");
  clearLog();
  setProgress(0);

  // Reset all steps
  Object.keys(steps).forEach((key) => setStepState(key, "pending"));

  // Listen for streamed progress
  window.installer.onProgress((data) => {
    appendLog(data);
  });

  try {
    // Step 1: Check Node.js
    setStepState("check-node", "running");
    appendLog("$ node --version", "success");
    setProgress(5);

    const nodeResult = await window.installer.checkNode();

    if (!nodeResult.ok) {
      setStepState("check-node", "failed");
      appendLog(`Error: ${nodeResult.error}`, "error");
      showError(nodeResult.error);
      return;
    }

    appendLog(`Node.js ${nodeResult.version} detected`, "success");
    setStepState("check-node", "done");
    setProgress(25);

    // Step 2: Install OpenClaw
    setStepState("install", "running");
    appendLog("\n$ npm install -g openclaw", "success");
    setProgress(30);

    const installResult = await window.installer.installOpenclaw();

    if (!installResult.ok) {
      setStepState("install", "failed");
      appendLog(`\nError: ${installResult.error}`, "error");
      showError(installResult.error);
      return;
    }

    appendLog("\nOpenClaw installed successfully", "success");
    setStepState("install", "done");
    setProgress(60);

    // Step 3: Run onboard
    setStepState("onboard", "running");
    appendLog("\n$ openclaw onboard --install-daemon", "success");
    setProgress(65);

    const onboardResult = await window.installer.runOnboard();

    if (!onboardResult.ok) {
      setStepState("onboard", "failed");
      appendLog(`\nError: ${onboardResult.error}`, "error");
      showError(onboardResult.error);
      return;
    }

    appendLog("\nOnboarding complete", "success");
    setStepState("onboard", "done");
    setProgress(85);

    // Step 4: Verify
    setStepState("verify", "running");
    appendLog("\n$ openclaw doctor", "success");
    setProgress(90);

    const doctorResult = await window.installer.runDoctor();

    if (!doctorResult.ok) {
      // Doctor failures are warnings, not fatal
      setStepState("verify", "done");
      appendLog(`\nWarning: ${doctorResult.error}`, "error");
      appendLog("Installation completed with warnings.", "success");
    } else {
      setStepState("verify", "done");
      appendLog("\nAll checks passed!", "success");
    }

    setProgress(100);

    // Clean up listeners
    window.installer.removeProgressListeners();

    // Brief delay to show 100%, then show success
    setTimeout(() => {
      showScreen("success");
    }, 800);
  } catch (err) {
    window.installer.removeProgressListeners();
    appendLog(`\nUnexpected error: ${err.message}`, "error");
    showError(`An unexpected error occurred: ${err.message}`);
  }
}

function showError(message) {
  window.installer.removeProgressListeners();
  elements.errorMessage.textContent = message;
  // Short delay so user can see the failed step in progress view
  setTimeout(() => {
    showScreen("error");
  }, 1500);
}

// --- Event Listeners ---
elements.btnBegin.addEventListener("click", () => {
  elements.btnBegin.disabled = true;
  void runInstallation();
});

elements.btnLaunch.addEventListener("click", async () => {
  elements.btnLaunch.disabled = true;
  elements.btnLaunch.textContent = "Launching...";
  await window.installer.launchOpenclaw();
  // Give the gateway a moment to start, then close
  setTimeout(() => window.close(), 1500);
});

elements.btnCloseSuccess.addEventListener("click", () => {
  window.close();
});

elements.btnRetry.addEventListener("click", () => {
  elements.btnBegin.disabled = false;
  void runInstallation();
});

elements.btnCloseError.addEventListener("click", () => {
  window.close();
});

// --- Init ---
void detectPlatform();
