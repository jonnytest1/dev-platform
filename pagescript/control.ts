import { execution } from './dom-ready-execution.js';
import { cloneNode, reset } from './template-framework.js'
import { WebContents } from 'electron';
import type { Profile } from '../preload/cross-ready/types/profile.ts';

type WebViewType = WebContents & HTMLElement

const msgChannel = new MessageChannel()
msgChannel.port1.start()
msgChannel.port2.start()

msgChannel.port2.addEventListener("message", e => {
    const evt = JSON.parse(e.data)
    if (evt.type == "profile") {
        profileData = evt.data
        renderWebviews(evt.data)
    }
})

postMessage(JSON.stringify({
    type: "init-control-script"
}), "*", [msgChannel.port1])

let scale = 0.4
let profileData: Profile;

const scaleInpt = document.querySelector<HTMLInputElement>("#scale");
scaleInpt.addEventListener("change", e => {
    const sliderVal = +scaleInpt.value
    scale = sliderVal / 100

    document.body.style.setProperty("--scale", `${scale}`)
    //if (profileData)
    // renderWebviews(profileData)
})

const reloadbtn = document.querySelector<HTMLButtonElement>("#reloadAll")
reloadbtn.addEventListener("click", e => {
    document.querySelectorAll<WebViewType>("webview").forEach(w => {
        w.reloadIgnoringCache()
    })
})
const backBtn = document.querySelector<HTMLButtonElement>("#backBtn")
backBtn.addEventListener("click", e => {
    document.querySelectorAll<WebViewType>("webview").forEach(w => {
        try {
            w.executeJavaScript("history.back()")
        } catch (e) {

        }
    })
})




document.body.style.setProperty("--viewscaling", `${scale}`)
const viewscalingCheck = document.querySelector<HTMLInputElement>(".viewascaling");
viewscalingCheck.addEventListener("change", e => {

    document.querySelectorAll(".mirror").forEach(el => {
        viewscalingCheck.checked ? el.classList.add("viewscalingdisabled") : el.classList.remove("viewscalingdisabled")
    })
})

const input = document.querySelector<HTMLInputElement>("#url")
input.addEventListener("change", e => {
    document.querySelectorAll<WebViewType>("webview").forEach(el => {

    })
})

const mousemirrorInpt = document.querySelector<HTMLInputElement>("#mousemirror")
mousemirrorInpt.addEventListener("change", e => {
    if (mousemirrorInpt.checked) {
        msgChannel.port2.postMessage(JSON.stringify({
            type: "enable-mouse-mirror"
        }))
    } else {
        msgChannel.port2.postMessage(JSON.stringify({
            type: "disable-mouse-mirror"
        }))
    }
})

function renderWebviews(cfg: Profile) {
    reset(".frame-grid")

    document.body.style.setProperty("--scale", `${scale}`)

    let parent = document.querySelector<HTMLElement>(".frame-grid")

    for (const display of cfg.displays) {
        let newParent = parent
        if (true || display.name.startsWith("phone")) {
            const subPArent = document.createElement("div")
            subPArent.classList.add("frame-grid")
            newParent.appendChild(subPArent)
            newParent = subPArent
        }
        interface Ids {
            webview: WebViewType;
            wrapper: HTMLElement;
            urldisplay: HTMLSpanElement;
            ctrl: HTMLElement;
        }

        const newNode = cloneNode<Ids>(".view", {
            url: cfg.url,
            ...display,
            height: display.height + "",
            width: display.width + "",
            inspectclick: () => {
                newNode.webview.openDevTools()
            },
            reloadclick: () => {
                newNode.webview.reloadIgnoringCache()
            }
        }, {
            insertParent: newParent
        })


        const setProps = (frame: Ids & {
            rootEl: HTMLElement
        }) => {
            frame.rootEl.style.setProperty("--original-width", display.width + "px")
            frame.rootEl.style.setProperty("--original-height", display.height + "px")


            /*   frame.rootEl.style.setProperty("--width", Math.ceil(display.width * scale) + "px")
               frame.rootEl.style.setProperty("--height", Math.ceil(display.height * scale) + "px")
               frame.webview.style.width = display.width + "px"
               frame.webview.style.height = display.height + "px"
               frame.wrapper.style.height = Math.ceil(display.height * scale) + "px"
               frame.wrapper.style.width = Math.ceil(display.width * scale) + "px" */

            frame.webview.addEventListener("did-navigate-in-page", e => {
                frame.urldisplay.textContent = frame.webview.getURL()
                frame.ctrl.title = frame.webview.getURL()
            })
            frame.webview.addEventListener("dom-ready", () => {
                frame.webview.executeJavaScript(`(${execution.toString()})()`)
            })
        }
        setProps(newNode)
        newNode.webview.style.border = "4px solid green"

        setTimeout(() => {
            //  newNode.webview.openDevTools()
        }, 100)
        if (cfg.comparisonUrl) {
            const newNodeVertical = cloneNode<Ids>(".view", {
                url: cfg.comparisonUrl,
                ...display,
                height: display.height + "",
                width: display.width + "",
                inspectclick: () => {
                    newNodeVertical.webview.openDevTools()
                },
                reloadclick: () => {
                    newNodeVertical.webview.reloadIgnoringCache()
                }
            }, {
                insertParent: newParent
            })

            setProps(newNodeVertical)
            newNodeVertical.rootEl.classList.add("mirror-vertical", "mirror")

            //newNodeVertical.rootEl.style.setProperty("--width", Math.ceil(display.width * scale * 0.5) + "px")


            const newNodeHorizontal = cloneNode<Ids>(".view", {
                url: cfg.comparisonUrl,
                ...display,
                height: display.height + "",
                width: display.width + "",
                inspectclick: () => {
                    newNodeHorizontal.webview.openDevTools()
                },
                reloadclick: () => {
                    newNodeHorizontal.webview.reloadIgnoringCache()
                }
            }, {
                insertParent: newParent
            })
            setProps(newNodeHorizontal)
            newNodeHorizontal.rootEl.classList.add("mirror-horizontal", "mirror")



            const diff = cloneNode<Ids>(".view", {
                url: cfg.comparisonUrl,
                ...display,
                height: display.height + "",
                width: display.width + "",
                inspectclick: () => {
                    //newNodeHorizontal.webview.openDevTools()
                },
                reloadclick: () => {
                    // newNodeHorizontal.webview.reloadIgnoringCache()
                }
            }, {
                insertParent: newParent
            })
            diff.rootEl.classList.add("diff", "mirror")
            const canvas = document.createElement("canvas")
            const context = canvas.getContext("2d", { willReadFrequently: true })
            diff.webview.replaceWith(canvas)

            let diffing = true
            const printDiff = async () => {
                while (diffing) {
                    try {
                        const [mainI, compareI] = await Promise.all([
                            newNode.webview.capturePage(),
                            newNodeHorizontal.webview.capturePage()
                        ])

                        const scaleSize = mainI.getSize(scale);
                        canvas.width = scaleSize.width
                        canvas.height = scaleSize.height


                        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
                        const mainDAta = mainI.getBitmap()
                        const compareData = compareI.getBitmap()
                        let diffCt = 0
                        for (let i = 0; i < imageData.data.byteLength; i++) {
                            const pixelDiff = mainDAta[i] - compareData[i];
                            imageData.data[i] = 255 - (pixelDiff)
                            diffCt += pixelDiff
                        }
                        context.putImageData(imageData, 0, 0)
                        if (diffCt === 0) {
                            diff.rootEl.classList.remove("different")
                        } else {

                            diff.rootEl.classList.add("different")
                        }

                    } catch (e) {

                    }
                    await new Promise<void>(res => setTimeout(res, 100))
                }
            }


            printDiff()
        }
        //newNodeHorizontal.rootEl.style.setProperty("--height", Math.ceil(display.height * scale * 0.5) + "px")
        if (!display.name.startsWith("phone")) {
            const subPArent = document.createElement("div")
            subPArent.classList.add("frame-grid")
            parent.appendChild(subPArent)
            // parent = subPArent
        }





    }

}


/**
 * , {
        name: "phone double",
        width: 691,
        height: 655
    }
 */
