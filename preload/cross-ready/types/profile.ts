
export interface Display {
    name: string, width: number, height: number, mobile?: boolean
}

export interface Profile {
    displays: Array<Display>
    url: string,
    comparisonUrl: string
}