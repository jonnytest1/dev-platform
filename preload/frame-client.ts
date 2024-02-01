import { ipcRenderer } from 'electron'
import { Vector } from './vector'
import { off } from 'process'
import { BoundingBox } from './bounding-box'
import { quantifyPosition } from './grid-iterator'
import { CentralToClientEvent } from './client-event'
import { ClientToCentralEvents, ClientToCentralEventsMap } from './client-to-server-events'
import { elementFromMappedSelectors, selectorFromElement } from './element-selector'
import { sendMessage, setHandler } from './cross-ready/communication'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
console.log("frame-client")

const channel = new MessageChannel()
channel.port1.start()
channel.port2.start()
if (!location.href.includes("{{url}}")) {
    ipcRenderer.postMessage("frame-coms", {
        type: "init"
    }, [channel.port1])
}






function send<T extends keyof ClientToCentralEventsMap>(data: ClientToCentralEventsMap[T]) {
    channel.port2.postMessage(JSON.stringify(data))
}


let lastSend = 0
addEventListener("load", e => {


    let clickCheck = true
    let inputCheck = true
    let scrollCheck = true
    let scroolCheckTimeut: NodeJS.Timeout | null = null

    let tempCursor = document.createElement("div")
    tempCursor.classList.add("cursor")
    tempCursor.style.position = "fixed"
    tempCursor.style.width = "8px"
    tempCursor.style.height = "8px"
    tempCursor.style.backgroundColor = "red"
    tempCursor.style.zIndex = "999999999"
    document.body.appendChild(tempCursor)

    channel.port2.addEventListener("message", message => {
        const evt = message.data.data as CentralToClientEvent
        if (evt.type == "mousemove") {
            tempCursor.style.display = "initial"
            tempCursor.style.left = evt.data.x * innerWidth + "px"
            tempCursor.style.top = evt.data.y * innerHeight + "px"
        } else if (evt.type == "removemousemirror") {
            tempCursor.style.display = "none"
        } else if (evt.type == "click") {
            const clickTarget = elementFromMappedSelectors(evt.selectors)
            if (!clickTarget) {
                debugger
            }
            clickCheck = false

            const clickEvt = new MouseEvent("click", {
                bubbles: true
            })
            clickTarget?.dispatchEvent(clickEvt)
            // clickTarget?.click?.();
            const focusEvt = new FocusEvent("focus")
            clickTarget?.dispatchEvent(focusEvt)
            clickCheck = true
        } else if (evt.type == "input") {
            const clickTarget = elementFromMappedSelectors<HTMLInputElement>(evt.selectors)
            if (clickTarget) {
                inputCheck = false
                clickCheck = false
                clickTarget.focus()
                const focusEvt = new FocusEvent("focus")
                clickTarget.dispatchEvent(focusEvt)
                clickTarget.click()
                clickTarget.value = evt.text
                inputCheck = true
                clickCheck = true
            }
        } else if (evt.type == "scroll") {
            const scrollTarget = elementFromMappedSelectors<HTMLInputElement>(evt.selectors)
            scrollCheck = false
            scrollTarget.scrollTo({ top: evt.offset, behavior: "instant" })
            if (scroolCheckTimeut) {
                clearTimeout(scroolCheckTimeut)
            }
            scroolCheckTimeut = setTimeout(() => {
                scrollCheck = true
                scroolCheckTimeut = null
            }, 500)
        }
    })
    document.body.addEventListener("mousemove", e => {
        try {
            tempCursor.style.display = "none"
            if (Date.now() - lastSend < 10) {
                return
            }
            lastSend = Date.now()
            const target = e.target
            const selectors = selectorFromElement(target as HTMLElement)

            //console.log(selectors)
            //quantifyPosition(new Vector(e))
            send({
                type: "mousemove",
                selectors,
                data: {
                    x: e.pageX / innerWidth,
                    y: e.pageY / innerHeight
                }
            })
        } catch (e) {
            debugger
        }
    })


    document.addEventListener("click", e => {
        if (!clickCheck) {
            return
        }
        const target = e.target
        const selectors = selectorFromElement(target as HTMLElement)
        send({
            type: "click",
            selectors,
            data: {
                x: e.pageX / innerWidth,
                y: e.pageY / innerHeight
            }
        })
    }, true)


    document.addEventListener("scroll", e => {
        const target = e.target as HTMLInputElement
        const selectors = selectorFromElement(target)
        if (!scrollCheck) {
            return
        }
        send({
            type: "scroll",
            selectors,
            offset: target.scrollTop
        })
    }, true)

    document.addEventListener("input", e => {
        const target = e.target as HTMLInputElement
        const selectors = selectorFromElement(target)
        if (!inputCheck) {
            return
        }
        send({
            type: "input",
            selectors,
            text: target.value
        })
    }, true)


    console.log("submit intercept")

    /* document.querySelectorAll("form").forEach(form => {
         const submitFnc = form.submit
         console.log("submit intercept form")
         form.submit = () => {
             debugger
         }
         form.addEventListener("submit", e => {
 
 
             e.preventDefault()
             debugger
             return false
         }, { capture: true })
})*/
})

addEventListener("message", e => {
    const evt = JSON.parse(e.data)
    if (evt.type == "form-send" && evt.data.props.username) {
        /*sendMessage({
            type: "promptWindow",
            data: {
                explanation: "store password for " + evt.data.action + " with username " + evt.data.props.username,
                formcontent: `<input type="submit" value="yes" name="submittype"><input type="submit" value="never"  name="submittype">`,
                key: "password storage"
            }
        }).then(reply => {
            debugger
        })*/
        sendMessage({ type: "formsubmit", data: evt.data })

    } else if (evt.type == "formdata") {
        sendMessage({ type: "formdata", data: { action: evt.data.action } })
            .then(response => {
                if (response === "never") {
                    return
                }
                const form = document.querySelector(`form[action*="${response.action}"]`)
                for (const prop in response.props) {
                    const input = form?.querySelector(`#${prop}`)
                    debugger
                    if (input && input instanceof HTMLInputElement) {
                        input.value = response.props[prop] as string
                        input.focus()
                        input.oninput?.({} as any)
                    }
                }
            })
    }
})


try {
    const scriptDir = join(__dirname, "pagescripting")
    const files = readdirSync(scriptDir, { withFileTypes: true, encoding: "utf8" })
    for (const file of files) {
        if (file.name.endsWith(".map")) {
            continue
        }
        const filePath = join(scriptDir, file.name)
        const fileContent = readFileSync(filePath, { encoding: "utf8" })
        eval(fileContent)
    }
} catch (e) {
    debugger
}