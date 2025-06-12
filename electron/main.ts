import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main.js    > Electron main
// │ └─┬ preload.js > Preload scripts
// ├─┬ dist
// │ └── index.html  > Electron renderer
//
process.env.ROOT = path.join(__dirname, '../..');
process.env.DIST = path.join(process.env.ROOT, 'dist');
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.ROOT, 'public')
  : process.env.DIST;

// Disable GPU Acceleration for Windows 7
if (process.platform === 'win32') app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Install "react devtools" - commented out for now
// if (process.env.NODE_ENV === 'development') {
//   app
//     .whenReady()
//     .then(() => import('electron-devtools-installer'))
//     .then(({ default: installExtension, REACT_DEVELOPER_TOOLS }) =>
//       installExtension(REACT_DEVELOPER_TOOLS, {
//         loadExtensionOptions: {
//           allowFileAccess: true,
//         },
//       })
//     )
//     .catch((e) => console.error('Failed install extension:', e));
// }

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = path.join(__dirname, '../preload.js');
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = path.join(process.env.DIST, 'index.html');

async function createWindow() {
  win = new BrowserWindow({
    title: '抖音弹幕姬',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (url) { // electron-vite-vue#298
    win.loadURL(url);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Apply electron-updater
  // update(win);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

// Handle file save dialog
ipcMain.handle('save-file', async (_, data: { content: string; filename: string }) => {
  try {
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: data.filename,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, data.content, 'utf8');
      return { success: true, path: result.filePath };
    }
    return { success: false, message: 'User cancelled' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Remove default menu
Menu.setApplicationMenu(null);
