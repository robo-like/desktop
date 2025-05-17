require("dotenv").config();
const { app, BrowserWindow, screen } = require("electron");
const path = require("node:path");

const baseUrl = process.env.BASE_URL || "https://robolike.com";
let mainWindow;
let deeplinkingUrl = null;

// Protocol handler setup
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("robolike", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("robolike");
}

// Handle Squirrel installer
if (require("electron-squirrel-startup")) {
  app.quit();
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, argv, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    // Windows: handle deep link from second instance
    const url = argv.find((arg) => arg.startsWith("robolike://"));
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
      webPreferences: {
        webviewTag: true,
        nodeIntegration: false,
        preload: path.join(__dirname, "preload.js"),
      },
    });

    const isLoggedIn = false;

    if (!isLoggedIn) {
      mainWindow.loadURL(`${baseUrl}/auth/login`);
    } else {
      loadMainApp();
    }

    if (deeplinkingUrl) {
      handleUrl(deeplinkingUrl);
    }
  };

  app.whenReady().then(() => {
    createWindow();

    // macOS: handle URI
    app.on("open-url", (event, url) => {
      event.preventDefault();
      deeplinkingUrl = url;
      handleUrl(deeplinkingUrl);
    });

    // Windows: handle URI on initial launch
    if (process.platform === "win32") {
      const url = process.argv.find((arg) => arg.startsWith("robolike://"));
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
      if (url.includes("robolike://likes")) {
        const urlObj = new URL(url);
        const searchParams = Object.fromEntries(urlObj.searchParams);
        loadMainApp({
          query: searchParams,
        });
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

function handleUrl(url) {
  if (url.includes("auth/confirm")) {
    const cleanUrl = url.replace("robolike://", baseUrl + "/");
    mainWindow.loadURL(cleanUrl);
  }
}

function loadMainApp({ query }) {
  mainWindow.loadFile(path.join(__dirname, "index.html"), {
    query,
  });
}
