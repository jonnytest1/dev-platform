export type Selector = {
    tag: string,
    id?: string,
    classList: Array<string>
    queryStr: string,
    textContent?: string
}



export function selectorFromElement(element: HTMLElement) {
    const selectors: Array<Selector> = []

    do {
        let selector: Selector = {
            tag: element.tagName,
            queryStr: element.tagName,
            classList: [],
            textContent: element.textContent ?? undefined
        }
        if (element.id) {
            selector.queryStr += `#${element.id}`
            selector.id = element.id
        }
        for (const el of element.classList) {
            selector.queryStr += `.${el}`
            selector.classList.push(el)
        }

        selectors.unshift(selector)
        if (element.parentElement) {
            element = element.parentElement
        } else {
            break
        }
    } while (true)
    selectors.shift()
    selectors.shift()

    return selectors
}
export function elementFromMappedSelectors<T extends HTMLElement = HTMLElement>(selectors: Array<Selector>) {
    let element: Element = document.body
    for (const selector of selectors) {
        let options = [...element.querySelectorAll(selector.queryStr)]
            .filter(el => el.classList.length === selector.classList.length)
        if (options.length > 1) {
            const textFiltered = options.filter(opt => opt.textContent === selector.textContent)
            if (textFiltered.length) {
                options = textFiltered
            }
        }

        if (options.length === 1) {
            element = options[0]
        } else if (options.length) {

            debugger
        }

    }

    return element as T
}