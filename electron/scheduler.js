import { BrowserWindow, screen } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let nextBreakTime = null;
let breakTimer = null;
let blinkTimer = null;
let overlayWindows = []; // Track all overlays
let activeOverlayType = null; // Track which overlay is currently active ("break" or "blink")

function createOverlay(file) {
  // 🧠 Determine overlay type from filename
  const overlayType = file.includes("break") ? "break" : "blink";

  // 🧩 Skip creating new overlay if one is already active
  if (activeOverlayType) {
    console.log(`⚠️ Skipping ${overlayType} overlay — ${activeOverlayType} overlay already active.`);
    return;
  }

  const displays = screen.getAllDisplays();

  // Close old overlays before creating a new one (safety)
  closeAllOverlays();

  activeOverlayType = overlayType; // Mark this overlay as active

  displays.forEach((display) => {
    const { x, y, width, height } = display.bounds;

    const overlay = new BrowserWindow({
      x,
      y,
      width,
      height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      hasShadow: false,
      fullscreenable: false,
      focusable: file === "break.html",
      // 🔥 Prevent overlay from activating the app
      show: false, // Don't show immediately
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
      },
    });

    overlay.setIgnoreMouseEvents(file !== "break.html");
    overlay.setAlwaysOnTop(true, "screen-saver");
    
    // 🔥 Load file first, then show without activating the app
    overlay.loadFile(path.join(__dirname, "..", "overlays", file)).then(() => {
      overlay.showInactive(); // Show without stealing focus
    });

    overlay.setOpacity(0);
    let opacity = 0;

    const safeSetOpacity = (value) => {
      if (!overlay.isDestroyed()) overlay.setOpacity(value);
    };

    const fadeIn = setInterval(() => {
      if (overlay.isDestroyed()) return clearInterval(fadeIn);
      opacity += 0.05;
      if (opacity >= 1) clearInterval(fadeIn);
      safeSetOpacity(opacity);
    }, 50);

    // 🕒 Auto close overlay after duration
    const visibleDuration = file === "break.html" ? 20000 : 5000;

    const fadeTimeout = setTimeout(() => {
      fadeOutAndClose(overlay);
    }, visibleDuration);

    // When overlay closes → clear timers & mark as inactive
    overlay.once("closed", () => {
      clearTimeout(fadeTimeout);
      overlayWindows = overlayWindows.filter((w) => w !== overlay);

      // 🧹 Reset active overlay flag when last one closes
      if (overlayWindows.length === 0) {
        activeOverlayType = null;
      }
    });

    overlayWindows.push(overlay);
  });
}

function fadeOutAndClose(overlay) {
  let opacity = overlay.getOpacity();
  const fadeOut = setInterval(() => {
    if (overlay.isDestroyed()) return clearInterval(fadeOut);
    opacity -= 0.05;
    if (opacity <= 0) {
      clearInterval(fadeOut);
      if (!overlay.isDestroyed()) overlay.close();
    } else {
      overlay.setOpacity(opacity);
    }
  }, 50);
}

export function closeAllOverlays() {
  overlayWindows.forEach((overlay) => {
    if (!overlay.isDestroyed()) overlay.close();
  });
  overlayWindows = [];
  activeOverlayType = null; // 🧹 Reset active overlay flag
}

export function startScheduler({ breakInterval, blinkInterval }) {
  console.log("✅ Scheduler started");

  stopScheduler();
  nextBreakTime = Date.now() + breakInterval * 60 * 1000;

  breakTimer = setInterval(() => {
    createOverlay("break.html");
    nextBreakTime = Date.now() + breakInterval * 60 * 1000;
  }, breakInterval * 60 * 1000);

  blinkTimer = setInterval(() => {
    createOverlay("blink.html");
  }, blinkInterval * 60 * 1000);
}

export function stopScheduler() {
  if (breakTimer) clearInterval(breakTimer);
  if (blinkTimer) clearInterval(blinkTimer);
  breakTimer = blinkTimer = null;
  nextBreakTime = null;
  closeAllOverlays();
}

export function getNextBreakTime() {
  return nextBreakTime;
}