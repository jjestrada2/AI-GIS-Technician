const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("installer", {
  // Commands
  checkNode: () => ipcRenderer.invoke("check-node"),
  installOpenclaw: () => ipcRenderer.invoke("install-openclaw"),
  runOnboard: () => ipcRenderer.invoke("run-onboard"),
  runDoctor: () => ipcRenderer.invoke("run-doctor"),
  getPlatform: () => ipcRenderer.invoke("get-platform"),
  launchOpenclaw: () => ipcRenderer.invoke("launch-openclaw"),

  // Event listeners
  onProgress: (callback) => {
    ipcRenderer.on("progress", (_event, data) => callback(data));
  },

  // Remove all progress listeners (for cleanup)
  removeProgressListeners: () => {
    ipcRenderer.removeAllListeners("progress");
  },
});
