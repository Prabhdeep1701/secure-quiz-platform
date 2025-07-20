const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  enterKiosk: () => ipcRenderer.invoke('enter-kiosk'),
  exitKiosk: () => ipcRenderer.invoke('exit-kiosk'),
  onWindowBlurred: (callback) => ipcRenderer.on('window-blurred', callback),
  offWindowBlurred: (callback) => ipcRenderer.removeListener('window-blurred', callback),
}); 