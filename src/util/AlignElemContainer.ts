import * as d3 from "d3";

export default class AlignElemContainer {
    templateLine;
    x;
    y;
    xDist;
    yDist;
    parent;

    /**
     * Create container to manage HTML elements for snap-to alignment
     * @param parentNode: parent node to append lines to.
     */
    constructor(parentNode) {
        this.templateLine = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "line"))
            .attr("style", "stroke:rgb(150,150,150);stroke-width:1")
            .attr("shape-rendering", "crispEdges")
            .attr("stroke-dasharray", "4 3")
            .node();
        this.parent = parentNode;
        this.x = this.templateLine.cloneNode();
        this.y = this.templateLine.cloneNode();
        this.xDist = [];
        this.yDist = [];
    }

    remove(axis?: string) {
        if (axis === undefined) {
            this.remove("x");
            this.remove("y");
            this.remove("xDist");
            this.remove("yDist");
        }
        if (axis === "x" || axis === "y") {
            if (document.body.contains(this[axis])) {
                this.parent.removeChild(this[axis]);
            }
        }
        if (axis === "xDist" || axis === "yDist") {
            this[axis].forEach((el) => el.remove());
            this[axis] = [];
        }
    }

    create(axis: string, bounds) {
        if (axis === "x" || axis === "y") {
            d3.select(this[axis])
                .attr("y1", bounds.y)
                .attr("y2", bounds.Y)
                .attr("x1", bounds.x)
                .attr("x2", bounds.X);
            this.parent.append(this[axis]);
        }
        if (axis === "xDist" || axis === "yDist") {
            bounds.projection.forEach((bound) => {
                const el = this.templateLine.cloneNode();
                this[axis].push(el);
                d3.select(el)
                    .attr("y1", bound.y)
                    .attr("y2", bound.Y)
                    .attr("x1", bound.x)
                    .attr("x2", bound.X);
                this.parent.append(el);
            });
            bounds.dimension.forEach((bound) => {
                const el = this.templateLine.cloneNode();
                this[axis].push(el);
                d3.select(el)
                    .attr("y1", bound.y)
                    .attr("y2", bound.Y)
                    .attr("x1", bound.x)
                    .attr("x2", bound.X)
                    .attr("marker-start", "url(#dimensionArrowStart)")
                    .attr("marker-end", "url(#dimensionArrowEnd)");
                this.parent.append(el);
            });
        }
    }
}
