const { contextBridge, ipcRenderer } = require('electron');

// An object that will hold all the functions we expose to the renderer
const electronAPI = {
  // --- [NEW] Function to open the schedule popup window ---
  openScheduleFor: (planet) => ipcRenderer.invoke('open-schedule-popup', planet),
  
  // --- Existing function for notifications ---
  showNotification: ({ title, body }) => ipcRenderer.send('show-notification', { title, body })
};

// --- Refactored schedule getters for maintainability ---
const planets = [
    'moon', 'sun', 'nodes', 'mercury', 'venus', 'mars',
    'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron'
];

// Loop through the planet names and create a 'get...Schedule' function for each one
planets.forEach(planet => {
    const functionName = `get${planet.charAt(0).toUpperCase() + planet.slice(1)}Schedule`;
    electronAPI[functionName] = () => ipcRenderer.invoke(`get-${planet}-schedule`);
});

// Securely expose the 'electronAPI' object to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
