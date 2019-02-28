/**
 * Appends an arrow head marker to the defs element to be used later.
 * @param defElement 'defs' element to append marker elements
 * @param color string representation of a valid color.
 * @param backwards reverses arrowhead for backwards facing arrow
 */
export default function createColorArrow(defElement: any, color: string, backwards: boolean) {
    defElement.append("marker")
        .attr("id", `arrow-${color.replace(/^#/, "")}-${backwards ? "start" : "end"}`)
        .attr("viewBox", (backwards ? "6 -5 10 10" : "0 -5 10 10"))
        .attr("refX", 8)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("fill", color)
        .attr("orient", "auto")
        .append("path")
            .attr("d", (backwards ? "M16,-5L6,0L16,5" : "M0,-5L10,0L0,5"))
            .attr("class", "arrowHead");
}