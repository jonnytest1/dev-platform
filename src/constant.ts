import { join } from 'path';

export const root = join(__dirname, "..")

export const scriptSrc = join(root, "script-src")
export const dataDir = join(root, "data-dir")


export const config = join(root, "config")
export const logDir = join(root, "log")

export const platformSCript = join(scriptSrc, "platform.js")