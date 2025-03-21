const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getMoonSchedule: () => ipcRenderer.invoke('get-moon-schedule'),
  getSunSchedule: () => ipcRenderer.invoke('get-sun-schedule'),
  getNodesSchedule: () => ipcRenderer.invoke('get-nodes-schedule'),
  getMercurySchedule: () => ipcRenderer.invoke('get-mercury-schedule'),
  getVenusSchedule: () => ipcRenderer.invoke('get-venus-schedule'),
  getMarsSchedule: () => ipcRenderer.invoke('get-mars-schedule'),
  getJupiterSchedule: () => ipcRenderer.invoke('get-jupiter-schedule'),
  getSaturnSchedule: () => ipcRenderer.invoke('get-saturn-schedule'),
  getUranusSchedule: () => ipcRenderer.invoke('get-uranus-schedule'),
  getNeptuneSchedule: () => ipcRenderer.invoke('get-neptune-schedule'),
  getPlutoSchedule: () => ipcRenderer.invoke('get-pluto-schedule'),
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body })

});
