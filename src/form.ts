import { setHandler } from '../preload/cross-ready/communication';
import { ResolvablePromise } from '../preload/cross-ready/resolvable-promise';
import type { FormProps } from '../preload/cross-ready/types/form';
import { cratePrompt } from './prompt/window-prompt';
import { getCfg, setCfg } from './util/data';


function getOriginUrl(url: string) {
    const urlObj = new URL(url);

    const host = urlObj.host.split(".").toReversed()
    host.length = 2
    const remainingHost = host.toReversed().join(".")

    return `${urlObj.protocol}//.${remainingHost}${urlObj.pathname}`

}


export function registerFormHandler() {

    let pending: Record<string, ResolvablePromise<FormProps> | undefined> = {}


    setHandler("formsubmit", async e => {
        const evt = e.data!


        const formCfg = await getCfg("form") ?? {}
        const evtAction = evt.action;
        if (formCfg[evtAction]) {
            return
        }
        if (pending[evtAction]) {
            await pending[evtAction]
            return
        }
        pending[evtAction] = new ResolvablePromise()

        const result = await cratePrompt({
            type: "promptWindow",
            data: {
                explanation: "store password for " + evt.action + " with username " + evt.props.username,
                formcontent: `<input type="submit" value="yes" name="submittype"><input type="submit" value="yesorigin" name="submittype"><input type="submit" value="never"  name="submittype">`,
                key: "password storage"
            }
        })
        const choice = result.submittype
        let action = evtAction
        if (choice === "yesorigin") {
            action = getOriginUrl(evtAction)
        }
        formCfg[action] = evt

        await setCfg("form", formCfg)
    })


    setHandler("formdata", async e => {
        const formCfg = await getCfg("form") ?? {}

        let props = formCfg[e.data!.action]
        if (!props) {
            props = formCfg[getOriginUrl(e.data?.action!)]
        }
        return props;

    })
}