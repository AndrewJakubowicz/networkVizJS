import { select, transition, easePolyOut } from "d3";
import { LayoutOptions } from "../interfaces";

export default class AlignElemContainer {
    templateLine;
    templateMouseLine;
    x;
    bx;
    xCA; // is centre aligned
    y;
    by;
    yCA; // is centre aligned
    xDist;
    yDist;
    parent;
    layoutOptions: LayoutOptions;
    xTimer;
    yTimer;

    /**
     * Create container to manage HTML elements for snap-to alignment
     * @param parentNode - parent node to append lines to.
     * @param layoutOptions - layoutOptions
     */
    constructor(parentNode: unknown, layoutOptions: LayoutOptions) {
        this.templateLine = select(document.createElementNS("http://www.w3.org/2000/svg", "line"))
            .attr("stroke", "rgb(150,150,150)")
            .attr("stroke-width", 1)
            .attr("shape-rendering", "crispEdges")
            .attr("stroke-dasharray", "4 3")
            .node();
        this.templateMouseLine = select(document.createElementNS("http://www.w3.org/2000/svg", "line"))
            .attr("stroke", "rgba(0,0,0,0)")
            .attr("stroke-width", 21)
            .node();
        this.parent = parentNode;
        this.x = this.templateLine.cloneNode();
        this.bx = this.templateMouseLine.cloneNode();
        this.yCA = false;
        this.y = this.templateLine.cloneNode();
        this.by = this.templateMouseLine.cloneNode();
        this.xCA = false;
        this.xDist = [];
        this.yDist = [];
        this.layoutOptions = layoutOptions;
        this.xTimer = undefined;
        this.yTimer = undefined;
    }

    endAlign(): void {
        this.remove("xDist");
        this.remove("yDist");
        ["x", "y"].filter(axis => !this[axis + "CA"])
            .forEach(axis => this.remove(axis));
        const t = transition()
            .delay(this.layoutOptions.alignTimer ?? 0)
            .ease(easePolyOut);
        ["x", "y"].filter(axis => this[axis + "CA"])
            .forEach(axis => {
                select(this[axis])
                    .attr("stroke", "rgb(64,158,255)")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "10")
                    .transition(t)
                    .style("opacity", 0);
                this[axis + "Timer"] = setTimeout((axis) => this.remove(axis), (this.layoutOptions.alignTimer ?? 0) + 100);
            });

    }

    remove(axis?: string): void {
        if (axis === undefined) {
            this.remove("x");
            this.remove("y");
            this.remove("xDist");
            this.remove("yDist");
        }
        if (axis === "x" || axis === "y") {
            clearTimeout(this[axis + "Timer"]);
            this[axis + "Timer"] = undefined;
            if (document.body.contains(this[axis])) {
                this.parent.removeChild(this[axis]);
            }
            if (document.body.contains(this["b" + axis])) {
                this.parent.removeChild(this["b" + axis]);
            }
        }
        if (axis === "xDist" || axis === "yDist") {
            this[axis].forEach((el) => el.remove());
            this[axis] = [];
        }
    }

    create(axis: string, payload): void {
        const bounds = payload.bounds ?? payload;
        if (axis === "x" || axis === "y") {
            const baxis = "b" + axis;
            // create new line
            if (document.body.contains(this[axis])) {
                this.parent.removeChild(this[axis]);
            }
            if (document.body.contains(this[baxis])) {
                this.parent.removeChild(this[baxis]);
            }
            this[axis] = this.templateLine.cloneNode();
            if (payload.centreAlign) {
                this[axis + "CA"] = true;
                this[baxis] = this.templateMouseLine.cloneNode();
                select(this[axis])
                    .attr("y1", bounds.y)
                    .attr("y2", bounds.Y)
                    .attr("x1", bounds.x)
                    .attr("x2", bounds.X);
                this.parent.append(this[axis]);
                select(this[baxis])
                    .attr("y1", bounds.y)
                    .attr("y2", bounds.Y)
                    .attr("x1", bounds.x)
                    .attr("x2", bounds.X)
                    .on("click", () => {
                        this.remove(axis);
                        this.layoutOptions.clickConstraintGuide(payload.target, payload.alignedNodes, axis);
                    });
                this.parent.append(this[baxis]);
            } else {
                this[axis + "CA"] = false;
                select(this[axis])
                    .attr("y1", bounds.y)
                    .attr("y2", bounds.Y)
                    .attr("x1", bounds.x)
                    .attr("x2", bounds.X);
                this.parent.append(this[axis]);
            }
        }
        if (axis === "xDist" || axis === "yDist") {
            bounds.projection.forEach((bound) => {
                const el = this.templateLine.cloneNode();
                this[axis].push(el);
                select(el)
                    .attr("y1", bound.y)
                    .attr("y2", bound.Y)
                    .attr("x1", bound.x)
                    .attr("x2", bound.X);
                this.parent.append(el);
            });
            bounds.dimension.forEach((bound) => {
                const el = this.templateLine.cloneNode();
                this[axis].push(el);
                select(el)
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
