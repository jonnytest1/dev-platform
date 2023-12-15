export type UrlMatch = string | {
    path?: string,
    query?: string
}

export class UrlMatcher {

    constructor(private match: UrlMatch) {

    }
    matches(requestUrl: URL): boolean {

        if (typeof this.match === "string") {
            const matcherStr = `${requestUrl.pathname}${requestUrl.search}`
            return matcherStr.startsWith(this.match)
        }


        let failedMatch = false

        if (this.match.query) {
            failedMatch ||= !requestUrl.search.includes(this.match.query)
        }
        if (this.match.path) {
            const regex = new RegExp(this.match.path)
            failedMatch ||= !regex.test(requestUrl.pathname)
        }

        if (!failedMatch) {
            //debugger;
        }
        return !failedMatch

    }

    toString() {
        return typeof this.match === "string" ? this.match : `${this.match.path}?${this.match.query}`
    }

}