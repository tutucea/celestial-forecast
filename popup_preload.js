const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the schedule-popup-renderer.js script
// This allows the renderer to listen for the 'receive-schedule' event from main.js
contextBridge.exposeInMainWorld('popupAPI', {
  /**
   * @param {function({ planet: string, schedule: any[] })} callback
   */
  onReceiveSchedule: (callback) => {
    ipcRenderer.on('receive-schedule', (event, data) => callback(data));
  }
});
