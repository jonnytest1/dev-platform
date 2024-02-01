import { exec, execSync } from 'child_process';
import { debug } from 'console';
import { BrowserWindow } from 'electron';
import { platform } from 'os';


export interface Screen {
    isPrimary: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
}

export function getScreenLayout() {
    if (platform() == "win32") {
        // |sort -Property {$_.Displayname}
        const powerShellCommnad = `Add-Type -AssemblyName System.Windows.Forms ; ([System.Windows.Forms.Screen]::AllScreens ) |ConvertTo-Json`

        const output = execSync(powerShellCommnad, {
            encoding: "utf8",
            shell: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
        })
        const screenInfo = JSON.parse(output) as Array<{
            DeviceName: string
            Primary: boolean,
            WorkingArea: {
                X: number,
                Y: number
                Width: number
                Height: number
            },
            Bounds: {
                X: number,
                Y: number
                Width: number
                Height: number
            }
        }>


        return screenInfo.map(monitorStr => {

            const deviceNr = monitorStr.DeviceName.split("DISPLAY")[1]
            const scaledoutput = execSync(`Get-WmiObject win32_desktopmonitor| Where-Object -Property DeviceID -eq DesktopMonitor${deviceNr} |ConvertTo-Json`, {
                encoding: "utf8",
                shell: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
            })
            if (scaledoutput.trim()) {
                const scaledObj = JSON.parse(scaledoutput) as {
                    ScreenHeight: number
                    ScreenWidth: number
                }
                const scaleFactor = scaledObj.ScreenWidth / monitorStr.Bounds.Width
                if (scaleFactor && Math.floor(scaleFactor * monitorStr.Bounds.Height) === scaledObj.ScreenHeight) {
                    const newWidth = Math.floor(scaleFactor * monitorStr.WorkingArea.Width)
                    const widthDiff = newWidth - monitorStr.WorkingArea.Width
                    monitorStr.WorkingArea.Width = Math.floor(scaleFactor * monitorStr.WorkingArea.Width)
                    monitorStr.WorkingArea.Height = Math.floor(scaleFactor * monitorStr.WorkingArea.Height)
                    monitorStr.WorkingArea.X -= widthDiff
                }

            }

            return {
                isPrimary: monitorStr.Primary,
                x: monitorStr.WorkingArea.X,
                y: monitorStr.WorkingArea.Y,
                width: monitorStr.WorkingArea.Width,
                height: monitorStr.WorkingArea.Height,
            } as Screen
        })
    }
}


export function enterMAxMAxScreenLAyout(app: BrowserWindow) {



    const screenLayouts = getScreenLayout()
    if (!screenLayouts) {
        return
    }

    const yMap: Record<number, Screen> = {}
    let maxWidth = -Infinity
    let maxY: number | undefined = undefined;
    for (const screen of screenLayouts) {
        if (!screen) {
            continue
        }
        if (yMap[screen.y]) {
            const previousSetup = yMap[screen.y]
            if (previousSetup.x + previousSetup.width === screen.x) {
                previousSetup.width += screen.width
            } else if (previousSetup.x - screen.width == screen.x) {
                previousSetup.width += screen.width
                previousSetup.x = screen.x
            }
        } else {
            yMap[screen.y] = screen

        }


        if (yMap[screen.y].width > maxWidth) {
            maxWidth = yMap[screen.y].width
            maxY = screen.y
        }

    }

    if (maxY !== undefined) {
        const biggestScreen = yMap[maxY]
        if (app.isMaximized()) {
            app.unmaximize()
        }
        app.setBounds({
            width: biggestScreen.width,
            height: biggestScreen.height,
            x: biggestScreen.x,
            y: biggestScreen.y
        })
    }


}