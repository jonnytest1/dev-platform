import CDP from 'chrome-remote-interface'
import Protocol from 'devtools-protocol'
import { IpcMainEvent, MessagePortMain, ipcMain } from 'electron'
import { FrameCentral } from './frame-central'
import { ClickEvt, ClientToCentralEvents, MouseMoveEvt } from "../preload/client-to-server-events"
import { addToLog } from './util/logging'
export class Frame {

    static mouseMirrorEnabled = true
    static syncEnabled = true

    channel: MessagePortMain
    debugger: Omit<Electron.Debugger, "sendCommand"> & {
        sendCommand: CDP.Client["send"]
    }
    hoverId?: number
    hoverSelector?: string
    focusId?: number
    focusSelector?: string
    doc?: Protocol.DOM.GetDocumentResponse
    htmlNode?: Protocol.DOM.Node
    bodyNode?: Protocol.DOM.Node

    frameId: string

    documentInterval: NodeJS.Timeout | null = null

    constructor(e: IpcMainEvent) {
        this.channel = e.ports[0]

        this.debugger = e.sender.debugger as Frame["debugger"]
        this.frameId = e.processId + ""



        e.sender.session.webRequest.onBeforeSendHeaders((details, cb) => {
            /*try {
                if (details.uploadData && details.requestHeaders["Content-Type"] === "application/x-www-form-urlencoded") {
                    const form = new URLSearchParams(details.uploadData[0].bytes.toString())
                    const username = form.get("username")
                    const pwd = form.get("password")
                    debugger;
                }
            } catch (e) {
                debugger;
            }*/
            cb({})
        })

    }

    async init() {
        try {
            await this.debugger.attach("1.3")
        } catch (e) {
            if (!e.message.includes("already attached")) {
                throw e;
            }
        }

        await this.debugger.sendCommand("DOM.enable");
        await this.debugger.sendCommand("CSS.enable");

        // await this.debugger.sendCommand("Network.enable")
        await this.debugger.sendCommand("Network.setBypassServiceWorker", {
            bypass: true
        })

        await this.setupDocument()

        this.documentInterval = setInterval(() => {
            this.setupDocument()
        }, 1000)
    }

    cleanup() {
        if (this.documentInterval) {
            clearInterval(this.documentInterval)
            this.documentInterval = null
        }
    }


    async setupDocument() {
        this.doc = await this.debugger.sendCommand("DOM.getDocument")
        this.htmlNode = this.doc?.root?.children?.find(c => c.nodeName == "HTML")
        this.bodyNode = this.htmlNode?.children?.find(c => c.nodeName == "BODY")
    }


    initChannel(eventEmitter: import("./frame-central").FrameCentral) {
        this.channel.start();

        this.channel.on("message", async e => {
            try {
                const evt = JSON.parse(e.data) as ClientToCentralEvents;
                console.log("event with type " + evt.type)
                if (evt.type == "mousemove") {
                    if (Frame.mouseMirrorEnabled && Frame.syncEnabled) {
                        await this.handleMouseMoveEvent(evt, eventEmitter)
                    }
                } else if (evt.type == "click") {
                    addToLog(`clickevent`, { selector: evt.selectors, position: evt.data })
                    if (Frame.syncEnabled) {
                        await this.handleClickEvent(evt, eventEmitter)
                    }
                } else if (evt.type == "input") {
                    addToLog(`inputevent`, { selector: evt.selectors, text: evt.text })
                    if (Frame.syncEnabled) {
                        eventEmitter.sendToOthers(this, "input", evt)
                    }
                } else if (evt.type == "scroll") {
                    addToLog(`scrollevent`, { scrollTargetSelectors: evt.selectors, offset: evt.offset })
                    if (Frame.syncEnabled) {
                        eventEmitter.sendToOthers(this, "scroll", evt)
                    }
                }
            } catch (e) {
                console.log(e)
            }

        })
    }

    public pseudoSTateForId(nodeId: number, nodeSelector: string) {
        const states = new Set<string>()
        if (this.focusId == nodeId || this.focusSelector == nodeSelector) {
            states.add("focus")
        }
        if (this.hoverId == nodeId || this.hoverSelector == nodeSelector) {
            states.add("hover")
        }
        return states
    }

    private async handleClickEvent(evt: ClickEvt, eventEmitter: import("./frame-central").FrameCentral) {

        eventEmitter.sendToOthers(this, "click", evt)
        const highlightSelector = evt.selectors.map(s => s.queryStr).join(" ")
        eventEmitter.window.webContents.send('focusupdate', highlightSelector)
        if (evt.selectors.length) {
            await eventEmitter.forOthers(this, async (otherFrame) => {
                try {
                    const [newNode, unhover] = await Promise.all([
                        otherFrame.debugger.sendCommand("DOM.querySelector", {
                            selector: highlightSelector,
                            nodeId: otherFrame.bodyNode!.nodeId
                        }),
                        otherFrame.resetFocusState()
                    ] as const)
                    otherFrame.focusId = newNode.nodeId
                    otherFrame.focusSelector = highlightSelector
                    console.log("focus on " + otherFrame.focusId)

                    const pseudoSTateForId = this.pseudoSTateForId(newNode.nodeId, highlightSelector)
                    pseudoSTateForId.add("focus")
                    otherFrame.debugger.sendCommand("CSS.forcePseudoState", {
                        nodeId: newNode.nodeId,
                        forcedPseudoClasses: [...pseudoSTateForId]
                    })
                } catch (e) {
                    console.trace(e)
                }
            })
        }
    }

    private async resetHoverState() {
        if (this.hoverId === undefined) {
            return
        }
        const pseudoSTateForId = this.pseudoSTateForId(this.hoverId, this.hoverSelector!)
        pseudoSTateForId.delete("hover")
        console.log("reset hover on " + this.hoverId + " with :" + [...pseudoSTateForId] + ":")
        await this.debugger.sendCommand("CSS.forcePseudoState", {
            nodeId: this.hoverId,
            forcedPseudoClasses: [...pseudoSTateForId]
        }).catch(e => { })
        this.hoverId = undefined
        this.hoverSelector = undefined
    }
    private async resetFocusState() {
        if (this.focusId === undefined) {
            return
        }
        const pseudoSTateForId = this.pseudoSTateForId(this.focusId, this.focusSelector!)
        pseudoSTateForId.delete("focus")
        console.log("reset focus on " + this.focusId + " with " + [...pseudoSTateForId])
        await this.debugger.sendCommand("CSS.forcePseudoState", {
            nodeId: this.focusId,
            forcedPseudoClasses: [...pseudoSTateForId]
        }).catch(e => { })
        this.focusId = undefined
        this.focusSelector = undefined
    }

    private async handleMouseMoveEvent(evt: MouseMoveEvt, eventEmitter: FrameCentral) {

        const highlightSelector = evt.selectors.map(s => s.queryStr).join(" ")
        eventEmitter.window.webContents.send('hoverupdate', highlightSelector)
        eventEmitter.sendToOthers(this, "mousemove", evt)
        if (evt.selectors.length) {


            await eventEmitter.forOthers(this, async (otherFrame) => {
                try {
                    if (highlightSelector === otherFrame.hoverSelector) {
                        return
                    }
                    const [newNode, unhover] = await Promise.all([
                        otherFrame.debugger.sendCommand("DOM.querySelector", {
                            selector: highlightSelector,
                            nodeId: otherFrame.bodyNode!.nodeId
                        }),
                        otherFrame.resetHoverState()
                    ] as const)
                    otherFrame.hoverId = newNode.nodeId
                    otherFrame.hoverSelector = highlightSelector
                    const pseudoSTateForId = otherFrame.pseudoSTateForId(newNode.nodeId, highlightSelector)
                    pseudoSTateForId.add("hover")
                    console.log("hover on " + otherFrame.hoverId)
                    otherFrame.debugger.sendCommand("CSS.forcePseudoState", {
                        nodeId: newNode.nodeId,
                        forcedPseudoClasses: [...pseudoSTateForId]
                    })
                } catch (e) {
                    console.trace(e)
                }
            })
        } else {
            await eventEmitter.forOthers(this, async (otherFrame) => {
                if (otherFrame.hoverId) {
                    otherFrame.resetHoverState()
                    otherFrame.hoverSelector = undefined
                }
            })
        }

    }
}