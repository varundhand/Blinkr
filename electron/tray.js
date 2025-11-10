import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Tray, Menu, app, nativeImage } from "electron";
import { getNextBreakTime, startScheduler, stopScheduler } from "./scheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray = null;
let trayInterval = null;
let currentBreakInterval = 30;
let currentBlinkInterval = 20;
let isRunning = false;

// Simplified tray icon resolution
function resolveTrayIconPath() {
  if (!app.isPackaged) {
    // Development: iconTemplate.png is in electron folder
    const devIcon = path.join(__dirname, "iconTemplate.png");
    if (fs.existsSync(devIcon)) {
      return devIcon;
    }
  } else {
    // Production: check resources
    const prodPaths = [
      path.join(process.resourcesPath, "iconTemplate.png"),
      path.join(process.resourcesPath, "assets", "iconTemplate.png"),
    ];
    
    for (const iconPath of prodPaths) {
      if (fs.existsSync(iconPath)) {
        return iconPath;
      }
    }
  }
  
  console.error("❌ Tray icon not found!");
  return null;
}

export function createTray(mainWindow) {
  const iconPath = resolveTrayIconPath();
  
  if (!iconPath) {
    console.error("❌ Could not resolve tray icon path. Tray will not be created.");
    return;
  }
  
  console.log("✅ Creating tray with icon:", iconPath);
  
  try {
    // Use nativeImage to create the icon - this ensures proper rendering
    const icon = nativeImage.createFromPath(iconPath);
    
    // For macOS, mark as template image
    if (process.platform === "darwin") {
      icon.setTemplateImage(true);
    }
    
    tray = new Tray(icon);
    tray.setToolTip("Blinkr");
    
    // Additional macOS-specific settings
    if (process.platform === "darwin") {
      tray.setIgnoreDoubleClickEvents(true);
    }
    
    console.log("✅ Tray created successfully!");
  } catch (error) {
    console.error("❌ Failed to create tray:", error);
    return;
  }

  function formatTime(ms) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function updateSchedule(breakInterval, blinkInterval) {
    currentBreakInterval = breakInterval;
    currentBlinkInterval = blinkInterval;
    isRunning = true;
    
    stopScheduler();
    startScheduler({ breakInterval, blinkInterval });

    mainWindow.webContents.send("scheduler-state-changed", {
      running: true,
      breakInterval,
      blinkInterval,
    });
  }

  function updateMenuAndTooltip() {
    if (!tray || tray.isDestroyed()) return;
    
    const nextBreakTime = getNextBreakTime();
    let timeLeft = "Not started";

    if (nextBreakTime) {
      const diffMs = nextBreakTime - Date.now();
      if (diffMs > 0) {
        timeLeft = `${formatTime(diffMs)} left`;
      } else {
        timeLeft = "Break starting soon...";
      }
    }

    tray.setToolTip(`Next break: ${timeLeft}`);

    const contextMenu = Menu.buildFromTemplate([
      { label: `Next break: ${timeLeft}`, enabled: false },
      { type: "separator" },
      {
        label: "Break Interval",
        submenu: [
          {
            label: "30 minutes",
            type: "radio",
            checked: currentBreakInterval === 30,
            click: () => updateSchedule(30, currentBlinkInterval),
          },
          {
            label: "40 minutes",
            type: "radio",
            checked: currentBreakInterval === 40,
            click: () => updateSchedule(40, currentBlinkInterval),
          },
          {
            label: "50 minutes",
            type: "radio",
            checked: currentBreakInterval === 50,
            click: () => updateSchedule(50, currentBlinkInterval),
          },
        ],
      },
      {
        label: "Blink Interval",
        submenu: [
          {
            label: "20 minutes",
            type: "radio",
            checked: currentBlinkInterval === 20,
            click: () => updateSchedule(currentBreakInterval, 20),
          },
          {
            label: "25 minutes",
            type: "radio",
            checked: currentBlinkInterval === 25,
            click: () => updateSchedule(currentBreakInterval, 25),
          },
          {
            label: "35 minutes",
            type: "radio",
            checked: currentBlinkInterval === 35,
            click: () => updateSchedule(currentBreakInterval, 35),
          },
        ],
      },
      { type: "separator" },
      {
        label: "Settings",
        click: () => mainWindow.show(),
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          // if (trayInterval) clearInterval(trayInterval);
          // if (tray && !tray.isDestroyed()) tray.destroy();
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
  }

  updateMenuAndTooltip();
  trayInterval = setInterval(updateMenuAndTooltip, 1000);
}

// Rebuild tray when macOS displays change
export function rebuildTray(mainWindow) {
  console.log("🔄 Rebuilding tray due to display change...");
  destroyTray();
  createTray(mainWindow);
}

export function destroyTray() {
  if (trayInterval) {
    clearInterval(trayInterval);
    trayInterval = null;
  }
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
  }
  tray = null;
}