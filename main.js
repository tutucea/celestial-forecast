const { app, BrowserWindow, ipcMain, Notification, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// --- App Configuration ---
app.setName('Celestial Forecast');
app.setAppUserModelId('com.maia.celestialforecast');

let mainWindow;
let notificationsEnabled = true; // Global flag for notification state

// --- Main Window Creation ---
function createWindow() {
  const { x, y } = screen.getPrimaryDisplay().bounds;

  mainWindow = new BrowserWindow({
    width: 355,
    height: 800,
    x: x,
    y: y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.loadFile('index.html');
  Menu.setApplicationMenu(null);
}

// --- Helper Function to Load Schedule Data ---
function loadSchedule(filename) {
  const filePath = path.join(__dirname, filename);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return data.trim() ? JSON.parse(data) : [];
    }
  } catch (error) {
    console.error(`Error reading or parsing ${filename}:`, error);
  }
  return [];
}

// --- App Lifecycle ---
app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe'),
    });
  }

  const planets = [
    'moon', 'sun', 'nodes', 'mercury', 'venus', 'mars',
    'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron'
  ];

  planets.forEach(planet => {
    ipcMain.handle(`get-${planet}-schedule`, () => loadSchedule(`${planet}_schedule.json`));
  });

  // --- IPC Handler for Notifications (only show if enabled) ---
  ipcMain.on('show-notification', (event, { title, body }) => {
    if (notificationsEnabled) {
      new Notification({ title, body }).show();
    }
  });

  // --- IPC Handler for Notification Toggle ---
  ipcMain.handle('toggle-notifications', () => {
    notificationsEnabled = !notificationsEnabled;
    return notificationsEnabled;
  });

  // --- IPC Handler to Get Notification State ---
  ipcMain.handle('get-notifications-state', () => {
    return notificationsEnabled;
  });

  // --- IPC Handler to Open the Planet Schedule Popup Window ---
  ipcMain.handle('open-schedule-popup', (event, planet) => {
    const schedule = loadSchedule(`${planet.toLowerCase()}_schedule.json`);

    if (!schedule || schedule.length === 0) {
      console.error(`No schedule data found for ${planet}. The popup will not open.`);
      return;
    }

    const scheduleWindow = new BrowserWindow({
      width: 800,
      height: 600,
      parent: mainWindow,
      modal: false,
      webPreferences: {
        preload: path.join(__dirname, 'popup_preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
      show: false,
      title: `${planet.charAt(0).toUpperCase() + planet.slice(1)} Schedule`,
      autoHideMenuBar: true,
    });

    scheduleWindow.loadFile(path.join(__dirname, 'schedule-popup.html'));

    scheduleWindow.webContents.once('did-finish-load', () => {
      scheduleWindow.webContents.send('receive-schedule', { planet, schedule });
      scheduleWindow.show();
    });
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
