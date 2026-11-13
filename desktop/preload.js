const { contextBridge, ipcRenderer } = require('electron');

// The only thing the game page can ask the computer for.
contextBridge.exposeInMainWorld('hideyNative', {
  getScreenSettings: () => ipcRenderer.invoke('hidey:screen-report'),
});
