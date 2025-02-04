const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  win.loadFile('index.html');
}

function loadSchedule(filename) {
  const data = fs.readFileSync(path.join(__dirname, filename));
  return JSON.parse(data);
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('get-moon-schedule', async () => {
    return loadSchedule('moon_schedule.json');
  });

  ipcMain.handle('get-sun-schedule', async () => {
    return loadSchedule('sun_schedule.json');
  });

  ipcMain.handle('get-nodes-schedule', async () => {
    return loadSchedule('nodes_schedule.json');
  });

  ipcMain.handle('get-mercury-schedule', async () => {
    return loadSchedule('mercury_schedule.json');
  });

  ipcMain.handle('get-venus-schedule', async () => {
    return loadSchedule('venus_schedule.json');
  });

  ipcMain.handle('get-mars-schedule', async () => {
    return loadSchedule('mars_schedule.json');
  });

  ipcMain.handle('get-jupiter-schedule', async () => {
    return loadSchedule('jupiter_schedule.json');
  });

  ipcMain.handle('get-saturn-schedule', async () => {
    return loadSchedule('saturn_schedule.json');
  });

  ipcMain.handle('get-uranus-schedule', async () => {
    return loadSchedule('uranus_schedule.json');
  });
  ipcMain.handle('get-neptune-schedule', async () => {
    return loadSchedule('neptune_schedule.json');
  });
  ipcMain.handle('get-pluto-schedule', async () => {
    return loadSchedule('pluto_schedule.json');
  })
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});