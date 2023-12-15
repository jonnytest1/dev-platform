export enum AXIS { X, Y }
export const DEG_2_RAD = (Math.PI / 180);

export class Vector {

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static ZERO() {
        return new Vector(0, 0);
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static WINDOW() {
        return new Vector(innerWidth, innerHeight);
    }


    public x: number;
    public y: number;

    constructor(x: number | { x: number; y: number }, y?: number) {
        if (typeof x === 'object') {
            this.y = x.y;
            this.x = x.x;
        } else {
            if (typeof y === 'undefined') {
                throw new Error('y is undefined');
            }
            this.x = x;
            this.y = y;
        }
    }

    xStyle() {
        return this.x + 'px';
    }

    yStyle() {
        return this.y + 'px';
    }

    xLength() {
        return this.length().toFixed(2) + 'px';
    }

    clone() {
        const newVector: this = Object.create(this);
        Object.assign(newVector, this);
        return newVector;
    }

    project(axis: AXIS, otherVector?: Vector) {

        const newVector: this = this.clone();

        if (axis === AXIS.X) {
            newVector.x = otherVector?.x || 0;
        } else {
            newVector.y = otherVector?.y || 0;
        }
        return newVector;

    }

    dividedBy(divisor: number): this {
        const newVector: this = this.clone();
        newVector.x = this.x / divisor;
        newVector.y = this.y / divisor;
        return newVector;
    }

    rotateDeg(degree: number) {
        return this.rotateRadians(degree * DEG_2_RAD);
    }

    rotateRadians(radians: number) {
        const cosinusRads = Math.cos(radians);
        const sinusRads = Math.sin(radians);
        return new Vector(cosinusRads * this.x - sinusRads * this.y, sinusRads * this.x + cosinusRads * this.y);
    }


    multipliedBy(multiplicator: number, multiplicatorY?: number): this {
        const newVector: this = this.clone();

        newVector.x = this.x * multiplicator;
        if (multiplicatorY) {
            newVector.y = this.y * multiplicatorY;
        } else {
            newVector.y = this.y * multiplicator;
        }
        return newVector;
    }
    rounded() {
        const newVector: this = this.clone();
        newVector.x = Math.round(this.x);
        newVector.y = Math.round(this.y);
        return newVector;
    }


    isGreater(vector: Vector) {
        const subtracted = this.subtract(vector);
        return {
            x: subtracted.x > 0,
            y: subtracted.y > 0
        };
    }

    subtract(xOrVector: Vector | number, y?: number) {
        let addX: number;
        let addY: number;

        if (xOrVector instanceof Vector) {
            const loc = xOrVector as Vector;
            addX = loc.x;
            addY = loc.y;
        } else {
            const amount = xOrVector as number;
            addX = amount;
            addY = y ?? amount;
        }
        const newVector: this = this.clone();
        newVector.x = this.x - addX;
        newVector.y = this.y - addY;
        return newVector;
    }
    floored(lat = true, lon = true) {
        const newVector: this = this.clone();
        if (lat) {
            newVector.x = Math.floor(this.x);
        }
        if (lon) {
            newVector.y = Math.floor(this.y);
        }
        return newVector;
    }

    added(pixel: Vector | number, amountY?: number): this {
        let addX: number;
        let addY: number;

        if (pixel instanceof Vector) {
            const loc = pixel as Vector;
            addX = loc.x;
            addY = loc.y;
        } else {
            const amount = pixel as number;
            addX = amount;
            addY = amountY ?? amount;
        }
        const newVector: this = this.clone();
        newVector.x = this.x + addX;
        newVector.y = this.y + addY;
        return newVector;
    }
    equals(startPoint: Vector): boolean {
        if (typeof startPoint == 'undefined') {
            return false;
        }
        return startPoint.x === this.x && startPoint.y === this.y;
    }

    atMost(max: number) {
        const previousLength = this.length();
        return this.scaleTo(Math.min(max, previousLength));
    }

    atLeast(miniumLength: number) {
        const previousLength = this.length();
        return this.scaleTo(Math.max(miniumLength, previousLength));
    }
    limitAxis(max: number) {
        const newVector: this = this.clone();
        newVector.x = Math.min(this.x, max);
        newVector.y = Math.min(this.y, max);
        return newVector;
    }


    atLeastAxis(min: number | Vector): Vector {
        const newVector: this = this.clone();

        let minX: number;
        let minY: number;

        if (min instanceof Vector) {
            minY = min.y;
            minX = min.x;
        } else {
            minX = min;
            minY = min;
        }

        newVector.x = Math.max(this.x, minX);
        newVector.y = Math.max(this.y, minY);
        return newVector;
    }


    length(): number {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }

    intLength() {
        return Math.floor(this.length())
    }

    scaleTo(length: number) {
        return this.dividedBy(this.length()).multipliedBy(length);
    }
    toString() {
        return `{"lat":${this.x},"lon":${this.y}}`;
    }

    signVector() {
        let newX = 0
        let newY = 0
        if (this.y > 0) {
            newX = 1
        } else if (this.y < 0) {
            newX = -1
        }
        if (this.x > 0) {
            newY = 1
        } else if (this.x < 0) {
            newY = -1
        }
        return new Vector(newX * -1, newY)
    }



}
