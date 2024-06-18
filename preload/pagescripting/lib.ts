import { contextBridge, ipcRenderer } from 'electron';
import { sendMessage } from '../cross-ready/communication';
import { ResolvablePromise } from '../cross-ready/resolvable-promise';

export async function loadLibrary<T>(url: string, expose: string) {

    const scrText = await sendMessage({
        type: "scriptContent",
        data: {
            src: url
        }
    })
    if (scrText) {
        while (!port) {
            await ResolvablePromise.delayed(100)
        }
        port
        return new Promise<void>(res => {
            port.addEventListener("message", e => {
                if (e.data.includes("exec-done")) {
                    res()
                }
            })
            port.postMessage(JSON.stringify({
                type: "exec",
                str: scrText
            }))

        })
    }
    //
}
let port: MessagePort;

export async function runInPage(callback: (api: { loadPageLibrary: <T>(url: string, csm?: boolean) => Promise<T> }) => (void | Promise<void>)) {
    console.log("runinpage")
    while (!port) {
        await ResolvablePromise.delayed(100)
    }
    console.log("send exec page")
    port.postMessage(JSON.stringify({
        type: "exec-api",
        str: `(${callback.toString()})`
    }))

}

export async function execute(code: string) {
    addEventListener("message", e => {
        try {
            let evt = JSON.parse(e.data)
            if (evt.type === "dom-ready") {
                console.log("got port")
                port = e.ports[0]
                port.start()


                port.addEventListener("message", async e => {
                    const evt = JSON.parse(e.data)

                    if (evt.type === "loadPageLibrary") {
                        const scrText = await sendMessage({
                            type: "scriptContent",
                            data: {
                                src: evt.url
                            }
                        })
                        port.postMessage(JSON.stringify({
                            type: "scriptContentReply",
                            str: scrText,
                            respid: evt.reqid
                        }))
                    }
                })



                eval(code)
            }
        } catch (e) {

        }
    });
}

