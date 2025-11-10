import { app, BrowserWindow, ipcMain, screen } from "electron";
import { rebuildTray } from "./tray.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createTray, destroyTray } from "./tray.js";
import { startScheduler, stopScheduler, closeAllOverlays } from "./scheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let isFirstLaunch = true;
let isQuitting = false; // 

// ---------- ICON PATH RESOLUTION ----------
function resolveIconPath() {
  if (!app.isPackaged) {
    return path.resolve(__dirname, "../src/assets/app-icon.png");
  }
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

// ---------- CREATE MAIN WINDOW ----------
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

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5173");
  }

  mainWindow.once("ready-to-show", () => {
    if (isFirstLaunch) {
      mainWindow.show();
      isFirstLaunch = false;
    }
  });

  // Only prevent close if NOT quitting
  mainWindow.on('close', (event) => {
    if (!isQuitting && process.platform === 'darwin') {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  return mainWindow;
}

// ---------- APP READY ----------
app.whenReady().then(() => {
  const mainWindow = createMainWindow();
  const iconPath = resolveIconPath();
  
  if (process.platform === "darwin" && iconPath) {
    app.dock.setIcon(iconPath);
  }

  createTray(mainWindow);

  // Fix for macOS tray disappearing when monitors change
  if (process.platform === "darwin") {
    screen.on("display-added", () => rebuildTray(mainWindow));
    screen.on("display-removed", () => rebuildTray(mainWindow));
    screen.on("display-metrics-changed", () => rebuildTray(mainWindow));
  }

  // Activate event for macOS
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      const win = BrowserWindow.getAllWindows()[0];
      if (win) {
        win.show();
      }
    }
  });

  // ---- IPC: Scheduler start/stop logic ----
  ipcMain.on("start-scheduler", (event, data) => {
    stopScheduler();
    closeAllOverlays();
    const breakInterval = data.breakInterval || 30;
    const blinkInterval = data.blinkInterval || 20;
    startScheduler({ breakInterval, blinkInterval });
  });

  ipcMain.on("stop-scheduler", () => {
    stopScheduler();
    closeAllOverlays();
    mainWindow.webContents.send("scheduler-state-changed", {
      running: false,
      breakInterval: 30,
      blinkInterval: 20,
    });
  });

  ipcMain.on("close-overlay", () => {
    closeAllOverlays();
  });
});

// Set quitting flag before cleanup
app.on("before-quit", () => {
  isQuitting = true;
  destroyTray();
  stopScheduler();
});

// Remove the window-all-closed prevention
// On macOS, apps should stay open even with no windows (tray app behavior)
// But when isQuitting is true, we let it quit normally
app.on("window-all-closed", () => {
  if (process.platform !== "darwin" || isQuitting) {
    app.quit();
  }
});