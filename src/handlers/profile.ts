import { BrowserWindow, Menu, MenuItem, MessagePortMain, ipcMain } from 'electron'
import { getCfg, setCfg } from '../util/data'
import { sendMessage } from '../../preload/cross-ready/communication'
import { Frame } from '../frame'
import { FrameCentral } from '../frame-central'

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
    return (await getCfg("profiles")) ?? {
        profiles: {
            default: {
                displays: [{
                    name: "PC",
                    width: 1920,
                    height: 1080
                }, {
                    name: "phone double",
                    width: 691,
                    height: 655
                }, {
                    name: "phone single",
                    width: 345,
                    height: 746
                }],
                url: "https://www.google.de",
                comparisonUrl: "https://www.google.de",
            }
        },
        current: "default"
    }
}
