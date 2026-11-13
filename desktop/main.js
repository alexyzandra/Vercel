// Hidey Dots desktop app (Windows): shows the same game as the web version,
// and answers the game's request for the computer's real screen settings.

const path = require('node:path');
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const { getScreenReport } = require('./win-settings');

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    backgroundColor: '#fdf6e3',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.maximize();
  // The game is fully bundled; never navigate away or open other windows.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

ipcMain.handle('hidey:screen-report', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const display = win ? screen.getDisplayMatching(win.getBounds()) : screen.getPrimaryDisplay();
  return getScreenReport({ label: display.label, internal: display.internal });
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
