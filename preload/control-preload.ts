import { ipcRenderer } from 'electron'

ipcRenderer.on("focusupdate", (e, data) => {
    document.querySelector("#focusSelector")!.textContent = data
    // document.querySelector<HTMLElement>(".focus-wrapper")!.style.display = "block"
})


ipcRenderer.on("hoverupdate", (e, data) => {
    document.querySelector("#hoverSelector")!.textContent = data
    //document.querySelector<HTMLElement>(".focus-wrapper")!.style.display = "block"
})



addEventListener("message", e => {
    const evt = JSON.parse(e.data)
    if (evt.type == "init-control-script") {
        const port = e.ports[0]

        ipcRenderer.postMessage("init-control-script", "data", [port])
    }

})