





export function execution() {
    console.log("dom-ready-exec")
    const channel = new MessageChannel()
    channel.port1.start()
    channel.port2.start()

    const replyMap: Record<string, Function> = {}

    function query<T extends { type: string }, U>(opts: T): Promise<U> {
        return new Promise(res => {
            const id = `${Math.random()}`
            replyMap[id] = res

            channel.port2.postMessage(JSON.stringify({ ...opts, reqid: id }))
        })
    }

    channel.port2.addEventListener("message", e => {
        const evt = JSON.parse(e.data)
        if (evt.respid) {
            replyMap[evt.respid](evt)
        }
    })


    postMessage(JSON.stringify({ type: "dom-ready" }), {
        targetOrigin: "*",
        transfer: [channel.port1]
    })
    channel.port2.addEventListener("message", m => {
        try {
            let evt = JSON.parse(m.data)
            if (evt.type === "exec-api") {
                console.log("exec")
                eval.call(window, evt.str)({
                    loadPageLibrary: async function loadLib(url: string, csm?: string) {
                        const scr: { str: string } = await query({
                            type: "loadPageLibrary",
                            url
                        })
                        const context = {
                            exports: {

                            },
                            module: {
                                exports: {}
                            }
                        }

                        if (csm) {
                            eval.call(window, scr.str)
                            return window[csm as keyof Window]
                        }

                        eval.call(context, `(function (exports,module,importfnc){
                            ${scr.str.replace("import(", "importfnc(")}
                        })`).call(context, context.exports, context.module, function imp(modUrl: string) {
                            const newUrl = new URL(modUrl, url)
                            return loadLib(newUrl.href)
                        })
                        return context.module.exports
                    }
                })
                channel.port2.postMessage(JSON.stringify({
                    type: "exec-done"
                }))
            }
        } catch (e) {

        }
    })
    document.querySelectorAll("form")
        .forEach(form => {
            const submitFnc = form.submit
            console.log("submit intercept form")

            const formProps: Record<string, string> = {}
            form.submit = () => {
                for (let inptIndex = 0; inptIndex < form.length; inptIndex++) {
                    const inpt = form[inptIndex]
                    if (inpt instanceof HTMLInputElement) {
                        if (inpt.checkVisibility()) {
                            formProps[inpt.id] = inpt.value
                        }
                    }

                }
                const action = new URL(form.action)

                const props = {
                    action: `${action.origin}${action.pathname}`,
                    method: form.method,
                    id: form.id,
                    props: formProps
                }
                postMessage(JSON.stringify({
                    type: "form-send",
                    data: props
                }))
                submitFnc.apply(form)
            }


            const action = new URL(form.action)
            postMessage(JSON.stringify({
                type: "formdata",
                data: {
                    action: `${action.origin}${action.pathname}`,
                }
            }))
        });



}