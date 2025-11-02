import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createTray, destroyTray } from "./tray.js";
import { startScheduler, stopScheduler, closeAllOverlays } from "./scheduler.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// Resolve app icon path for dev and production (macOS PNG/ICNS)
function resolveIconPath() {
  if (!app.isPackaged) {
    // Dev: use source asset
    return path.resolve(__dirname, "../src/assets/app-icon.png");
  }
  // Packaged: prefer assets inside resources, fallback to ICNS if present
  const candidates = [
    path.join(process.resourcesPath, "assets", "app-icon.png"),
    path.join(process.resourcesPath, "app-icon.png"),
    path.join(process.resourcesPath, "icon.icns"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return undefined;
}

// ---------- MAIN WINDOW ----------
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 750,
    height: 750,
    icon: resolveIconPath(),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.loadURL("http://localhost:5173");

  mainWindow.on("close", (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  return mainWindow;
}

// ---------- APP READY ----------
app.whenReady().then(() => {
  const mainWindow = createMainWindow();
  const iconPath = resolveIconPath();
  if (process.platform === "darwin" && iconPath) {
    app.dock.setIcon(iconPath); // macOS dock icon
  }

  createTray(mainWindow);

  ipcMain.on("start-scheduler", (event, data) => {
    stopScheduler();
    closeAllOverlays();
    const breakInterval = data.breakInterval || 30;
    const blinkInterval = data.blinkInterval || 20;
    startScheduler({ breakInterval, blinkInterval });
  });

  // FIX: Actually call stopScheduler when stop button is clicked
  ipcMain.on("stop-scheduler", () => {
    stopScheduler();
    closeAllOverlays();

    // Notify renderer that scheduler stopped
  mainWindow.webContents.send("scheduler-state-changed", {
    running: false,
    breakInterval: 30, // Keep current values
    blinkInterval: 20,
  });
  });

  // FIX: handle close-overlay from renderer (skip button)
  ipcMain.on("close-overlay", () => {
    closeAllOverlays();
  });
});


// ---------- CLEANUP ----------
app.on("before-quit", () => {
  destroyTray();
  stopScheduler();
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});