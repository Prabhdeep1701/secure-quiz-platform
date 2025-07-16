const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  enterKiosk: () => ipcRenderer.invoke('enter-kiosk'),
  exitKiosk: () => ipcRenderer.invoke('exit-kiosk'),
}); 