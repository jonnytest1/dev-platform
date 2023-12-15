import { setHandler } from '../preload/cross-ready/communication';
import { ResolvablePromise } from '../preload/cross-ready/resolvable-promise';
import { cratePrompt } from './prompt/window-prompt';
import { getCfg, setCfg } from './util/data';

export function registerFormHandler() {

    setHandler("formsubmit", async e => {
        const evt = e.data!
        const formCfg = await getCfg("form") ?? {}
        if (formCfg[evt.action]) {
            return
        }

        const result = await cratePrompt({
            type: "promptWindow",
            data: {
                explanation: "store password for " + evt.action + " with username " + evt.props.username,
                formcontent: `<input type="submit" value="yes" name="submittype"><input type="submit" value="never"  name="submittype">`,
                key: "password storage"
            }
        })
        const choice = result.submittype
        formCfg[evt.action!] = evt
        await setCfg("form", formCfg)
    })


    setHandler("formdata", async e => {
        const formCfg = await getCfg("form") ?? {}

        return formCfg[e.data!.action]

    })
}