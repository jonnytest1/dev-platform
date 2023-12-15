import { Selector } from './element-selector'

export type InputEvent = {
    type: "input",
    selectors: Array<Selector>
    text: string
}
export type MouseMoveEvent = {
    type: "mousemove",
    selectors: Array<Selector>
    data: {
        x: number,
        y: number
    }
}
export type RemoveMouseMirrorEvent = {
    type: "removemousemirror"
}
export type ClickEvent = {
    type: "click",
    selectors: Array<Selector>
}
export type ScrollEvt = {
    type: "scroll"
    selectors: Array<Selector>
    offset: number
}

export type CentralToClientEvent = InputEvent | MouseMoveEvent | ClickEvent | ScrollEvt | RemoveMouseMirrorEvent

