type BindingTypes<T> = string | boolean | number | ((event: Event, ctx: T) => void) | HTMLElement

function insertElement<T>(el: HTMLElement, props: Record<string, BindingTypes<T>>, ids: Record<string, HTMLElement>) {
    let newel: HTMLElement & { partition?: string } = el;
    if (el.tagName == "WEBVIEW") {
        newel = document.createElement("webview") as HTMLElement;
        el.parentElement!.replaceChild(newel, el)

        el.remove()
    }

    if (el.textContent!.match(/^{{.*}}$/)) {
        const elVar = el.textContent!.replace(/[{}]/g, "");
        if (props[elVar]) {
            newel.textContent = props[elVar] as string
        }
    }
    for (const attr of el.getAttributeNames()) {

        if (el.getAttribute(attr)!.match(/^{{.*}}$/)) {
            const elVar = el.getAttribute(attr)!.replace(/[{}]/g, "");
            const prop = props[elVar];
            if (prop) {
                //el.textContent = props[elVar]
                if (typeof prop == "string") {
                    newel.setAttribute(attr, prop)
                }
                if (attr.match(/^\(.*\)$/)) {
                    const attrStr = attr.replace(/[()]/g, "");
                    newel.addEventListener(attrStr, (e) => {
                        (prop as (...args: any) => any)(e, ids)
                    })
                } else {
                    (el as unknown as Record<string, BindingTypes<T>>)[attr] = prop
                }
            }

        } else if (attr.match(/^\(.*\)$/)) {
            const attrStr = attr.replace(/[()]/g, "");
            const prop = props[attrStr];
            if (prop && typeof prop == "function") {
                newel.addEventListener(attrStr, (e) => {
                    prop(e, ids as T)
                })
            }
        } else if (attr.startsWith("#")) {
            ids[attr.substring(1)] = newel;
            // newel.setAttribute(attr, el.getAttribute(attr))
        } else {
            if (newel !== el) {
                try {
                    newel.setAttribute(attr, el.getAttribute(attr) as string)

                } catch (e) {
                    //ignore for now
                }
            }
        }

    }
}


function recursiveInsertElement<T>(element: HTMLElement, props: Record<string, BindingTypes<T>>, ids: T) {
    insertElement(element, props, ids as Record<string, HTMLElement>)

    for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i];
        if (child.classList.contains("template")) {
            continue
        }
        if (child instanceof HTMLElement) {
            recursiveInsertElement(child, props, ids)
        }
    }


}


export function cloneNode<T extends object>(selector: string, props: Record<string, BindingTypes<T & { rootEl: HTMLElement }>> = {}, opts: {
    insertParent?: HTMLElement
    queryParent?: HTMLElement
} = {}): T & { rootEl: HTMLElement } {
    const parts = selector.split(" ")
    const lastPart = parts.pop() + ".template"
    const newSelector = parts.map(part => `${part}:not(.template)`)

    const containerElement = opts.queryParent ?? document.body

    const element: HTMLElement = containerElement.querySelector<HTMLElement>(`:not(.template) ${newSelector.join(" ")} ${lastPart}`)!

    const newElement = element.cloneNode(true) as HTMLElement
    const ids: Partial<T & { rootEl: HTMLElement }> = {}
    ids.rootEl = newElement as any

    recursiveInsertElement(newElement, props, ids)

    newElement.classList.remove("template")

    let insertParent = opts.insertParent ?? element.parentElement

    insertParent.appendChild(newElement)
    return ids as T & { rootEl: HTMLElement }
}

export function reset(selector: string) {
    const element = [...document.querySelectorAll(selector + "> :not(.template)")]
    element.forEach(e => e.remove())

}
