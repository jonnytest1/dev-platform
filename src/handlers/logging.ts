import { ipcMain } from 'electron'
import { addToLog } from '../util/logging'



export function registerLoggingForwarder() {
    ipcMain.on("log-forwarder", async (e, data) => {
        addToLog(data.message, data.args)
    })
}