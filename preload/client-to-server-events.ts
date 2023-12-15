import { Selector } from './element-selector'

export type MouseMoveEvt = {
    type: "mousemove"
    selectors: Array<Selector>
    data: {
        x: number,
        y: number
    }
}
export type ClickEvt = {
    type: "click"
    selectors: Array<Selector>
    data: {
        x: number,
        y: number
    }
}

export type InputEvt = {
    type: "input"
    selectors: Array<Selector>
    text: string
}
export type ScrollEvt = {
    type: "scroll"
    selectors: Array<Selector>
    offset: number
}



export type ClientToCentralEvents = MouseMoveEvt | ClickEvt | InputEvt | ScrollEvt


export type ClientToCentralEventsMap = {
    [K in ClientToCentralEvents as K["type"]]: K
}