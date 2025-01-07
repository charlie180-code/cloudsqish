const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    getFileSpaces: () => ipcRenderer.invoke('getFileSpaces'),
    getDiskSpace: () => ipcRenderer.invoke('getDiskSpace'),
    getUsername: () => ipcRenderer.invoke('getUsername'),
});
