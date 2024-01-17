import { dirname, join } from 'path'
import { config } from '../constant'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { FormProps } from '../../preload/cross-ready/types/form'
import { Profile } from "../../preload/cross-ready/types/profile"



export interface ConfigTypes {
    form: Record<string, FormProps | "never">
    profiles: {
        profiles: Record<string, Profile>
        current: string
    }


    props: {
        useSpanMaxScreen?: boolean
    }
}


export async function setCfg<K extends keyof ConfigTypes>(key: K, value: ConfigTypes[K]) {
    const file = join(config, `${key}.json`)
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(value, undefined, "   "))
}

export async function getCfg<K extends keyof ConfigTypes>(key: K): Promise<ConfigTypes[K] | null> {
    const file = join(config, `${key}.json`)
    try {
        const str = await readFile(file, { encoding: "utf8" })
        return JSON.parse(str) as ConfigTypes[K]
    } catch (e) {
        return null
    }
}