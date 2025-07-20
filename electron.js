const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

console.log('Electron app starting...');

const isDev = !app.isPackaged;
let mainWindow;

function createWindow() {
  console.log('Creating window...');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    fullscreen: true, // Always open in fullscreen
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Allow loading localhost in Electron
    },
  });

  console.log('Window created, loading URL...');

  if (isDev) {
    console.log('Loading development URL: http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools for debugging
    mainWindow.webContents.openDevTools();
  } else {
    console.log('Loading production URL: http://localhost:3000');
    // In production, we'll need to start the Next.js server
    mainWindow.loadURL('http://localhost:3000');
  }

  // Handle authentication redirects
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    console.log('Navigation to:', navigationUrl);
    // Allow navigation to localhost URLs
    if (navigationUrl.startsWith('http://localhost:3000')) {
      return;
    }
    // Prevent external navigation
    event.preventDefault();
  });

  // Handle failed loads
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.log('Failed to load:', validatedURL, 'Error:', errorDescription);
    if (errorCode === -6) { // ERR_CONNECTION_REFUSED
      console.log('Connection refused, retrying...');
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:3000');
      }, 1000);
    }
  });

  mainWindow.on('closed', () => {
    console.log('Window closed');
    mainWindow = null;
  });

  // Block keyboard shortcuts in kiosk mode
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (mainWindow.isKiosk()) {
      // Block all Ctrl, Alt, Meta, and F-keys
      if (input.control || input.alt || input.meta || (input.key && input.key.startsWith('F'))) {
        event.preventDefault();
      }
      // Block Escape, Tab, and other navigation keys
      if (["Escape", "Tab", "Alt", "F4", "F11", "F12", "F5", "F1", "F2", "F3", "F6", "F7", "F8", "F9", "F10", "F11", "F12"].includes(input.key)) {
        event.preventDefault();
      }
    }
  });

  // Send IPC message when window loses focus in kiosk mode
  mainWindow.on('blur', () => {
    if (mainWindow.isKiosk()) {
      mainWindow.webContents.send('window-blurred');
    }
  });
}

app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for kiosk mode
ipcMain.handle('enter-kiosk', () => {
  console.log('Entering kiosk mode');
  if (mainWindow) {
    mainWindow.setKiosk(true);
    mainWindow.setMenuBarVisibility(false);
  }
});
ipcMain.handle('exit-kiosk', () => {
  console.log('Exiting kiosk mode');
  if (mainWindow) {
    mainWindow.setKiosk(false);
    mainWindow.setMenuBarVisibility(true);
  }
}); 