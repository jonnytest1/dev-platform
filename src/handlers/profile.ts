import { BrowserWindow, Menu, MenuItem, MessagePortMain, ipcMain } from 'electron'
import { getCfg, setCfg } from '../util/data'
import { sendMessage } from '../../preload/cross-ready/communication'
import { Frame } from '../frame'
import { FrameCentral } from '../frame-central'
import { defaultProfile } from './default-profile'

export async function registerProfileMenu(mainWindow: BrowserWindow, fc: FrameCentral) {
    const appMenu = Menu.getApplicationMenu()

    let profiles = await getProfiles()

    let controlMessagePort: MessagePortMain | undefined = undefined

    const menuItem = new MenuItem({
        label: "Profiles",
        submenu: [
            {
                label: "Profile",
                submenu: Object.keys(profiles.profiles).map(key => {
                    return {
                        label: key,
                        click: async () => {
                            profiles.current = key
                            setCfg("profiles", profiles)
                            controlMessagePort?.postMessage(JSON.stringify({
                                type: "profile",
                                data: profiles.profiles[profiles.current]
                            }))
                        },
                        checked: profiles.current == key,
                        type: "radio"
                    }
                })
            }, {
                label: "edit profiles",
                click: async () => {
                    setCfg("profiles", profiles)

                }
            }
        ]
    })
    appMenu?.append(menuItem)
    mainWindow.setMenu(appMenu)

    ipcMain.on("init-control-script", async (e, ...args) => {
        controlMessagePort = e.ports[0]
        controlMessagePort.start()
        profiles = await getProfiles()

        controlMessagePort.postMessage(JSON.stringify({
            type: "profile",
            data: profiles.profiles[profiles.current]
        }))


        controlMessagePort.on("message", e => {
            fc.update(e);
        })
    })

}

async function getProfiles() {
    return (await getCfg("profiles")) ?? defaultProfile
}
