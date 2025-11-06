<div align="center">  
  <h1> Blinkr: Protect Your Eyes, One Blink at a Time 👁️💡</h1>
</div>
<p align="center">
  <img width="700" height="700" alt="blinkr-high-resolution-logo" src="https://github.com/user-attachments/assets/94e60081-187d-4d83-ba34-b33ac8c22578" />
</p>

> A lightweight desktop app that reminds you to blink and take short breaks — helping reduce eye strain during long work sessions.  
> Available for **macOS** and **Windows**.

---

## ✨ Features

- 🕒 Smart break reminders with configurable intervals  
- 👁️ Automatic blink reminders  
- 🔊 Optional sound notifications  
- 🎨 Minimal and clean UI  
- 🔄 Runs silently in the background  
- 🚀 Extremely lightweight and optimized for long work sessions  

---

## 📸 App Preview

<p align="center">
  <img width="849" height="850" alt="preview-1" src="https://github.com/user-attachments/assets/e1c3d6e4-9001-4895-b33a-195a2baa4917" />
</p>
<p align="center">
  <img width="1470" height="956" alt="preview-2" src="https://github.com/user-attachments/assets/529ff280-da53-400e-80de-a2fb2c1b2da4" />
</p>
<p align="center">
  <img width="1470" height="956" alt="preview-3" src="https://github.com/user-attachments/assets/28fe9a74-bf7b-4bd6-a5ab-43c85b14d8d4" />
</p>

---

## 📥 Downloads

You can download the installers directly:

### ✅ macOS  
🔗 **Download macOS Installer (.dmg)**  
👉 `Blinkr-0.2.0.dmg` *(https://github.com/varundhand/Blinkr/releases/download/v0.2.0/Blinkr-0.2.0.dmg)*

### ✅ Windows  
🔗 **Download Windows Installer (.exe)**  
👉 `Blinkr-0.2.0.exe` *(https://github.com/varundhand/Blinkr/releases/download/v0.2.0/Blinkr.Setup.0.2.0.exe)*

> Both versions may show security warnings since I do not own code-signing certificates (Apple Developer ID or Windows Authenticode).  
> These warnings are expected — the app is safe to use.

---

## 🛠 Installation

### macOS Installation (Important)

Because the app is **not signed** (Apple charges for Developer certificates), macOS will block the app on first launch.

Follow this:

1. Download the `.dmg`  
2. Drag **Blinkr** into the **Applications** folder  
3. Try opening it — you will see:  
   *“Blinkr cannot be opened because the developer cannot be verified.”*  
4. Go to:  
   **System Settings → Privacy & Security**  
5. Scroll down until you see:  
   **“Blinkr was blocked from opening”**  
6. Click **Allow Anyway**  
7. Now right-click the Blinkr app → **Open**  
8. Click **Open** again

✅ Now it will work normally without warnings

---

### Windows Installation

Windows SmartScreen will warn you because the app is **not code-signed** (certificate is expensive).

1. Download the `.exe`  
2. Run the installer  
3. When SmartScreen appears:  
   - Click **More info**  
   - Click **Run anyway**  
4. Install and use normally

✅ After first time, no warnings will appear again.

---

## 🔧 Tech Stack

- **Electron**
- **Vite**
- **React + TypeScript**
- **Tailwind / Custom CSS**
- **Node.js**

---

## 🚀 Development Setup

```bash
# Install dependencies
npm install

# Start dev environment
npm run dev

# Build production binaries
npm run build
```

Package output will appear in your `dist/` or `release/` folders depending on your setup.

---

## 📝 Changelog (v0.2.0)

- 🎨 Improved overlay visuals  
- 🔊 Fixed sound playback for blink/break reminders  
- ⏰ More accurate scheduling + timers  
- 🪟 Corrected window behavior during overlay  
- 🔄 Improved background lifecycle stability  

---

## 📄 License

The app is **not code-signed** on macOS or Windows.  
You may see installation warnings — this is expected.

---

## 👤 Author

**[Varun Dhand](https://varundhand.netlify.app/)**  
Creator of Blinkr — Your Eye Health Companion 👁️✨

---

