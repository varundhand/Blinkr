import path from "path";
import { fileURLToPath } from "url";
import { Tray, Menu, app, BrowserWindow } from "electron";
import { getNextBreakTime, startScheduler, stopScheduler } from "./scheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray = null;
let trayInterval = null;
let currentBreakInterval = 30; // Default values
let currentBlinkInterval = 20;
let isRunning = false; // Track if scheduler is running

export function createTray(mainWindow) {
  const iconPath = path.join(__dirname, "iconTemplate.png");
  tray = new Tray(iconPath);
  tray.setToolTip("Blinkr");

  function formatTime(ms) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function updateSchedule(breakInterval, blinkInterval) {
    currentBreakInterval = breakInterval;
    currentBlinkInterval = blinkInterval;
    isRunning = true;
    
    // Restart scheduler with new intervals
    stopScheduler();
    startScheduler({ breakInterval, blinkInterval });

    // 🔥 Notify renderer about the change
    mainWindow.webContents.send("scheduler-state-changed", {
      running: true,
      breakInterval,
      blinkInterval,
    });
  }

  function updateMenuAndTooltip() {
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

    // Update tooltip
    tray.setToolTip(`Next break: ${timeLeft}`);

    // 🔥 Rebuild menu every second so it's always fresh
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
          if (trayInterval) clearInterval(trayInterval);
          tray.destroy();
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
  }

  // Initial update
  updateMenuAndTooltip();

  // 🔥 Update BOTH menu and tooltip every second
  trayInterval = setInterval(updateMenuAndTooltip, 1000);
}

export function destroyTray() {
  if (trayInterval) clearInterval(trayInterval);
  if (tray) tray.destroy();
  tray = null;
}