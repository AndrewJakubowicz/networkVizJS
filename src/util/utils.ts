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
