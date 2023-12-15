import { BoundingBox } from './bounding-box';
import { Vector } from './vector';



class Check {
    matchingElement: Element | null = null

    private initial: number

    constructor(public value: number, private updateFnc: (val: number, box: BoundingBox) => number | null) {
        this.initial = value
    }

    update(el: Element) {
        const elementBox = new BoundingBox(el.getBoundingClientRect())

        const newV = this.updateFnc(this.value, elementBox)

        if (newV !== null && newV != this.initial) {
            this.matchingElement = el;
            this.value = newV
        }

    }

}

export function quantifyPosition(position: Vector) {


    let els: Array<Element> = []

    let closestTop = new Check(0, (val, elementBox) => {
        const newV = Math.max(val, elementBox.getBottom())
        if (newV < position.y) {
            return newV
        }
        return null
    })
    let closestBottom = new Check(innerHeight, (val, elementBox) => {
        const newV = Math.min(val, elementBox.getTop())
        if (newV > position.y) {
            return newV
        }
        return null
    });
    let closestLeft = new Check(0, (val, elementBox) => {
        const newV = Math.max(val, elementBox.getRight())
        if (newV < position.x) {
            return newV
        }
        return null
    });
    let closestRight = new Check(innerWidth, (val, elementBox) => {
        const newV = Math.min(val, elementBox.getLeft())
        if (newV > position.x) {
            return newV
        }
        return null
    });

    const matchers = [closestTop, closestBottom, closestLeft, closestRight]


    for (let distance = 100; distance < Math.max(innerHeight, innerWidth); distance += 80) {
        const initialOffest = new Vector(distance, 0)
        let offset = initialOffest

        const pos: Array<Vector> = []

        function checkPoint(pointOffset: Vector) {
            const absolutePos = position.added(pointOffset)

            const el = document.elementFromPoint(absolutePos.x, absolutePos.y)

            const displ = document.createElement("div")
            displ.style.position = "fixed"
            displ.style.top = absolutePos.yStyle()
            displ.style.left = absolutePos.xStyle()
            displ.style.width = "4px"
            displ.style.height = "4px"
            displ.style.backgroundColor = "red"

            document.body.appendChild(displ)
            els.push(displ)
            if (el) {
                matchers.forEach(m => m.update(el))

                if (matchers.every(m => m.matchingElement)) {
                    return "done"
                }
            } else {
                if (absolutePos.y > innerHeight) {
                    closestBottom.matchingElement = document.body
                } else if (absolutePos.y < 0) {
                    closestTop.matchingElement = document.body
                } else if (absolutePos.x < 0) {
                    closestLeft.matchingElement = document.body
                } else if (absolutePos.x > innerWidth) {
                    closestRight.matchingElement = document.body
                }
                if (matchers.every(m => m.matchingElement)) {
                    return "done"
                }
            }

            pos.push(pointOffset)
        }
        console.log("check for " + distance)
        let blockCt = 0
        const checkOffset = 40
        do {
            if (blockCt % checkOffset == 0) {
                const status = checkPoint(offset)
                if (status) {
                    els.forEach(el => el.remove())
                    els = []

                    return new BoundingBox(new Vector(closestLeft.value, closestTop.value), new Vector(closestRight.value, closestBottom.value))
                }
            }
            blockCt++
            const signVector = offset.signVector()
            const xAddCheck = offset.added(signVector.x, 0)
            if (signVector.x != 0 && xAddCheck.intLength() == distance)
                offset = xAddCheck
            else {
                const yAddCheck = offset.added(0, signVector.y)
                if (signVector.y != 0 && yAddCheck.intLength() == distance)
                    offset = yAddCheck
                else {
                    offset = offset.added(signVector)
                }
            }

        } while (!offset.equals(initialOffest))
    }

    debugger
}
