import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createTray, destroyTray } from "./tray.js";
import { startScheduler, stopScheduler, closeAllOverlays } from "./scheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let isFirstLaunch = true; // Track first open

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
    show: false, // initially hidden
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

  // Instead of quitting, hide the window when closed
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin') {
      event.preventDefault();
      mainWindow.hide();
    } else {
      app.quit();
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

  // Optional: hide Dock icon for macOS (true background app)
  // Uncomment below if you want it to only live in tray
  // if (process.platform === "darwin") app.dock.hide();

  // We need to listen for the activate event on macOS in your main.js (or background.js) and recreate the window if there’s none currently open.
  app.on('activate', () => {
    // On macOS, recreate a window when the dock icon is clicked
    // and there are no other windows open
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(); // replace this with your actual window creation function
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

// ---------- CLEANUP ----------
app.on("before-quit", () => {
  destroyTray();
  stopScheduler();
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
