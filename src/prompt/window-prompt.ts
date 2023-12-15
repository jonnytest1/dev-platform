import { BrowserWindow } from 'electron';
import { setHandler, CustomEvent } from '../../preload/cross-ready/communication';
import { ResolvablePromise } from '../../preload/cross-ready/resolvable-promise';



const activeWindows: Record<string, Array<ResolvablePromise<Record<string, string>>>> = {}


export function cratePrompt(e: CustomEvent<"promptWindow">) {
    const resolver = new ResolvablePromise<Record<string, string>>();

    if (activeWindows[e.data!.key] == undefined) {
        activeWindows[e.data!.key] = []
        createPrompt(e, resolver);
        resolver.then(data => {
            activeWindows[e.data!.key].forEach(res => {
                res.resolve(data)
            })
            delete activeWindows[e.data!.key]
        })
    } else {
        activeWindows[e.data!.key].push(resolver)
    }

    return resolver
}

export function registerWindowPrompt() {
    setHandler("promptWindow", async e => {
        return cratePrompt(e)
    })
}

export function createPrompt(e: CustomEvent<"promptWindow">, resolver: ResolvablePromise<Record<string, string>>) {
    const promptWindow = new BrowserWindow({
        alwaysOnTop: true,
        center: true,
        closable: false,
        hasShadow: true,
        minimizable: false,
        movable: true,
        resizable: false,
        title: "",
        titleBarStyle: "customButtonsOnHover",
        backgroundColor: "white",
        show: true
    });
    promptWindow.menuBarVisible = false


    const str = `
        <body style="width:fit-content;height:fit-content;margin:auto;max-height:1000px;overflow:auto">
            <br>
            ${e.data!.explanation}
            <form action="form://submit">
                ${e.data!.formcontent}<br>
                <button type="submit"> OK </button>
            </form>
        </body>
    `
    promptWindow.loadURL(`data:text/html;base64,${Buffer.from(str).toString("base64")}`).then(async v => {
        await promptWindow.webContents.executeJavaScript("document.body.innerHTML")
        const [w, h] = await Promise.all([
            promptWindow.webContents.executeJavaScript("document.body.offsetWidth"),
            promptWindow.webContents.executeJavaScript("document.body.offsetHeight"),
        ])
        promptWindow.setSize(w + 50, h + 50)
    })

    promptWindow.webContents.session.protocol.registerStringProtocol("form", e => {
        const request = new URL(e.url)
        const data = Object.fromEntries(request.searchParams.entries()) // {test:"inputvalue"}
        resolver.resolve(data)

        promptWindow.webContents.session.protocol.unregisterProtocol("form")
        promptWindow.setClosable(true)
        promptWindow.close()

    })

    //promptWindow.loadFile(promptFile);
}
