import { appendFile } from 'fs/promises'
import { logDir } from '../constant'
import { join } from 'path'

export async function addToLog(message: string, params: Record<string, any> = {}) {
    const now = new Date()

    const fileName = `${now.getFullYear()}-${now.getMonth()}`

    const filePath = join(logDir, `${fileName}.log`)


    appendFile(filePath, `${now.toISOString()}: ${message};${JSON.stringify(params)}\n`)
}