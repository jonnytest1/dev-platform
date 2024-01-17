import { ConfigTypes, getCfg, setCfg } from './data';

export async function mergeProps<T extends ConfigTypes["props"]>(partialProps: Partial<T>) {
    const props = await getProps()
    Object.assign(props, partialProps);
    await setCfg("props", props)
}


export async function getProps() {
    return (await getCfg("props")) ?? {}
}