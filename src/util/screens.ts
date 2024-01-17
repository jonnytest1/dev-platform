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
        const powerShellCommnad = `Add-Type -AssemblyName System.Windows.Forms ; ([System.Windows.Forms.Screen]::AllScreens|sort -Property {$_.Displayname} )`

        const output = execSync(powerShellCommnad, {
            encoding: "utf8",
            shell: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
        })
        const monitorStrings = output.trim().split("\r\n\r\n")

        return monitorStrings.map(monitorStr => {
            const boundsMatch = (/Bounds       : {X=(?<xccoord>-?\d*),Y=(?<yccoord>-?\d*),Width=(?<width>\d*),Height=(?<height>\d*)}/gm).exec(monitorStr)
            const isPrimary = (/Primary\s*:\s*(?<isPrimary>(True|False))/).exec(monitorStr)?.groups?.isPrimary

            if (!boundsMatch?.groups) {
                return null
            }
            return {
                isPrimary: isPrimary === "True",
                x: +boundsMatch?.groups?.xccoord,
                y: +boundsMatch?.groups?.yccoord,
                width: +boundsMatch?.groups?.width,
                height: +boundsMatch?.groups?.height,
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