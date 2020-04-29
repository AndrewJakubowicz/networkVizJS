import type { Constraint, Node } from "../interfaces";

// helper functions in here to declutter main file


/**
 * Concat constraint to node property or create new array if doesnt exist
 * @param constraint
 * @param node
 */
export function addConstraintToNode(constraint: Constraint, node: Node) {
    if (node.constraint) {
        node.constraint.push(constraint);
    } else {
        node.constraint = [constraint];
    }
};

/**
 * Given background color, return if foreground colour should be black or white based on colour brightness
 * defaults to black
 * @param {string} color - background color in hexadecimal format
 */
export function computeTextColor(color: string) {
    // select text colour based on background brightness
    let c = "#000000";
    if (color) {
        if (color.length === 7 && color[0] === "#") {
            const r = parseInt(color.substring(1, 3), 16);
            const g = parseInt(color.substring(3, 5), 16);
            const b = parseInt(color.substring(5, 7), 16);
            const brightness = Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
            if (brightness <= 170) {
                c = "#FFFFFF";
            }
        }
    }
    return c;
}

/**
 * Return SVG node path based on shape descriptor string
 * @param d: Node
 */
export const nodePath = (d?: Node): string => {
    // Shapes defined: rect, circle, capsule
    switch (d?.nodeShape) {
        case "rect": {
            return "M16 48 L48 48 L48 16 L16 16 Z";
        }
        case "circle": {
            return "M20,40a20,20 0 1,0 40,0a20,20 0 1,0 -40,0";
        }
        case "capsule": {
            const width = d.width;
            const height = d.height;
            if (width && height) {
                const x = width / 2;
                const y = height / 2;
                const r = Math.round(Math.min(width, height) / 8);
                const v0 = { x, y };
                const v1 = { x, y: y + height };
                const v2 = { x: x + width, y: y + height };
                const v3 = { x: x + width, y };
                return [`M${v0.x} ${v0.y + r}`,
                    `V${v1.y - r}`,
                    `C${v1.x} ${v1.y} ${v1.x + r} ${v1.y} ${v1.x + r} ${v1.y}`,
                    `H${v2.x - r}`,
                    `C${v2.x} ${v2.y} ${v2.x} ${v2.y - r} ${v2.x} ${v2.y - r}`,
                    `V${v3.y + r}`,
                    `C${v3.x} ${v3.y} ${v3.x - r} ${v3.y} ${v3.x - r} ${v3.y}`,
                    `H${v0.x + r}`,
                    `C${v0.x} ${v0.y} ${v0.x} ${v0.y + r} ${v0.x} ${v0.y + r} Z`]
                    .join(" ");
            }
            return "M16 20 V44 C16 48 20 48 20 48 H44 C48 48 48 44 48 44 V20 C48 16 44 16 44 16 H20 C16 16 16 20 16 20 Z";
        }
        default : {
            // Return rect by default
            return "M16 48 L48 48 L48 16 L16 16 Z";
        }
    }
};

/**
 * Checks if bounds overlap
 * return true if overlap is found between target and bound
 * Ensure that: x < X and y < Y
 * @param target { x: number; X: number; y: number; Y: number }
 * @param bound { x: number; X: number; y: number; Y: number }
 */
export const boundsOverlap = (target: { x: number; X: number; y: number; Y: number }, bound: { x: number; X: number; y: number; Y: number }) => {
    return Math.max(target.x, bound.x) <= Math.min(target.X, bound.X) &&
        Math.max(target.y, bound.y) <= Math.min(target.Y, bound.Y);
};

export function isIE() {
    return ((navigator.appName == "Microsoft Internet Explorer") || ((navigator.appName == "Netscape") && (new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) != undefined)));
}
