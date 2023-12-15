import { app, BrowserWindow, Menu, MenuItem, Tray } from "electron";
import { join } from 'path';
import { registerFrameCentral } from './frame-central';
import { registerWindowPrompt } from './prompt/window-prompt';
import { registerFormHandler } from './form';
import { getCfg, setCfg } from './util/data';
import { registerProfileMenu } from './handlers/profile';

app.whenReady().then(async () => {
    const mainWindow = new BrowserWindow({

        title: "DevTool",

        webPreferences: {
            preload: join(__dirname, "../dist/preload/control-preload.js"),
            webviewTag: true,
            nodeIntegration: true,
        }
    });
    mainWindow.webContents.openDevTools()
    mainWindow.maximize()
    mainWindow.loadFile(join(__dirname, "../pagescript/index.html"));


    mainWindow.on('close', function (event) {
        app.quit();
    });

    const fc = registerFrameCentral(mainWindow)
    registerWindowPrompt()
    registerFormHandler()
    registerProfileMenu(mainWindow, fc)

})

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    // On certificate error we disable default behaviour (stop loading the page)
    // and we then say "it is all fine - true" to the callback
    console.warn("allow certificate for " + url);

    event.preventDefault();
    callback(true);
});