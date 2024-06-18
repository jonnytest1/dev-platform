import { setHandler } from '../../preload/cross-ready/communication';
import * as fetch from "node-fetch"
export function regsiterScriptHandler() {

    setHandler("scriptContent", async e => {
        if (!e.data) {
            return undefined;
        }

        const pr = await fetch.default(e.data?.src)
        const text = await pr.text()
        return text

    })

}