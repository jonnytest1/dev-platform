import { DEG_2_RAD, Vector } from './vector.js';

interface BoundingBoxOptions {
    useScrollOffset?: boolean;
}


export class BoundingBox {

    public topLeft: Vector;
    public bottomRight: Vector;

    public static WINDOW() {
        return new BoundingBox(Vector.ZERO(), Vector.WINDOW());
    }


    constructor(topLeft: Vector | DOMRect | HTMLElement,
        bottomRight?: Vector | BoundingBoxOptions) {
        if (topLeft instanceof Vector) {
            this.topLeft = topLeft;
            if (!bottomRight || !(bottomRight instanceof Vector)) {
                throw new Error('bottomRight is undefined');
            }
            this.bottomRight = bottomRight;
        } else {
            const clientRect: DOMRect = this.getClientRect(topLeft, bottomRight);

            this.topLeft = new Vector(clientRect);
            this.bottomRight = this.topLeft.added(new Vector(clientRect.width, clientRect.height));
        }
    }

    private getClientRect(
        topLeft: HTMLElement | DOMRect,
        bottomRight: Vector | BoundingBoxOptions | undefined) {
        let clientRect: DOMRect;
        if (topLeft instanceof DOMRect) {
            clientRect = topLeft;
        } else {
            let element: HTMLElement;
            if (topLeft instanceof HTMLElement) {
                element = topLeft;
            } else {
                element = topLeft
            }
            clientRect = element.getBoundingClientRect();
            if (bottomRight && 'useScrollOffset' in bottomRight && bottomRight.useScrollOffset) {
                clientRect.width = element.scrollWidth;
                clientRect.height = element.scrollHeight;
            }
        }
        return clientRect;
    }

    static fromDiagonal(topLeft: Vector, diagonal: Vector) {
        return new BoundingBox(topLeft, topLeft.added(diagonal));
    }

    axisRotation(convertToDeg = true): number {
        const diagonalVector = this.diagonal();
        const axis = new Vector(1, 0);

        let radians = Math.acos((diagonalVector.x * axis.x + diagonalVector.y * axis.y)
            / (diagonalVector.length() * axis.length()));
        if (diagonalVector.y < 0) {
            radians *= -1;
        }
        if (convertToDeg) {
            return radians / DEG_2_RAD;
        }
        return radians;
    }

    translate(translationVector: Vector) {
        const diagonal = this.diagonal();

        return BoundingBox.fromDiagonal(this.topLeft.added(translationVector), diagonal);
    }

    equals(other: BoundingBox | undefined) {
        if (typeof other == 'undefined') {
            return false;
        }
        return this.topLeft.equals(other.topLeft) && this.bottomRight.equals(other.bottomRight);
    }

    diff(other: BoundingBox | undefined) {
        if (!other) {
            return Infinity;
        }
        return this.topLeft.subtract(other.topLeft).length() + this.bottomRight.subtract(other.bottomRight).length();
    }

    diagonal() {
        return this.bottomRight.subtract(this.topLeft);
    }

    centerPos() {
        return this.topLeft.added(this.diagonal().dividedBy(2))
    }

    getBottomLeft() {
        return new Vector(this.topLeft.x, this.bottomRight.y);
    }

    getHeight() {
        return this.diagonal().y;
    }

    getWidth() {
        return this.diagonal().x;
    }

    getBottom() {
        return this.bottomRight.y;
    }

    getTop() {
        return this.topLeft.y;
    }

    getRight() {
        return this.bottomRight.x;
    }

    getLeft() {
        return this.topLeft.x;
    }

    getTopRight() {
        return new Vector(this.bottomRight.x, this.topLeft.y);
    }

    includes(inner: Vector): boolean {
        return inner.x < this.bottomRight.x && inner.y < this.bottomRight.y
            && inner.x > this.topLeft.x && inner.y > this.topLeft.y;
    }

    withMargin(boxMargin: Vector | HTMLElement) {
        if (boxMargin instanceof HTMLElement) {
            const style = getComputedStyle(boxMargin);
            const topLeftMargin = new Vector(parseFloat(style.marginLeft), parseFloat(style.marginTop));
            const bottomRightMargin = new Vector(parseFloat(style.marginRight), parseFloat(style.marginBottom));
            return new BoundingBox(this.topLeft.subtract(topLeftMargin), this.bottomRight.added(bottomRightMargin));
        }
        return new BoundingBox(this.topLeft.subtract(boxMargin), this.bottomRight.added(boxMargin));
    }

    rounded() {
        return new BoundingBox(this.topLeft.rounded(), this.bottomRight.rounded());
    }

    overflows(other: BoundingBox) {
        const overflowBottomRight = this.bottomRight
            .subtract(other.bottomRight)
            .atLeastAxis(0);
        const overflowTopLeft = other.topLeft
            .subtract(this.topLeft)
            .atLeastAxis(0);

        return {
            overflowLeft: overflowTopLeft.x,
            overflowRight: overflowBottomRight.x,
            overflowTop: overflowTopLeft.y,
            overflowBottom: overflowBottomRight.y
        };
    }

    intersectionAreas(contentBox: BoundingBox) {
        return [
            // top
            new BoundingBox(this.topLeft, new Vector(this.getRight(), contentBox.getTop())),
            // bottom
            new BoundingBox(new Vector(this.getLeft(), contentBox.getBottom()), this.bottomRight),
            // left
            new BoundingBox(new Vector(this.getLeft(), contentBox.getTop()), contentBox.getBottomLeft()),
            // right
            new BoundingBox(contentBox.getTopRight(), new Vector(this.getRight(), contentBox.getBottom())),
        ];
    }
}
