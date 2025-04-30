const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

// Set the app name explicitly
app.setName('Celestial Forecast');
app.setAppUserModelId('com.maia.celestialforecast');

function createWindow() {
  const win = new BrowserWindow({
    width: 355,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  win.loadFile('index.html'); // You’ve fixed this
}

function loadSchedule(filename) {
  const data = fs.readFileSync(path.join(__dirname, filename));
  return JSON.parse(data);
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('get-moon-schedule', async () => loadSchedule('moon_schedule.json'));
  ipcMain.handle('get-sun-schedule', async () => loadSchedule('sun_schedule.json'));
  ipcMain.handle('get-nodes-schedule', async () => loadSchedule('nodes_schedule.json'));
  ipcMain.handle('get-mercury-schedule', async () => loadSchedule('mercury_schedule.json'));
  ipcMain.handle('get-venus-schedule', async () => loadSchedule('venus_schedule.json'));
  ipcMain.handle('get-mars-schedule', async () => loadSchedule('mars_schedule.json'));
  ipcMain.handle('get-jupiter-schedule', async () => loadSchedule('jupiter_schedule.json'));
  ipcMain.handle('get-saturn-schedule', async () => loadSchedule('saturn_schedule.json'));
  ipcMain.handle('get-uranus-schedule', async () => loadSchedule('uranus_schedule.json'));
  ipcMain.handle('get-neptune-schedule', async () => loadSchedule('neptune_schedule.json'));
  ipcMain.handle('get-pluto-schedule', async () => loadSchedule('pluto_schedule.json'));
  ipcMain.handle('get-chiron-schedule', async () => loadSchedule('chiron_schedule.json'))

  ipcMain.on('show-notification', (event, { title, body }) => {
    const notification = new Notification({
      title: title,
      body: body,
    });
    notification.show();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
