const { contextBridge, ipcRenderer } = require('electron');

// Expose config to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
   getBaseUrl: () => ipcRenderer.invoke('config:getBaseUrl'),
   getConfig: () => ipcRenderer.invoke('config:getConfig'),
   
   // Analytics methods
   analytics: {
     setAccessToken: (token) => ipcRenderer.invoke('analytics:setAccessToken', token),
     trackAppLogin: (method) => ipcRenderer.invoke('analytics:trackAppLogin', method),
     trackLikesStarted: (options) => ipcRenderer.invoke('analytics:trackLikesStarted', options),
     trackLikesStopped: (reason, totalLikes, duration) => ipcRenderer.invoke('analytics:trackLikesStopped', reason, totalLikes, duration),
     trackPostLiked: (postData) => ipcRenderer.invoke('analytics:trackPostLiked', postData),
     trackAppError: (errorType, errorMessage, errorCode) => ipcRenderer.invoke('analytics:trackAppError', errorType, errorMessage, errorCode)
   }
});
