import React from "react";
import "./index.css";
import "./App.css";
import appIcon from "./assets/app-icon-transparent.png";

type Tab = "general" | "about";

export default function App() {
  const [activeTab, setActiveTab] = React.useState<Tab>("general");
  const [breakInterval, setBreakInterval] = React.useState<number>(30);
  const [blinkInterval, setBlinkInterval] = React.useState<number>(20);
  const [running, setRunning] = React.useState<boolean>(false);

  const color = { color: "#d4f4dd" }; // Very light lime green

  // Listen for scheduler state changes from tray menu
  React.useEffect(() => {
    if ((window as any).electronAPI?.onSchedulerStateChanged) {
      (window as any).electronAPI.onSchedulerStateChanged((data: any) => {
        setRunning(data.running);
        setBreakInterval(data.breakInterval);
        setBlinkInterval(data.blinkInterval);
      });
    }
  }, []);

  const startReminders = () => {
    // call electron API if available
    if ((window as any).electronAPI?.startScheduler) {
      (window as any).electronAPI.startScheduler({
        breakInterval,
        blinkInterval,
      });
    }
    setRunning(true);
  };

  const stopReminders = () => {
    if ((window as any).electronAPI?.stopScheduler) {
      (window as any).electronAPI.stopScheduler();
    }
    setRunning(false);
  };

  return (
    <div className="app-root">
      <aside className="sidebar">

        <nav className="sidebar-nav">
        <div className="sidebar-top">
          <div className="app-logo">
            <img src={appIcon} alt="Blinkr" />
          </div>
          <div className="app-title">
            <div className="name">Blinkr</div>
            <div className="sub">Break & Blink</div>
          </div>
        </div>
          <button
            className={`nav-item ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            <span className="nav-emoji">⚙️</span>
            <span className="nav-text">General</span>
          </button>

          <button
            className={`nav-item ${activeTab === "about" ? "active" : ""}`}
            onClick={() => setActiveTab("about")}
          >
            <span className="nav-emoji">ℹ️</span>
            <span className="nav-text">About</span>
          </button>
        </nav>

      </aside>

      <main className="content-area">
        {activeTab === "general" && (
          <section className="panel glass-panel">
            <header className="panel-header">
              <h1 className="panel-title">General</h1>
              <p className="panel-sub">Adjust break and blink reminders</p>
            </header>

            <div className="panel-body">
              <label className="field-label">Break interval (minutes)</label>
              <input
                className="field-input"
                type="number"
                min={1}
                value={breakInterval}
                onChange={(e) => setBreakInterval(Number(e.target.value))}
              />

              <label className="field-label">Blink interval (minutes)</label>
              <input
                className="field-input"
                type="number"
                min={1}
                value={blinkInterval}
                onChange={(e) => setBlinkInterval(Number(e.target.value))}
              />

              <div className="buttons-row">
                {!running ? (
                  <button className="btn primary" onClick={startReminders}>
                    Start Reminders
                  </button>
                ) : (
                  <button className="btn warn" onClick={stopReminders}>
                    Stop Reminders
                  </button>
                )}

                <button
                  className="btn subtle"
                  onClick={() => {
                    setBreakInterval(30);
                    setBlinkInterval(20);
                  }}
                >
                  Reset defaults
                </button>
              </div>

              <div className="note">
                Tip: Break overlay lasts 20s. Blink overlay lasts 5s. You can change
                these intervals here.
              </div>
            </div>
          </section>
        )}

        {activeTab === "about" && (
          <section className="panel glass-panel">
            <header className="panel-header">
              <h1 className="panel-title">About Blinkr</h1>
            </header>

            <div className="panel-body about-body">
              <p>
                Blinkr is a break and blink reminder app inspired by LookAway, designed to
                help you rest your eyes and stay mindful while working. It gently displays
                elegant, glass-styled full-screen overlays that prompt short breaks and quick
                blink reminders, without disrupting your flow.
              </p>

              <p>
                Developed by Varun Dhand using Electron, React, and TypeScript, Blinkr brings
                a refined macOS-inspired aesthetic with calm visuals and a focus on eye
                wellness.
              </p>

              <div className="about-meta">
                <div>
                  <strong>Version</strong>
                  <div>0.1.0 (dev)</div>
                </div>
                <div>
                  <strong>Author</strong>
                  <div style={color}>
                    <a href="https://varundhand.netlify.app" target="_blank" rel="noopener noreferrer">
                      Varun Dhand 🔗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}