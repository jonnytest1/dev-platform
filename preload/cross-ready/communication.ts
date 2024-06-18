
import { ipcRenderer, ipcMain, BrowserWindow, IpcMainEvent, WebFrameMain } from 'electron';
import { ResolvablePromise } from './resolvable-promise';
import { UrlMatch } from './url-matcher';
import { FormProps } from './types/form';

interface ResponseMap {
    formdata: FormProps
    | "never"  // dont store
    | undefined // not set 

    promptWindow: {
        [key: string]: string
    }
}

type ResponseType<T> = T extends keyof ResponseMap ? ResponseMap[T] : void

interface ParameterMap {

    promptWindow: {
        explanation: string,
        formcontent: string,
        key: string
    }

    formsubmit: FormProps

    formdata: {
        action: string
    }

    asdf: any
}


type EventCallBack<T extends keyof ParameterMap = keyof ParameterMap> = (val: CustomEvent<T>, evt: IpcMainEvent)
    => (ResponseType<T> | Promise<ResponseType<T>>)

const promiseMap: Record<string, ResolvablePromise<any>> = {}
const handlers: Record<string, EventCallBack<any>> = {}




export interface CustomEvent<K extends keyof ParameterMap = keyof ParameterMap, RT extends keyof ParameterMap = keyof ParameterMap> {
    type: K, data?: ParameterMap[K], uuid?: string
}


interface ResolveEvent<K extends keyof ParameterMap = keyof ParameterMap> {
    type: "_resolve"
    data: {
        isError?: boolean,
        data: CustomEvent<K>,
        response: ResponseType<K>
    }
    uuid?: string
}


export function sendMessage<T extends keyof ParameterMap>(message: CustomEvent<T> | ResolveEvent, frame?: WebFrameMain)
    : ResolvablePromise<ResponseType<T>> {
    message.uuid = Math.random() + ""
    const pr = promiseMap[message.uuid] = new ResolvablePromise()
    if (ipcMain) {
        if (frame) {
            frame.send('asynchronous-message', message)
        } else {
            BrowserWindow.getAllWindows()[0].webContents.send('asynchronous-message', message)
        }
    } else {
        ipcRenderer.send("asynchronous-message", message)
    }
    if (message.type == "_resolve") {
        pr.resolve(undefined)
        delete promiseMap[message.uuid]
    }

    return pr;
}

export function setHandler<T extends keyof ParameterMap>(type: T, callback: EventCallBack<T>) {
    handlers[type] = callback
}



async function handleMessage<T extends keyof ParameterMap>(evt: any, arg: CustomEvent<T> | ResolveEvent<T>) {
    const ev = arg;
    console.log("message " + arg.type)
    if (ev.type === "_resolve") {
        const resolveEv = ev as ResolveEvent
        let resp = resolveEv.data.response
        try {
            resp = JSON.parse(resp as unknown as string)
        } catch (e) {
            //
        }
        console.log("resolve for " + resolveEv.data.data.data + " " + !!promiseMap[resolveEv.data.data.uuid as string])
        if (resolveEv.data.isError) {
            promiseMap[resolveEv.data.data.uuid as string]?.reject(resp)
        } else {
            promiseMap[resolveEv.data.data.uuid as string]?.resolve(resp)
        }
    } else {
        const dataEvt = arg as CustomEvent
        if (!handlers[dataEvt.type]) {
            console.log("no handler for " + arg.type)
        }
        try {
            const promise = handlers[dataEvt.type]?.(dataEvt, evt);
            const response = await promise
            sendMessage({
                type: "_resolve",
                data: {
                    data: dataEvt,
                    response: response as any
                }
            }, (evt as IpcMainEvent).senderFrame)
        } catch (e) {
            sendMessage({
                type: "_resolve",
                data: {
                    isError: true,
                    data: dataEvt,
                    response: e
                }
            }, (evt as IpcMainEvent).senderFrame)
        }
    }

}

if (ipcMain) {
    ipcMain.on("asynchronous-message", handleMessage)
} else {
    ipcRenderer.on('asynchronous-message', handleMessage);
}