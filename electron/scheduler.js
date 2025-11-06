import { app, BrowserWindow, screen } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let nextBreakTime = null;
let breakTimer = null;
let blinkTimer = null;
let overlayWindows = [];
let activeOverlayType = null;

// 🔥 Helper function to get correct asset paths
function getAssetPath(relativePath) {
  if (app.isPackaged) {
    // Production: assets are in Resources/assets/
    return path.join(process.resourcesPath, "assets", relativePath);
  } else {
    // Development: assets are in src/assets/
    return path.join(__dirname, "..", "src", "assets", relativePath);
  }
}

function createOverlay(file) {
  const overlayType = file.includes("break") ? "break" : "blink";

  if (activeOverlayType) {
    console.log(`⚠️ Skipping ${overlayType} overlay — ${activeOverlayType} overlay already active.`);
    return;
  }

  const displays = screen.getAllDisplays();
  activeOverlayType = overlayType;

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
      show: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false, // Security best practice
      },
    });

    overlay.setIgnoreMouseEvents(file !== "break.html");
    overlay.setAlwaysOnTop(true, "screen-saver");

    // 🔥 Build the URL with asset paths as query parameters
    const overlayPath = path.join(__dirname, "..", "overlays", file);
    
    // Get all asset paths
    const assetPaths = {
      breakGif: encodeURIComponent(getAssetPath("break2.gif")),
      blinkingGif: encodeURIComponent(getAssetPath("blinking.gif")),
      cursorMain: encodeURIComponent(getAssetPath("cursors/cursor-main.gif")),
      cursorHover: encodeURIComponent(getAssetPath("cursors/cursor-hover.gif")),
      breakStart: encodeURIComponent(getAssetPath("sounds/break-start.wav")),
      breakEnd: encodeURIComponent(getAssetPath("sounds/break-end.wav")),
      blinkSound: encodeURIComponent(getAssetPath("sounds/positive-notification.wav")),
    };

    // Create query string with all asset paths
    const queryString = Object.entries(assetPaths)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    // Load with query parameters
    overlay
      .loadFile(overlayPath, { query: Object.fromEntries(Object.entries(assetPaths).map(([k, v]) => [k, decodeURIComponent(v)])) })
      .then(() => overlay.showInactive())
      .catch((err) => console.error("Overlay load failed:", err));

    // Fade in animation
    overlay.setOpacity(0);
    let opacity = 0;
    const fadeIn = setInterval(() => {
      if (overlay.isDestroyed()) return clearInterval(fadeIn);
      opacity += 0.05;
      if (opacity >= 1) clearInterval(fadeIn);
      overlay.setOpacity(opacity);
    }, 50);

    const visibleDuration = file === "break.html" ? 20000 : 5000;

    const fadeTimeout = setTimeout(() => {
      fadeOutAndClose(overlay);
    }, visibleDuration);

    overlay.once("closed", () => {
      clearTimeout(fadeTimeout);
      overlayWindows = overlayWindows.filter((w) => w !== overlay);

      if (overlayWindows.length === 0) {
        console.log(`✅ ${overlayType} overlay closed — ready for next.`);
        activeOverlayType = null;
      }
    });

    overlayWindows.push(overlay);
  });
}

function fadeOutAndClose(overlay) {
  if (!overlay || overlay.isDestroyed()) return;

  let opacity = overlay.getOpacity();
  const fadeOut = setInterval(() => {
    if (overlay.isDestroyed()) return clearInterval(fadeOut);
    opacity -= 0.05;
    if (opacity <= 0) {
      clearInterval(fadeOut);
      try {
        overlay.close();
      } catch {}
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
  activeOverlayType = null;
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