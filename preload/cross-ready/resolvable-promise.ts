export class ResolvablePromise<T, E = any>{

    public resolve: (value: T | PromiseLike<T>) => void;
    public reject: (reason?: E) => void;

    public prRef: Promise<T>;

    resolvedWith?: T;

    constructor(callback?: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: E) => void) => void) {
        let _res: (value: T | PromiseLike<T>) => void = () => {
            //
        };
        let _rej: (reason?: E) => void = () => {
            //
        };

        this.prRef = new Promise((res, rej) => {
            _res = res;
            _rej = rej;
            if (callback) {
                callback(res, rej);
            }
        });
        this.resolve = (e) => {
            this.resolvedWith = e as T;
            _res(e);
        };
        this.reject = (e) => {
            _rej(e)
        };
    }

    static delayed(millis: number) {
        return new ResolvablePromise((r) => setTimeout(r, millis));
    }

    then(cb: ((e: T) => void)) {
        this.prRef.then(cb);
    }
    catch(cb: ((e: T) => void)) {
        debugger;
        this.prRef.catch(cb);
    }

    finally(cb: (() => void)) {
        debugger;
        this.prRef.finally(cb);
    }
}

ResolvablePromise.prototype.constructor = Promise as any