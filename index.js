const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const { SERVER_URL } = require('./config.js');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let splash;
let serverProcess;

function isServerRunning() {
    return new Promise((resolve) => {
        http.get(`${SERVER_URL}/health`, (res) => {
            resolve(res.statusCode === 200);
        }).on('error', () => resolve(false));
    });
}

async function waitForServer() {
    let serverReady = false;
    while (!serverReady) {
        serverReady = await isServerRunning();
        if (!serverReady) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}

function createSplashWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    splash = new BrowserWindow({
        width: width,
        height: height,
        frame: false,
        transparent: true,
        center: true,
        alwaysOnTop: true,
        resizable: true,
        webPreferences: {
            devTools: false,
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    splash.loadFile(path.join(__dirname, './splash.html'));
    splash.on('closed', () => splash = null);

    splash.on('close', (event) => {
        if (mainWindow) {
            event.preventDefault();
            splash.hide();
        }
    });
}

async function createMainWindow() {
    try {
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;

        mainWindow = new BrowserWindow({
            width: width,
            height: height,
            icon: path.join(__dirname, './app_icon.svg'),
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false,
                contextIsolation: true
            },
            autoHideMenuBar: true,
            show: false,
            resizable: true,
        });

        const mainFile = path.join(__dirname, './index.html');
        mainWindow.loadFile(mainFile);

        mainWindow.once('ready-to-show', () => {
            if (splash) splash.destroy();
            mainWindow.show();
        });

        mainWindow.on('closed', () => {
            mainWindow = null;
        });
    } catch (error) {
        console.error("Failed to create main window:", error);
    }
}

function startServer() {
    const isDev = !app.isPackaged;
    const serverPath = isDev
        ? path.join(__dirname, 'server/dist', 'cloudsquish.exe')
        : path.join(process.resourcesPath, 'server/dist', 'cloudsquish.exe');

    const workingDirectory = isDev
        ? path.join(__dirname, 'server')
        : path.join(process.resourcesPath, 'server');

    serverProcess = spawn(serverPath, [], { cwd: workingDirectory, shell: true });

    serverProcess.stdout.on('data', (data) => {
        console.log(`Server: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
        console.error(`Server Error: ${data}`);
    });

    serverProcess.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
    });
}

function stopServer() {
    if (serverProcess) {
        console.log("Attempting to stop server...");
        serverProcess.kill('SIGINT');
        serverProcess.on('close', (code) => {
            console.log(`Server stopped with exit code: ${code}`);
        });
        serverProcess = null;
    }
}

function checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify();
}

autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
    console.log('Nouvelle mise à jour disponible', info);
});

autoUpdater.on('update-not-available', () => {
    console.log('Aucune mise à jour disponible');
});

autoUpdater.on('error', (err) => {
    console.error('Error during update:', err);
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    autoUpdater.quitAndInstall();
});

app.on('ready', async () => {
    createSplashWindow();

    try {
        startServer();
        await waitForServer();
        await createMainWindow();

        checkForUpdates();
    } catch (err) {
        console.error("Error while waiting for server:", err);
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createSplashWindow();
        createMainWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        stopServer();
        app.quit();
    }
});

process.on('exit', () => {
    stopServer();
});

process.on('SIGINT', () => {
    stopServer();
    process.exit();
});

process.on('SIGTERM', () => {
    stopServer();
    process.exit();
});
