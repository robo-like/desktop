const { contextBridge } = require('electron');

// Expose baseUrl to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
   getBaseUrl: () => process.env.BASE_URL || "https://robolike.com"
});
