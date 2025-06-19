const { app, BrowserWindow, ipcMain, Notification, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// --- App Configuration ---
app.setName('Celestial Forecast');
app.setAppUserModelId('com.maia.celestialforecast');

let mainWindow;

// --- Main Window Creation ---
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 355,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Security best practices
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.loadFile('index.html');
  // Remove the default Electron menu (File, Edit, etc.)
  Menu.setApplicationMenu(null);
}

// --- Helper Function to Load Schedule Data (Now with Error Handling) ---
function loadSchedule(filename) {
    const filePath = path.join(__dirname, filename);
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            // Return an empty array if file is empty, otherwise parse it
            return data.trim() ? JSON.parse(data) : [];
        }
    } catch (error) {
        console.error(`Error reading or parsing ${filename}:`, error);
    }
    // Return an empty array on error or if the file doesn't exist
    return [];
}


// --- App Lifecycle ---
app.whenReady().then(() => {
  
  // --- IPC Handlers for Schedule Data (Refactored for maintainability) ---
  const planets = [
    'moon', 'sun', 'nodes', 'mercury', 'venus', 'mars',
    'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron'
  ];
  planets.forEach(planet => {
    ipcMain.handle(`get-${planet}-schedule`, () => loadSchedule(`${planet}_schedule.json`));
  });

  // --- IPC Handler for Notifications ---
  ipcMain.on('show-notification', (event, { title, body }) => {
    new Notification({ title, body }).show();
  });

  // --- [NEW] IPC Handler to Open the Planet Schedule Popup Window ---
  ipcMain.handle('open-schedule-popup', (event, planet) => {
    const schedule = loadSchedule(`${planet.toLowerCase()}_schedule.json`);

    if (!schedule || schedule.length === 0) {
        console.error(`No schedule data found for ${planet}. The popup will not open.`);
        return; // Stop if there's no data to show
    }

    const scheduleWindow = new BrowserWindow({
        width: 800,
        height: 600,
        parent: mainWindow, // Set parent to the main window
        modal: false,
        webPreferences: {
            // IMPORTANT: Use the new preload script for this window
            preload: path.join(__dirname, 'popup_preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: false, // Don't show the window until it's ready
        title: `${planet.charAt(0).toUpperCase() + planet.slice(1)} Schedule`,
        autoHideMenuBar: true
    });

    // Load the new HTML file for the popup
    scheduleWindow.loadFile(path.join(__dirname, 'schedule-popup.html'));

    // Once the window's content is ready, send the schedule data and show it
    scheduleWindow.webContents.once('did-finish-load', () => {
        scheduleWindow.webContents.send('receive-schedule', { planet, schedule });
        scheduleWindow.show();
    });
  });

  createWindow();
});

// --- Standard App Lifecycle Handlers ---
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
