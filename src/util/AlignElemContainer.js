"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var d3 = require("d3");
var AlignElemContainer = /** @class */ (function () {
    /**
     * Create container to manage HTML elements for snap-to alignment
     * @param parentNode: parent node to append lines to.
     */
    function AlignElemContainer(parentNode) {
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
    AlignElemContainer.prototype.remove = function (axis) {
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
            this[axis].forEach(function (el) { return el.remove(); });
            this[axis] = [];
        }
    };
    AlignElemContainer.prototype.create = function (axis, bounds) {
        var _this = this;
        if (axis === "x" || axis === "y") {
            d3.select(this[axis])
                .attr("y1", bounds.y)
                .attr("y2", bounds.Y)
                .attr("x1", bounds.x)
                .attr("x2", bounds.X);
            this.parent.append(this[axis]);
        }
        if (axis === "xDist" || axis === "yDist") {
            bounds.projection.forEach(function (bound) {
                var el = _this.templateLine.cloneNode();
                _this[axis].push(el);
                d3.select(el)
                    .attr("y1", bound.y)
                    .attr("y2", bound.Y)
                    .attr("x1", bound.x)
                    .attr("x2", bound.X);
                _this.parent.append(el);
            });
            bounds.dimension.forEach(function (bound) {
                var el = _this.templateLine.cloneNode();
                _this[axis].push(el);
                d3.select(el)
                    .attr("y1", bound.y)
                    .attr("y2", bound.Y)
                    .attr("x1", bound.x)
                    .attr("x2", bound.X)
                    .attr("marker-start", "url(#dimensionArrowStart)")
                    .attr("marker-end", "url(#dimensionArrowEnd)");
                _this.parent.append(el);
            });
        }
    };
    return AlignElemContainer;
}());
exports.default = AlignElemContainer;
