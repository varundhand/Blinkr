const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startScheduler: (data) => ipcRenderer.send('start-scheduler', data),
  stopScheduler: () => ipcRenderer.send('stop-scheduler'),
  closeOverlay: () => ipcRenderer.send('close-overlay'),
  
  // Listen for state changes from main process
  onSchedulerStateChanged: (callback) => {
    ipcRenderer.on('scheduler-state-changed', (event, data) => callback(data));
  },
});