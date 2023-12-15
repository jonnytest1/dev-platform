import { BrowserWindow, Debugger, MessagePortMain, ipcMain } from 'electron';
import CDP from "chrome-remote-interface"
import { Protocol } from "devtools-protocol"
import { Frame } from './frame';
import { CentralToClientEvent } from "../preload/client-event"


export class FrameCentral {
    frameMap: Record<string, Frame> = {}


    constructor(public window: BrowserWindow) {
        ipcMain.on("frame-coms", async (e, evtdata) => {
            if (evtdata.type == "init") {
                const newFrame = new Frame(e);

                if (this.frameMap[newFrame.frameId]) {
                    await this.frameMap[newFrame.frameId].cleanup()
                }
                this.frameMap[newFrame.frameId] = newFrame

                e.sender.addListener("destroyed", e => {
                    newFrame.cleanup()
                    delete this.frameMap[newFrame.frameId]
                })

                await newFrame.init()
                newFrame.initChannel(this)
            }
        })
    }

    async forOthers(frame: Frame, cb: ((frame: Frame) => void)) {
        for (const key in this.frameMap) {
            if (key !== frame.frameId + "" && this.frameMap[key].doc?.root.documentURL !== "chrome-error://chromewebdata/") {
                try {
                    await cb(this.frameMap[key])
                } catch (e) {
                    console.error(e)
                }
            }
        }
    }

    sendToOthers<T extends CentralToClientEvent>(self: Frame, type: T["type"], data: T) {
        for (const key in this.frameMap) {
            if (key !== self.frameId + "") {
                this.frameMap[key].channel.postMessage({
                    type,
                    data
                })
            }
        }
    }


    private sendToAll<T extends CentralToClientEvent>(type: T["type"], data: T) {
        this.sendToOthers({ frameId: "__" } as Frame, type, data)
    }

    update(e: Electron.MessageEvent) {
        const evt = JSON.parse(e.data);
        if (evt.type == "disable-mouse-mirror") {
            Frame.mouseMirrorEnabled = false
            this.sendToAll("removemousemirror", { type: "removemousemirror" })
        } else if (evt.type == "enable-mouse-mirror") {
            Frame.mouseMirrorEnabled = true
        }
    }
}


export function registerFrameCentral(w: BrowserWindow) {
    return new FrameCentral(w)
}