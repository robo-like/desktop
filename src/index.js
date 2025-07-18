const { app, BrowserWindow, screen, ipcMain } = require("electron");
const path = require("node:path");
const config = require("./config");
const analytics = require("./analytics");

let mainWindow;
let deeplinkingUrl = null;

/**
 * Check if user is authenticated by testing access to a protected endpoint
 * @returns {Promise<boolean>} - True if authenticated, false otherwise
 */
async function checkAuthStatus() {
  try {
    const { net, session } = require('electron');

    // Create a request to check authentication status with session cookies
    const request = net.request({
      method: 'GET',
      url: `${config.baseUrl}${config.api.auth.status}`,
      useSessionCookies: true, // Use cookies from the session
      session: session.defaultSession, // Use the default session
    });

    return new Promise((resolve) => {
      request.on('response', (response) => {
        console.log('Auth status response:', response.statusCode);
        if (response.statusCode === 200) {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      request.on('error', (error) => {
        console.error('Auth request error:', error);
        resolve(false);
      });

      request.end();
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

// Protocol handler setup
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(config.app.protocol, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient(config.app.protocol);
}

// Handle Squirrel installer
if (require("electron-squirrel-startup")) {
  app.quit();
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  return
}

/**
 * 
 */
function handleUrl(url) {
  if (url.includes("auth/confirm")) {
    const cleanUrl = url.replace(`${config.app.protocol}://`, config.baseUrl + "/");
    mainWindow.loadURL(cleanUrl);
  }
}

/**
 * 
 */
function loadMainApp({ query }) {
  mainWindow.loadFile(path.join(__dirname, "index.html"), {
    query,
  });
}

app.on("second-instance", (event, argv, workingDirectory) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }

  // Windows: handle deep link from second instance
  const url = argv.find((arg) => arg.startsWith(`${config.app.protocol}://`));
  if (url) {
    deeplinkingUrl = url;
    handleUrl(deeplinkingUrl);
  }
});

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    title: config.app.title,
    webPreferences: {
      webviewTag: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Check authentication status before deciding where to navigate
  checkAuthStatus().then((isLoggedIn) => {
    if (!isLoggedIn) {
      mainWindow.loadURL(`${config.baseUrl}/auth/login`);
    } else {
      loadMainApp({});
    }
  }).catch((error) => {
    console.error('Auth check failed:', error);
    // If auth check fails, go to login
    mainWindow.loadURL(`${config.baseUrl}/auth/login`);
  });

  if (deeplinkingUrl) {
    handleUrl(deeplinkingUrl);
  }
};

// Setup IPC handlers for config
ipcMain.handle('config:getBaseUrl', () => {
  return config.baseUrl;
});

ipcMain.handle('config:getConfig', () => {
  return config;
});

// Setup IPC handlers for analytics
ipcMain.handle('analytics:setAccessToken', (event, token) => {
  analytics.setAccessToken(token);
});

ipcMain.handle('analytics:trackAppLogin', (event, method) => {
  return analytics.trackAppLogin(method);
});

ipcMain.handle('analytics:trackLikesStarted', (event, options) => {
  return analytics.trackLikesStarted(options);
});

ipcMain.handle('analytics:trackLikesStopped', (event, reason, totalLikes, duration) => {
  return analytics.trackLikesStopped(reason, totalLikes, duration);
});

ipcMain.handle('analytics:trackPostLiked', (event, postData) => {
  return analytics.trackPostLiked(postData);
});

ipcMain.handle('analytics:trackAppError', (event, errorType, errorMessage, errorCode) => {
  return analytics.trackAppError(errorType, errorMessage, errorCode);
});

app.whenReady().then(() => {
  createWindow();

  // Track app session start
  analytics.trackAppSessionStart();

  // Set dock icon for macOS
  if (process.platform === 'darwin') {
    // app.dock.setBadge("👍");
    app.dock.setIcon(path.join(process.cwd(), "icons", "icon.png"))
  }

  // macOS: handle URI
  app.on("open-url", (event, url) => {
    event.preventDefault();
    deeplinkingUrl = url;
    handleUrl(deeplinkingUrl);
  });

  // Windows: handle URI on initial launch
  if (process.platform === "win32") {
    const url = process.argv.find((arg) => arg.startsWith(`${config.app.protocol}://`));
    if (url) {
      deeplinkingUrl = url;
      handleUrl(deeplinkingUrl);
    }
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url.includes(`${config.app.protocol}://likes`)) {
      const urlObj = new URL(url);
      const searchParams = Object.fromEntries(urlObj.searchParams);
      loadMainApp({
        query: searchParams,
      });
    }
  });
});

app.on("window-all-closed", () => {
  // Track app session end
  analytics.trackAppSessionEnd();
  
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  // Track app session end on quit
  analytics.trackAppSessionEnd();
});

