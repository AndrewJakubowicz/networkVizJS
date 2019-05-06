"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import AlignElemContainer from "./util/AlignElemContainer";

const d3 = require("d3");
const cola = require("webcola");
const levelgraph = require("levelgraph");
const level = require("level-browserify");
const updateColaLayout_1 = require("./updateColaLayout");
const createColorArrow_1 = require("./util/createColorArrow");
const interact = require("interactjs");


function networkVizJS(documentId, userLayoutOptions) {
    /**
     * Default options for webcola and graph
     */
    const defaultLayoutOptions = {
        databaseName: `Userdb-${Math.random() * 100}-${Math.random() * 100}-${Math.random() * 100}-${Math.random() * 100}`,
        layoutType: "flowLayout",
        jaccardModifier: 0.7,
        avoidOverlaps: true,
        handleDisconnected: false,
        flowDirection: "y",
        enableEdgeRouting: true,
        // groupCompactness: 5e-6,
        // convergenceThreshold: 0.1,
        nodeShape: "rect",
        nodePath: (d) => "M16 48 L48 48 L48 16 L16 16 Z",
        width: 900,
        height: 600,
        pad: 15,
        margin: 10,
        groupPad: 0,
        canDrag: () => true,
        nodeDragStart: undefined,
        nodeDragEnd: undefined,
        edgeLabelText: (edgeData) => edgeData.text,
        // Both mouseout and mouseover take data AND the selection (arg1, arg2)
        mouseDownNode: undefined,
        mouseOverNode: undefined,
        mouseOutNode: undefined,
        mouseUpNode: undefined,
        mouseOverGroup: undefined,
        mouseOutGroup: undefined,
        mouseOverEdge: undefined,
        mouseOutEdge: undefined,
        clickGroup: undefined,
        dblclickGroup: () => undefined,
        clickNode: () => undefined,
        dblclickNode: () => undefined,
        clickEdge: () => undefined,
        dblclickEdge: () => undefined,
        clickAway: () => undefined,
        // These are "live options"
        nodeToPin: () => false,
        nodeToColor: () => "#ffffff",
        nodeStrokeWidth: () => 1,
        nodeStrokeColor: () => "grey",
        edgeColor: "black",
        // edgeArrowhead: 0 - None, 1 - Right, -1 - Left, 2 - Bidirectional
        edgeArrowhead: 1,
        edgeStroke: 2,
        edgeStrokePad: 20,
        edgeDasharray: 0,
        edgeLength: () => 150,
        edgeSmoothness: 0,
        edgeRemove: undefined,
        groupFillColor: () => "#F6ECAF",
        snapToAlignment: true,
        snapThreshold: 10,
        zoomScale: undefined,
        isSelect: () => false,
        nodeSizeChange: undefined,
        selection: undefined,
        imgResize: undefined,
        palette: undefined,
    };

    const internalOptions = {
        isDragging: false,
        isImgResize: false,
    };
    /**
     * Create the layoutOptions object with the users options
     * overriding the default options.
     */
    const layoutOptions = Object.assign({}, defaultLayoutOptions, userLayoutOptions);
    /**
     * Check that the user has provided a valid documentId
     * and check that the id exists.
     */
    if (typeof documentId !== "string" || documentId === "") {
        throw new Error("Document Id passed into graph isn't a valid string.");
    }
    if (document.getElementById(documentId) === undefined) {
        throw new Error(`Can't find id '#${documentId}' on the page.`);
    }
    /**
     * In memory stores of the nodes and predicates.
     */
    const nodeMap = new Map();
    const predicateTypeToColorMap = new Map();
    const predicateMap = new Map();
    const groupMap = new Map();
    /**
     * Todo:    This is currently a hack. Create a random database on the client
     *          side to build the networks on top of.
     *          It's often better to just re-initialize a new db.
     */
    if (!layoutOptions.databaseName || typeof layoutOptions.databaseName !== "string") {
        console.error("Make sure databaseName property exists and is a string.");
        console.error("Choosing a default name for the database.");
        layoutOptions.databaseName = defaultLayoutOptions.databaseName;
    }
    const tripletsDB = levelgraph(level(layoutOptions.databaseName));
    /**
     * These represent the data that d3 will visualize.
     */
    const nodes = [];
    const constraints = [];
    let links = [];
    let groups = [];
    const groupByHashes = [];
    const width = layoutOptions.width, height = layoutOptions.height, margin = layoutOptions.margin,
        pad = layoutOptions.pad;
    /**
     * Create svg canvas that is responsive to the page.
     * This will try to fill the div that it's placed in.
     */
    const svg = d3.select(`#${documentId}`)
        .append("div")
        .classed("svg-container", true)
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("background-color", "white")
        .classed("svg-content-responsive", true);
    svg.on("click", layoutOptions.clickAway);
    /**
     * Set up [webcola](http://marvl.infotech.monash.edu/webcola/).
     * The helper function updateColaLayout allows for restarting
     * the simulation whenever the layout is changed.
     */
    let simulation = updateColaLayout_1.updateColaLayout(layoutOptions)
        .nodes(nodes)
        .links(links)
        .constraints(constraints)
        .groups(groups)
        .start();
    /**
     * Call nodeDragStart callback when drag event triggers.
     */
    const drag = simulation.drag();
    drag.filter(() => (layoutOptions.canDrag === undefined) || (layoutOptions.canDrag()));
    drag.on("start", (d, i, elements) => {
        layoutOptions.nodeDragStart && layoutOptions.nodeDragStart(d, elements[i]);
        internalOptions.isDragging = true;
        // TODO find permanent solution in vuegraph
        if (layoutOptions.isSelect && layoutOptions.isSelect()) {
            d.class += " highlight";
            updateStyles();
        }
    })
        .on("drag", dragged)
        .on("end", (d, i, elements) => {
            alignElements.remove();
            layoutOptions.nodeDragEnd && layoutOptions.nodeDragEnd(d, elements[i]);
            internalOptions.isDragging = false;
            if (layoutOptions.isSelect && layoutOptions.isSelect()) {
                d.class = d.class.replace(" highlight", "");
                updateStyles();
            }
        });

    /**
     * Create the defs element that stores the arrow heads.
     */
    const defs = svg.append("defs");
    defs.append("marker")
        .attr("id", "dimensionArrowEnd")
        .attr("viewBox", "0 0 50 40")
        .attr("refX", 50)
        .attr("refY", 20)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 0 0 L 0 40 L 50 20 Z")
        .attr("fill", "rgb(150,150,150)");
    defs.append("marker")
        .attr("id", "dimensionArrowStart")
        .attr("viewBox", "0 0 50 40")
        .attr("refX", 0)
        .attr("refY", 20)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 50 0 L 50 40 L 0 20 Z")
        .attr("fill", "rgb(150,150,150)");

    const arrowDefsDict = {};

    function addArrowDefs(defs: any, color: String, backwards: boolean) {
        const key = color + "-" + (backwards ? "start" : "end");
        if (!arrowDefsDict[key]) {
            arrowDefsDict[key] = true;
            createColorArrow_1.default(defs, "#" + color, backwards);
        }
        return "url(#arrow-" + color + (backwards ? "-start)" : "-end)");
    }

    // Define svg groups for storing the visuals.
    const g = svg.append("g")
        .classed("svg-graph", true);
    let group = g.append("g").attr("id", "group-container")
        .selectAll(".group");
    let link = g.append("g").attr("id", "link-container")
        .selectAll(".link");
    const alignmentLines = g.append("g");
    let node = g.append("g").attr("id", "node-container")
        .selectAll(".node");
    const alignElements = new AlignElemContainer(alignmentLines.node());
    /**
     * Zooming and panning behaviour.
     */
    const zoom = d3.zoom().scaleExtent([0.1, 5]).on("zoom", zoomed);
    zoom.filter(function () {
        // Prevent zoom when mouse over node.
        return d3.event.target.tagName.toLowerCase() === "svg" && !layoutOptions.isSelect();
    });
    svg.call(zoom).on("dblclick.zoom", undefined);

    function zoomed() {
        layoutOptions.clickAway();
        g.attr("transform", d3.event.transform);
        layoutOptions.zoomScale && layoutOptions.zoomScale(d3.event.transform.k);
    }


    /** Allow Image Resize Using Interact.js */
    interact(".img-node")
        .resizable({
            edges: { left: false, right: true, bottom: true, top: false },
            inertia: {
                resistance: 1,
                minSpeed: 1,
                endSpeed: 1
            }
        })
        .on("resizeend", function (event) {
            layoutOptions.imgResize && layoutOptions.imgResize(false);
            internalOptions.isImgResize = false;
        })
        .on("resizestart", function (event) {
            layoutOptions.imgResize && layoutOptions.imgResize(true);
            internalOptions.isImgResize = true;
        })
        .on("resizemove", function (event) {
            // layoutOptions.imgResize && layoutOptions.imgResize(true);
            internalOptions.isImgResize = true;
            const target = event.target,
                x = (parseFloat(target.getAttribute("data-x")) || 0),
                y = (parseFloat(target.getAttribute("data-x")) || 0);

            target.style.width = event.rect.width + "px";
            target.style.height = event.rect.width + "px";
            target.style.webkitTransform = target.style.transform =
                "translate(" + x + "px," + y + "px)";
            target.setAttribute("data-x", x);

            restart();
        });

    interact.maxInteractions(Infinity);

    /**
     * Return nodes and edges within a boundary
     * @param {Object} boundary - Bounds to search within
     * @param {Number} boundary.x
     * @param {Number} boundary.X
     * @param {Number} boundary.y
     * @param {Number} boundary.Y
     * @returns {{nodes: any[]; edges: any[]}} - object containing node array and edge array
     */
    function selectByCoords(boundary: { x: number, X: number, y: number, Y: number }) {
        const nodeSelect = [];
        const groupSelect = [];
        const x = Math.min(boundary.x, boundary.X);
        const X = Math.max(boundary.x, boundary.X);
        const y = Math.min(boundary.y, boundary.Y);
        const Y = Math.max(boundary.y, boundary.Y);
        const boundsChecker = (d, arr) => {
            if (Math.max(d.bounds.x, x) <= Math.min(d.bounds.X, X) &&
                Math.max(d.bounds.y, y) <= Math.min(d.bounds.Y, Y)) {
                arr.push(d);
            }
        };
        nodes.forEach((d) => boundsChecker(d, nodeSelect));
        groups.forEach((d) => boundsChecker(d, groupSelect));
        const edges = d3.selectAll(".line")
            .select(".line-front")
            .filter(function () {
                const len = this.getTotalLength();
                const p = len / 3;
                const p1 = this.getPointAtLength(p);
                const p2 = this.getPointAtLength(p * 2);
                const p1In = p1.x >= x && p1.x <= X && p1.y >= y && p1.y <= Y;
                const p2In = p2.x >= x && p2.x <= X && p2.y >= y && p2.y <= Y;
                return p1In && p2In;
            });
        return { nodes: nodeSelect, edges: edges.data(), groups: groupSelect };
    }

    /**
     * Resets width or radius of nodes.
     * Allows dynamically changing node sizes based on text.
     */
    function updatePathDimensions() {
        layoutOptions.nodeSizeChange && layoutOptions.nodeSizeChange();
        node.select("path")
            .attr("d", function (d) {
                return layoutOptions.nodePath(d);
            })
            .attr("transform", function (d) {
                // Scale appropriately using http://stackoverflow.com/a/9877871/6421793
                const currentWidth = this.getBBox().width, w = d.width, currentHeight = this.getBBox().height,
                    h = d.height, scaleW = (w - layoutOptions.margin) / currentWidth,
                    scaleH = (h - layoutOptions.margin) / currentHeight;
                if (isNaN(scaleW) || isNaN(scaleH) || isNaN(w) || isNaN(h)) {
                    return "";
                }
                return `translate(${-w / 2 + layoutOptions.margin},${-h / 2 + layoutOptions.margin}) scale(${scaleW},${scaleH})`;
            });
    }

    /**
     * This function re-centers the text.
     * This allows you to not change the text without restarting
     * jittering the text.
     * Must be run after updateStyles() to reposition on updated text.
     */
    function repositionText() {
        return Promise.resolve()
            .then(() => {
                node.selectAll("text")
                    .each(function (d) {
                        const img = d3.select(this.parentNode.parentNode.parentNode).select("image").node();
                        const imgWidth = img ? img.getBBox().width : 0;
                        const margin = layoutOptions.margin, pad = layoutOptions.pad;
                        const extra = 2 * pad + margin;

                        if (d.fixedWidth && imgWidth + extra < d.fixedWidth) {
                            d.width = d.fixedWidth;
                            return;
                        }
                        // The width must reset to allow the box to get smaller.
                        // Later we will set width based on the width of the line.
                        d.width = d.minWidth || 0;
                        if (!(d.width)) {
                            d.width = d.minWidth || 0;
                        }

                        const lineLength = this.offsetWidth;
                        const w = imgWidth > lineLength ? imgWidth : lineLength;
                        if (d.width < lineLength + extra) {
                            d.width = w + extra;
                        }

                    })
                    .each(function (d) {
                        // Only update the height, the width is calculated previously
                        const img = d3.select(this.parentNode.parentNode.parentNode).select("image").node();
                        const imgHeight = img ? img.getBBox().height : 0;
                        const height = this.offsetHeight;
                        const extra = 2 * layoutOptions.pad + layoutOptions.margin;
                        d.height = height === 0 ? 28 + extra + imgHeight : height + extra + imgHeight;
                    });

                node.select(".img-node")
                    .attr("x", function (d) {
                        const imgWidth = d.img ? this.getBBox().width : 0;
                        return d.width / 2 - imgWidth / 2;
                    })
                    .attr("y", function (d) {
                        return d.img ? 18 : 0;
                    });

                node.select(".node-HTML-content")
                    .attr("width", function (d) {
                        if (d.fixedWidth) {
                            return d.fixedWidth;
                        }
                        return d3.select(this).select("text").node().offsetWidth;
                    })
                    .attr("y", function (d) {
                        const img = d3.select(this.parentNode).select("image").node();
                        const imgHeight = img ? img.getBBox().height : 0;
                        const textHeight = d3.select(this).select("text").node().offsetHeight;
                        if (!d.img || !img) {
                            return d.height / 2 - textHeight / 2 - 2;
                        } else {
                            return d.height / 2 - textHeight / 2 + imgHeight / 2 + 5;
                        }
                    })
                    .attr("x", function (d) {
                        const textWidth = d3.select(this).select("text").node().offsetWidth;
                        const x = d.width / 2 - textWidth / 2;
                        d.textPosition = x; // TODO-ya is this redundant now?
                        return x;
                    });

                link.select(".edge-foreign-object")
                    .attr("width", function (d) {
                        return d3.select(this).select("text").node().offsetWidth;
                    });
                d3.selectAll("#graph .node").each(function (d) {
                    const node = d3.select(this);
                    const foOnNode = node.selectAll(".node-status-icons");
                    const pinned = layoutOptions.nodeToPin && layoutOptions.nodeToPin(d);
                    if (pinned) {
                        foOnNode
                            .attr("x", d => d.width / 2 || 0)
                            .attr("y", 0)
                            .style("opacity", 1);
                    } else {
                        foOnNode
                            .style("opacity", 0);
                    }
                });
            });
    }

    /**
     * center group text in group and adjust padding values to create text area.
     */
    function repositionGroupText() {
        group.select("text")
            .style("width", function (d) {
                return `${d.bounds.width()}px`;
            });
        group.select("foreignObject")
            .attr("x", function (d) {
                // center FO in middle of group
                const textWidth = d3.select(this).select("text").node().offsetWidth;
                if (d.bounds) {
                    return (d.bounds.width() - textWidth) / 2;
                }
                return 0;
            })
            .each(function (d) {
                const textNode = d3.select(this).select("text").node();
                const textHeight = textNode.innerText === "" ? 0 : textNode.offsetHeight;
                const pad = textHeight + 5;
                // TODO if padding is unsymmetrical by more than double the node size, things break. (defualt size 136)
                const opPad = Math.max(pad - 136, 0);
                switch (typeof d.padding) {
                    case "number": {
                        const padI = d.padding;
                        d.padding = { x: padI, X: padI, y: pad, Y: opPad };
                        break;
                    }
                    case "object": {
                        d.padding.y = pad;
                        d.padding.Y = opPad;
                        break;
                    }
                    default: {
                        const p = layoutOptions.groupPad ? layoutOptions.groupPad : 0;
                        d.padding = { x: p, X: p, y: pad, Y: opPad };
                    }
                }
            });
    }

    /**
     * Update the d3 visuals without layout changes.
     */
    function updateStyles() {
        return new Promise((resolve, reject) => {

            /** GROUPS */
            group = group.data(groups);
            group.exit().remove();
            const groupEnter = group.enter()
                .append("g")
                .call(simulation.drag);
            groupEnter.append("rect")
                .attr("rx", 8)
                .attr("ry", 8)
                .attr("class", d => `group ${d.data.class}`)
                .attr("stroke", "black")
                .on("mouseover", function (d) {
                    layoutOptions.mouseOverGroup && layoutOptions.mouseOverGroup(d, d3.select(this), d3.event);
                })
                .on("mouseout", function (d) {
                    layoutOptions.mouseOutGroup && layoutOptions.mouseOutGroup(d, d3.select(this), d3.event);
                })
                .on("click", function (d) {
                    layoutOptions.clickGroup && layoutOptions.clickGroup(d, d3.select(this), d3.event);
                })
                .on("dblclick", function (d) {
                    layoutOptions.dblclickGroup && layoutOptions.dblclickGroup(d, d3.select(this), d3.event);
                });
            // add text to group
            groupEnter
                .append("foreignObject")
                .attr("y", 5)
                .attr("pointer-events", "none")
                .attr("width", 1)
                .attr("height", 1)
                .style("overflow", "visible")
                .append("xhtml:div")
                .attr("xmlns", "http://www.w3.org/1999/xhtml")
                .append("text")
                .attr("pointer-events", "none")
                .classed("editable", true)
                .attr("contenteditable", "true")
                .attr("tabindex", "-1")
                .style("display", "inline-block")
                .style("text-align", "center")
                .style("font-weight", "100")
                .style("font-size", "22px")
                .style("font-family", "\"Source Sans Pro\", sans-serif")
                .style("white-space", "pre-wrap")
                .style("word-break", "break-word")
                .html((d) => d.data.text || "");
            group = group.merge(groupEnter);

            group.select(".group")
                .attr("fill", layoutOptions.groupFillColor)
                .attr("class", d => `group ${d.data.class}`);

            // allow for text updating
            group.select("text")
                .style("color", d => computeTextColor(d.data.color))
                .html(d => d.data.text || "");


            /////// NODE ///////
            node = node.data(nodes, d => d.index);
            node.exit().remove();
            const nodeEnter = node.enter()
                .append("g")
                .classed("node", true);
            nodeEnter
                .attr("cursor", "move")
                .call(drag); // Drag controlled by filter.


            /**
             * Append Text to Node
             * Here we add node beauty.
             * To fit nodes to the short-name calculate BBox
             * from https://bl.ocks.org/mbostock/1160929
             */
            const foBox = nodeEnter.append("foreignObject")
                .attr("pointer-events", "none")
                .classed("node-HTML-content", true)
                .attr("width", 1)
                .attr("height", 1)
                .style("overflow", "visible")
                .append("xhtml:div")
                .classed("fo-div", true)
                .attr("xmlns", "http://www.w3.org/1999/xhtml");

            foBox.append("text")
                .attr("tabindex", "-1")
                .attr("pointer-events", "none")
                .style("cursor", "text")
                .style("text-align", "center")
                .style("font-weight", "100")
                .style("font-size", "22px")
                .style("font-family", "\"Source Sans Pro\", sans-serif")
                .classed("editable", true)
                .style("display", "inline-block");

            /** Choose the node shape and style. */
            let nodeShape;
            nodeShape = nodeEnter.insert("path", "foreignObject");
            nodeShape.attr("d", layoutOptions.nodePath);
            nodeShape
                .attr("vector-effect", "non-scaling-stroke")
                .classed("node-path", true);

            /** Append Image to Node */
            nodeEnter
                .insert("image", "foreignObject")
                .on("mouseover", function (d) {
                    nodeEnter.attr("cursor", "resize");
                    if (internalOptions.isDragging) {
                        return;
                    }
                    layoutOptions.mouseOverNode && layoutOptions.mouseOverNode(d, d3.select(this.parentNode).select("path"), d3.event);
                })
                .on("mouseout", function (d) {
                    nodeEnter.attr("cursor", "move");
                });

            /** Merge the entered nodes to the update nodes. */
            node = node.merge(nodeEnter)
                .classed("fixed", d => d.fixed || false);

            /** Update Node Image Src */
            const imgSelect = node.select("image")
                .attr("class", "img-node")
                .attr("width", d => d.img ? d.img.width : 0)
                .attr("height", d => d.img ? d.img.width : 0)
                .attr("xlink:href", function (d) {
                    if (d.img) {
                        return "data:image/png;base64," + d.img.src;
                    }
                });

            /** Update the text property (allowing dynamically changing text) */
            const textSelect = node.select("text")
                .html(function (d) {
                    return d.shortname || d.hash;
                })
                .style("color", d => computeTextColor(d.color))
                .style("max-width", d => d.fixedWidth ? d.width - layoutOptions.pad * 2 + layoutOptions.margin + "px" : "none")
                .style("word-break", d => d.fixedWidth ? "break-word" : "normal")
                .style("white-space", d => d.fixedWidth ? "pre-wrap" : "pre");


            /**
             * Here we can update node properties that have already been attached.
             * When restart() is called, these are the properties that will be affected
             * by mutation.
             */
            const updateShapes = node.select("path")
                .attr("class", d => d.class);
            // These changes apply to both rect and circle
            updateShapes
                .attr("fill", layoutOptions.nodeToColor)
                .attr("stroke", layoutOptions.nodeStrokeColor)
                .attr("stroke-width", layoutOptions.nodeStrokeWidth);
            // update size
            updatePathDimensions();
            // These CANNOT be arrow functions or 'this' context becomes wrong.
            updateShapes
                .on("mouseover", function (d) {
                    if (internalOptions.isDragging) {
                        return;
                    }
                    layoutOptions.mouseOverNode && layoutOptions.mouseOverNode(d, d3.select(this), d3.event);
                })
                .on("mouseout", function (d) {
                    if (internalOptions.isDragging) {
                        return;
                    }
                    layoutOptions.mouseOutNode && layoutOptions.mouseOutNode(d, d3.select(this));
                })
                .on("dblclick", function (d) {
                    layoutOptions.dblclickNode && layoutOptions.dblclickNode(d, d3.select(this), d3.event);
                })
                .on("click", function (d) {
                    layoutOptions.clickNode && layoutOptions.clickNode(d, d3.select(this), d3.event);
                })
                .on("mouseup", function (d) {
                    layoutOptions.mouseUpNode && layoutOptions.mouseUpNode(d, d3.select(this));
                })
                .on("mousedown", function (d) {
                    if ((layoutOptions.canDrag === undefined) || (layoutOptions.canDrag())) {
                        return;
                    }
                    layoutOptions.mouseDownNode && layoutOptions.mouseDownNode(d, d3.select(this));
                });


            /** LINK */
            link = link.data(links, d => d.source.index + "-" + d.target.index);
            link.exit().remove();
            const linkEnter = link.enter()
                .append("g")
                .classed("line", true);
            linkEnter.append("path") // transparent clickable area behind line
                .attr("stroke-width", layoutOptions.edgeStrokePad)
                .attr("stroke", "rgba(0, 0, 0, 0)")
                .attr("fill", "none");
            linkEnter.append("path")
                .attr("class", "line-front")
                .attr("stroke-width", layoutOptions.edgeStroke)
                .attr("stroke", layoutOptions.edgeColor)
                .attr("fill", "none");
            linkEnter
                .on("mouseenter", function (d) {
                    layoutOptions.mouseOverEdge && layoutOptions.mouseOverEdge(d, d3.select(this), d3.event);
                })
                .on("mouseleave", function (d) {
                    layoutOptions.mouseOutEdge && layoutOptions.mouseOutEdge();
                })
                .on("dblclick", function (d) {
                    const elem = d3.select(this);
                    const e = d3.event;
                    // IMPORTANT, without this vuegraph will crash in SWARM. bug caused by blur event handled by medium editor.
                    e.stopPropagation();
                    setTimeout(() => {
                        layoutOptions.dblclickEdge(d, elem, e);
                    }, 50);
                })
                .on("click", function (d) {
                    layoutOptions.clickEdge(d, d3.select(this), d3.event);
                });
            // Add an empty text field.
            linkEnter
                .append("foreignObject")
                .attr("pointer-events", "none")
                .classed("edge-foreign-object", true)
                .attr("width", 1)
                .attr("height", 1)
                .style("overflow", "visible")
                .append("xhtml:div")
                .attr("xmlns", "http://www.w3.org/1999/xhtml")
                .append("text")
                .attr("pointer-events", "none")
                .classed("editable", true)
                .attr("contenteditable", "true")
                .attr("tabindex", "-1")
                .style("display", "inline-block")
                .style("text-align", "center")
                .style("font-weight", "100")
                .style("font-size", "22px")
                .style("font-family", "\"Source Sans Pro\", sans-serif")
                .style("white-space", "pre")
                .style("background-color", "rgba(255,255,255,0.85")
                .html(d => layoutOptions.edgeLabelText(d.predicate));
            link = link.merge(linkEnter);
            /** Optional label text */
            if (typeof layoutOptions.edgeLabelText === "function") {
                link.select("text").html((d) => {
                    if (typeof d.predicate.hash === "string") {
                        return layoutOptions.edgeLabelText(predicateMap.get(d.predicate.hash));
                    }
                    return layoutOptions.edgeLabelText(d.predicate);
                });
            }
            link.select(".line-front")
                .attr("marker-start", d => {
                    const color = typeof layoutOptions.edgeColor == "string" ? layoutOptions.edgeColor : layoutOptions.edgeColor(d.predicate);
                    if (typeof layoutOptions.edgeArrowhead != "number") {
                        if (layoutOptions.edgeArrowhead(d.predicate) == -1 || layoutOptions.edgeArrowhead(d.predicate) == 2) {
                            if (d.predicate.class.includes("highlight")) {
                                return addArrowDefs(defs, "409EFF", true);
                            }
                            return addArrowDefs(defs, color, true);
                        }
                        return "none";
                    }
                    return addArrowDefs(defs, color, true);
                })
                .attr("marker-end", d => {
                    const color = typeof layoutOptions.edgeColor == "string" ? layoutOptions.edgeColor : layoutOptions.edgeColor(d.predicate);
                    if (typeof layoutOptions.edgeArrowhead != "number") {
                        if (layoutOptions.edgeArrowhead(d.predicate) == 1 || layoutOptions.edgeArrowhead(d.predicate) == 2) {
                            if (d.predicate.class.includes("highlight")) {
                                return addArrowDefs(defs, "409EFF", false);
                            }
                            return addArrowDefs(defs, color, false);
                        }
                        return "none";
                    }
                    return addArrowDefs(defs, color, false);
                })
                .attr("class", d => "line-front " + d.predicate.class.replace("highlight", "highlight-edge"))
                .attr("stroke-width", d => typeof layoutOptions.edgeStroke == "string" ? layoutOptions.edgeStroke : layoutOptions.edgeStroke(d.predicate))
                .attr("stroke-dasharray", d => typeof layoutOptions.edgeDasharray == "string" ? layoutOptions.edgeDasharray : layoutOptions.edgeDasharray(d.predicate))
                .attr("stroke", d => d.predicate.stroke ? d.predicate.stroke : "black");
            return resolve();
        });
    }

    /**
     * restart function adds and removes nodes.
     * It also restarts the simulation.
     * This is where aesthetics can be changed.
     */

    function restart(callback?, preventLayout?) {
        return Promise.resolve()
            .then(() => {
                if (!preventLayout) {
                    return updateStyles();
                }
                if (callback === "NOUPDATE") {
                    console.error("WARNING OLD CODE");
                    return;
                }
            })
            .then(repositionText)
            .then(() => {
                /**
                 * Helper function for drawing the lines.
                 * Adds quadratic curve to smooth corners in line
                 */
                const lineFunction = (points) => {
                    if (points.length <= 2 || !layoutOptions.edgeSmoothness || layoutOptions.edgeSmoothness === 0) {
                        // fall back on old method if no need to curve edges
                        return d3.line().x(d => d.x).y(d => d.y)(points);
                    }
                    let path = "M" + points[0].x + "," + points[0].y; // move to start point
                    let dy, dx;
                    for (let n = 1; n < points.length - 1; n++) {
                        const p0 = points[n - 1];
                        const p1 = points[n];
                        const p2 = points[n + 1];
                        const v01 = { x: p1.x - p0.x, y: p1.y - p0.y }; // vector from point 0 to 1
                        const v01abs = Math.sqrt(Math.pow(v01.x, 2) + Math.pow(v01.y, 2)); // |v01|
                        const uv01 = { x: v01.x / v01abs, y: v01.y / v01abs }; // unit vector v01
                        if ((layoutOptions.edgeSmoothness * 2 > v01abs)) {
                            dx = v01.x / 2;
                            dy = v01.y / 2;
                        } else {
                            dx = layoutOptions.edgeSmoothness * uv01.x;
                            dy = layoutOptions.edgeSmoothness * uv01.y;
                        }
                        path += " L" + (p1.x - dx) + "," + (p1.y - dy); // straight line to layoutOptions.edgeSmoothness px before vertex
                        const v12 = { x: p2.x - p1.x, y: p2.y - p1.y }; // vector from point 1 to 2
                        const v12abs = Math.sqrt(Math.pow(v12.x, 2) + Math.pow(v12.y, 2)); // |v12|
                        const uv12 = { x: v12.x / v12abs, y: v12.y / v12abs }; // unit vector v12
                        if ((layoutOptions.edgeSmoothness * 2 > v12abs)) {
                            dx = v12.x / 2;
                            dy = v12.y / 2;
                        } else {
                            dx = layoutOptions.edgeSmoothness * uv12.x;
                            dy = layoutOptions.edgeSmoothness * uv12.y;
                        }
                        path += " Q" + p1.x + "," + p1.y + " " + (p1.x + dx) + "," + (p1.y + dy); // quadratic curve with vertex as control point
                    }
                    path += " L" + points[points.length - 1].x + "," + points[points.length - 1].y; // straight line to end
                    return path;
                };
                /**
                 * Causes the links to bend around the rectangles.
                 * Source: https://github.com/tgdwyer/WebCola/blob/master/WebCola/examples/unix.html#L140
                 */
                const routeEdges = function () {
                    if (links.length == 0 || !layoutOptions.enableEdgeRouting) {
                        return;
                    }
                    try {
                        simulation.prepareEdgeRouting();
                    } catch (err) {
                        console.error(err);
                        return;
                    }
                    try {
                        link.selectAll("path")
                            .attr("d", d => lineFunction(simulation.routeEdge(d, undefined, undefined)));
                    } catch (err) {
                        console.error(err);
                        return;
                    }
                    try {
                        if (isIE())
                            link.selectAll("path").each(function (d) {
                                this.parentNode.insertBefore(this, this);
                            });
                    } catch (err) {
                        console.log(err);
                        return;
                    }
                    link.select(".edge-foreign-object")
                        .attr("x", function (d) {
                            const thisSel = d3.select(this);
                            const textWidth = thisSel.select("text").node().offsetWidth;
                            const arrayX = simulation.routeEdge(d, undefined, undefined);
                            const middleIndex = Math.floor(arrayX.length / 2) - 1;
                            const midpoint = (arrayX[middleIndex].x + arrayX[middleIndex + 1].x - textWidth) / 2;
                            // TODO temporary hack to reduce occurrence of edge text jitter
                            const oldX = thisSel.attr("x");
                            return Math.abs(midpoint - oldX) > 2.5 ? midpoint : oldX;
                        })
                        .attr("y", function (d) {
                            const thisSel = d3.select(this);
                            const textHeight = thisSel.select("text").node().offsetHeight;
                            const arrayY = simulation.routeEdge(d, undefined, undefined);
                            const middleIndex = Math.floor(arrayY.length / 2) - 1;
                            const midpoint = (arrayY[middleIndex].y + arrayY[middleIndex + 1].y - textHeight) / 2;
                            const oldY = thisSel.attr("y");
                            return Math.abs(midpoint - oldY) > 2.5 ? midpoint : oldY;
                        });
                };
                // Restart the simulation.
                simulation.links(links) // Required because we create new link lists
                    .groups(groups)
                    .start(10, 15, 20).on("tick", function () {
                    node.each((d) => {
                        if (d.bounds) {
                            // Initiate the innerBounds, and create it based on the width and height
                            // of the node.
                            d.innerBounds = d.bounds.inflate(0);
                            d.innerBounds.X = d.innerBounds.x + d.width;
                            d.innerBounds.Y = d.innerBounds.y + d.height;
                        }
                    });
                    node.attr("transform", d => d.innerBounds ?
                        `translate(${d.innerBounds.x},${d.innerBounds.y})`
                        : `translate(${d.x},${d.y})`);
                    updatePathDimensions();
                    link.selectAll("path").attr("d", d => {
                        let route;
                        try {
                            route = cola.makeEdgeBetween(d.source.innerBounds, d.target.innerBounds, 5);
                        } catch (err) {
                            console.error(err);
                            return;
                        }
                        return lineFunction([route.sourceIntersection, route.arrowStart]);
                    });
                    if (isIE())
                        link.each(function (d) {
                            this.parentNode.insertBefore(this, this);
                        });
                    link.select(".edge-foreign-object")
                        .attr("x", function (d) {
                            const textWidth = d3.select(this).select("text").node().offsetWidth;
                            let route;
                            try {
                                route = cola.makeEdgeBetween(d.source.innerBounds, d.target.innerBounds, 5);
                            } catch (err) {
                                console.error(err);
                                return 0;
                            }
                            return (route.sourceIntersection.x + route.targetIntersection.x - textWidth) / 2;
                        })
                        .attr("y", function (d) {
                            const textHeight = d3.select(this).select("text").node().offsetHeight;
                            let route;
                            try {
                                route = cola.makeEdgeBetween(d.source.innerBounds, d.target.innerBounds, 5);
                            } catch (err) {
                                console.error(err);
                                return 0;
                            }
                            return (route.sourceIntersection.y + route.targetIntersection.y - textHeight) / 2;
                        });

                    group.attr("transform", d => `translate(${d.bounds.x},${d.bounds.y})`);
                    repositionGroupText();
                    group.select("rect")
                        .attr("width", function (d) {
                            return d.bounds.width();
                        })
                        .attr("height", function (d) {
                            return d.bounds.height();
                        });
                }).on("end", routeEdges);

                function isIE() {
                    return ((navigator.appName == "Microsoft Internet Explorer") || ((navigator.appName == "Netscape") && (new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) != undefined)));
                }

                // After a tick make sure to add translation to the nodes.
                // Sometimes it wasn"t added in a single tick.
                node.attr("transform", d => d.innerBounds ?
                    `translate(${d.innerBounds.x},${d.innerBounds.y})`
                    : `translate(${d.x},${d.y})`);
                repositionGroupText();
            })
            .then(() => typeof callback === "function" && callback());
    }

    /**
     * Handle layout of disconnected graph components.
     */
    function handleDisconnects() {
        simulation.handleDisconnected(true);
        restart().then(() => {
            simulation.handleDisconnected(false);
        });
    }

    /**
     * Helper function for updating links after node mutations.
     */
    function createNewLinks() {
        return new Promise((resolve, reject) => tripletsDB.get({}, (err, l) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(l);
                }
            })
        ).then((l) => {
            // Create edges based on LevelGraph triplets
            links = (<any[]>l).map(({ subject, object, predicate }) => {
                const source = nodeMap.get(subject);
                const target = nodeMap.get(object);
                predicateMap.set(predicate.hash, predicate); // update predicateMap to match new link object
                return { source, target, predicate };
            });
        }).catch((err) => {
            console.error(err);
        }).then(restart);

    }

    /**
     * Take a node object or list of nodes and add them.
     * @param {object | object[]} nodeObjectOrArray
     * @param preventLayout
     */
    function addNode(nodeObjectOrArray, preventLayout?: boolean) {
        /** Define helper functions at the top */
        /**
         * Checks if object is an array:
         * http://stackoverflow.com/a/34116242/6421793
         * @param {object|array} obj
         */
        function isArray(obj) {
            return !!obj && obj.constructor === Array;
        }

        function addNodeObjectHelper(nodeObject) {
            // Check that hash exists
            if (!(nodeObject.hash)) {
                throw new Error("Node requires a hash field.");
            }
            // //TODO hack improved. doesnt work with window resizing. check resizing on SWARM end before implementing fix
            // if (!(nodeObject.x && nodeObject.y)) {
            //     let point = transformCoordinates({
            //         x: layoutOptions.width / 2,
            //         y: layoutOptions.height / 2
            //     });
            //     if (!nodeObject.x) {
            //         nodeObject.x = point.x;
            //     }
            //     if (!nodeObject.y) {
            //         nodeObject.y = point.y;
            //     }
            // }
            // TODO: remove this hack
            if (!(nodeObject.x)) {
                nodeObject.x = layoutOptions.width / 2;
            }
            if (!(nodeObject.y)) {
                nodeObject.y = layoutOptions.height / 2;
            }
            // Add node to graph
            if (!nodeMap.has(nodeObject.hash)) {
                simulation.stop();
                // Set the node
                nodes.push(nodeObject);
                nodeMap.set(nodeObject.hash, nodeObject);
            }
        }

        /**
         * Check that the input is valid
         */
        if (typeof nodeObjectOrArray !== "object") {
            throw new Error("Parameter must be either an object or an array");
        }
        if (isArray(nodeObjectOrArray)) {
            // Run through the array adding the nodes
            nodeObjectOrArray.forEach(addNodeObjectHelper);
        } else {
            addNodeObjectHelper(nodeObjectOrArray);
        }
        // Draw the changes, and either fire callback or pass it on to restart.
        if (!preventLayout) {
            return restart();
        } else {
            return Promise.resolve();
        }
    }

    /**
     * Validates triplets.
     * @param {object} tripletObject
     */
    function tripletValidation(tripletObject) {
        /**
         * Check that minimum requirements are met.
         */
        if (tripletObject === undefined) {
            throw new Error("TripletObject undefined");
        }
        // Node needs a unique hash associated with it.
        const subject = tripletObject.subject, predicate = tripletObject.predicate, object = tripletObject.object;
        if (!(subject && predicate && object && true)) {
            throw new Error("Triplets added need to include all three fields.");
        }
        // Check that hash exists
        if (!(subject.hash && object.hash)) {
            throw new Error("Subject and Object require a hash field.");
        }
        // Check that type field exists on predicate
        if (!predicate.type) {
            throw new Error("Predicate requires type field.");
        }
        // Check that type field is a string on predicate
        if (typeof predicate.type !== "string") {
            throw new Error("Predicate type field must be a string");
        }
        return true;
    }

    /**
     * Adds a triplet object. Adds the node if it's not already added.
     * Otherwise it just adds the edge
     * @param {object} tripletObject
     * @param preventLayout
     */
    function addTriplet(tripletObject, preventLayout?) {
        if (!tripletValidation(tripletObject)) {
            return Promise.reject("Invalid triplet");
        }
        // Node needs a unique hash associated with it.
        const subject = tripletObject.subject, predicate = tripletObject.predicate, object = tripletObject.object;
        // Check that predicate doesn't already exist
        return new Promise((resolve, reject) => tripletsDB.get({
            subject: subject.hash,
            predicate: predicate,
            object: object.hash
        }, function (err, list) {
            if (err)
                reject(err);
            resolve(list.length === 0);
        }))
            .then(doesntExist => {
                if (!doesntExist) {
                    return Promise.reject("Edge already exists");
                }
                /**
                 * If a predicate type already has a color,
                 * it is not redefined.
                 */
                    // arrowhead change
                const edgeColor = typeof layoutOptions.edgeColor == "string" ? layoutOptions.edgeColor : layoutOptions.edgeColor(predicate);
                if (!predicateTypeToColorMap.has(edgeColor)) {
                    predicateTypeToColorMap.set(edgeColor, true);
                    // Create an arrow head for the new color
                    createColorArrow_1.default(defs, "#" + edgeColor);
                }
                /**
                 * Put the triplet into the LevelGraph database
                 * and mutates the d3 nodes and links list to
                 * visually pop on the node/s.
                 */
                const newTriplet = {
                    subject: subject.hash,
                    predicate: predicate,
                    object: object.hash
                };
                return new Promise((resolve, reject) => {
                    tripletsDB.put(newTriplet, (err) => {
                        err ? reject(err) : resolve();
                    });
                });
            })
            .then(() => {
                /**
                 * If the predicate has a hash, it is added to a Map.
                 * This way we can mutate the predicate to manipulate its
                 * properties.
                 * Basically we are saving a reference to the predicate object.
                 */
                if (predicate.hash) {
                    if (predicateMap.has(predicate.hash)) {
                        console.warn("Edge hash must be unique. There already exists a predicate with the hash: ", predicate.hash);
                    }
                    predicateMap.set(predicate.hash, predicate);
                }
                // Add nodes to graph
                simulation.stop();
                if (!nodeMap.has(subject.hash)) {
                    // Set the node
                    nodes.push(subject);
                    nodeMap.set(subject.hash, subject);
                }
                if (!nodeMap.has(object.hash)) {
                    nodes.push(object);
                    nodeMap.set(object.hash, object);
                }
                if (tripletObject.predicate.constraint) {
                    createConstraint(tripletObject.predicate.constraint);
                }
                if (!preventLayout) {
                    return createNewLinks();
                }
                return Promise.resolve();
            })
            .catch((err) => {
                console.error(err);
                return Promise.reject(err);
            });
    }

    /**
     * Removes a triplet object. Silently fails if edge doesn't exist.
     * @param {object} tripletObject
     * @param preventLayout - prevent restart from occuring
     */
    function removeTriplet(tripletObject, preventLayout?: boolean) {
        if (!tripletValidation(tripletObject)) {
            return;
        }
        const subject = tripletObject.subject, predicate = tripletObject.predicate, object = tripletObject.object;
        return new Promise((resolve, reject) => tripletsDB.del({
            subject: subject.hash,
            predicate: predicate,
            object: object.hash
        }, function (err) {
            if (err)
                reject(err);
            resolve();
        })).then(() => {
            predicateMap.delete(predicate.hash);
            if (tripletObject.predicate.constraint) {
                removeConstraint(tripletObject.predicate.constraint);
            }
            simulation.stop();
            if (!preventLayout) {
                return createNewLinks();
            }
        });
    }

    /**
     *  Update edge data. Fails silently if doesnt exist
     * @param {object} tripletObject
     */
    function updateTriplet(tripletObject) {
        if (!tripletValidation(tripletObject)) {
            return;
        }
        const subject = tripletObject.subject, predicate = tripletObject.predicate, object = tripletObject.object;
        tripletsDB.del({ subject: subject.hash, object: object.hash }, (err) => {
            if (err) {
                console.log(err);
            }
            tripletsDB.put({
                subject: subject.hash,
                predicate: predicate,
                object: object.hash
            }, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        });
    }

    /**
     * Removes the node and all triplets associated with it.
     * @param {String} nodeHash hash of the node to remove.
     * @param callback
     */
    function removeNode(nodeHash, callback) {
        tripletsDB.get({ subject: nodeHash }, function (err, l1) {
            if (err) {
                return console.error(err);
            }
            tripletsDB.get({ object: nodeHash }, function (err, l2) {
                if (err) {
                    return console.error(err);
                }
                // Check if the node exists
                if (l1.length + l2.length === 0) {
                    // Once the edges are deleted we can remove the node.
                    let nodeIndex = -1;
                    for (let i = 0; i < nodes.length; i++) {
                        if (nodes[i].hash === nodeHash) {
                            nodeIndex = i;
                            break;
                        }
                    }
                    if (nodeIndex === -1) {
                        return console.error("There is no node");
                    }
                    simulation.stop();
                    nodes.splice(nodeIndex, 1);
                    if (nodeMap.get(nodeHash).parent) {
                        unGroup({ nodes: [nodeHash] }, true);
                    }
                    nodeMap.delete(nodeHash);
                    createNewLinks();
                    return;
                }
                tripletsDB.del([...l1, ...l2], function (err) {
                    if (err) {
                        return err;
                    }
                    // Once the edges are deleted we can remove the node.
                    let nodeIndex = -1;
                    for (let i = 0; i < nodes.length; i++) {
                        if (nodes[i].hash === nodeHash) {
                            nodeIndex = i;
                            break;
                        }
                    }
                    if (nodeIndex === -1) {
                        return console.error("There is no node");
                    }
                    simulation.stop();
                    nodes.splice(nodeIndex, 1);
                    nodeMap.delete(nodeHash);
                    createNewLinks();
                });
            });
        });
    }

    /**
     * Function that fires when a node is clicked.
     * @param {function} selectNodeFunc
     */
    function setClickNode(selectNodeFunc) {
        layoutOptions.clickNode = selectNodeFunc;
    }

    /**
     * Function that fires when a node is double clicked.
     * @param {function} selectNodeFunc
     */
    function setDblClickNode(selectNodeFunc) {
        layoutOptions.dblclickNode = selectNodeFunc;
    }

    /**
     * Public function to mutate edge objects
     * can mutate single edges or multiple edges at once
     * can mutate multiple edges to have 1 value, or multiple edges to each have their own value
     * for multiple values, value array length==id array length, first value will be mapped to first id in array etc...
     * @param action {Object} action - action to be performed
     * @param action.property {string}: property to be mutated - string
     * @param action.id {(string|string[])}: hash(es) of edges to be mutated
     * @param action.value {(any|any[])}: new value to set property, single value or array of values.
     */
    function editEdge(action) {
        if (action === undefined || action.property === undefined || action.id === undefined) {
            return;
        }
        const prop = action.property;
        const idArray = Array.isArray(action.id) ? action.id : [action.id];
        const values = Array.isArray(action.value) ? action.value : [action.value];
        const multipleValues = (values.length > 1) && (idArray.length === values.length);
        const predicateArray = idArray.map(x => predicateMap.get(x));
        const editEdgeHelper = prop => {
            if (multipleValues) {
                predicateArray.forEach((d, i) => {
                    d[prop] = values[i];
                });
            } else {
                predicateArray.forEach(d => {
                    d[prop] = values[0];
                });
                updateStyles();
            }
        };
        switch (prop) {
            case "text": {
                editEdgeHelper("text");
                restart();
                break;
            }
            case "arrow": {
                editEdgeHelper("arrowhead");
                restart();
                break;
            }
            case "weight": {
                editEdgeHelper("strokeWidth");
                restart();
                break;
            }
            case "dash": {
                editEdgeHelper("strokeDasharray");
                restart();
                break;
            }
            case "color": {
                editEdgeHelper("stroke");
                restart();
                break;
            }
            default: {
                editEdgeHelper(prop);
                console.warn("Caution. You are modifying a new or unknown property: %s.", prop);
            }
        }
        // Update triplets DB with new predicate(s)
        const subObjArray = predicateArray.map(p => ({ subject: p.subject, object: p.object }));
        const newTripletsArray = predicateArray.map(p => ({ subject: p.subject, predicate: p, object: p.object }));
        tripletsDB.del(subObjArray, (err) => {
            if (err) {
                console.log(err);
            }
            tripletsDB.put(newTripletsArray, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        });
    }

    /**
     * Public function to mutate node objects
     * can mutate single nodes or multiple nodes at once
     * can mutate multiple nodes to have 1 value, or multiple nodes to each have their own value
     * for multiple values, value array length==id Array length, first value will be mapped to first id in array etc...
     * @param action {Object} action - action to be performed
     * @param action.property {string}: property to be mutated - string
     * @param action.id {(string|string[])}: id(s) of nodes to be mutated
     * @param action.value {(any|any[])}: new value to set property, single value or array of values.
     */
    function editNode(action) {
        if (action === undefined || action.property === undefined || action.id === undefined) {
            return;
        }
        const prop = action.property;
        const idArray = Array.isArray(action.id) ? action.id : [action.id];
        const values = Array.isArray(action.value) ? action.value : [action.value];
        const multipleValues = (values.length > 1) && (idArray.length === values.length);
        const nodeArray = idArray.map(x => nodeMap.get(x));
        const editNodeHelper = (prop) => {
            if (multipleValues) {
                nodeArray.forEach((d, i) => {
                    d[prop] = values[i];
                });
            } else {
                nodeArray.forEach(d => {
                    d[prop] = values[0];
                });
            }
        };
        switch (prop) {
            case "color": {
                editNodeHelper(prop);
                idArray.forEach((id, i) => {
                    if (multipleValues) {
                        node.filter(d => d.id === id).select("path").attr("fill", values[i]);
                    } else {
                        node.filter(d => d.id === id).select("path").attr("fill", values[0]);
                    }
                });
                // TODO either make colour change +text here or in updatestyles, not both.
                updateStyles();
                break;
            }
            case "nodeShape": {
                editNodeHelper(prop);
                const shapePaths = idArray.map(id => layoutOptions.nodePath(nodeMap.get(id)));
                idArray.forEach((id, i) => {
                    if (multipleValues) {
                        node.filter(d => d.id === id).select("path").attr("d", shapePaths[i]);
                    } else {
                        node.filter(d => d.id === id).select("path").attr("d", shapePaths[0]);
                    }
                });
                updateStyles();
                break;
            }
            case "fixed": {
                editNodeHelper(prop);
                restart();
                break;
            }
            case "fixedWidth": {
                editNodeHelper(prop);
                restart();
                break;
            }
            case "shortname": {
                editNodeHelper(prop);
                restart();
                break;
            }
            case "img": {
                editNodeHelper(prop);
                restart();
                break;
            }
            default: {
                editNodeHelper(prop);
                restart();
                const list = ["x", "y"];
                if (!list.includes(prop)) {
                    console.warn("Caution. You are modifying a new or unknown property: %s.", action.property);
                }
            }
        }
    }

    /**
     * Invoking this function will recenter the graph.
     */
    // function recenterGraph(){
    //     svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1))
    // }
    /**
     * Function to call when mouse over registers on a node.
     * It takes a d3 mouse over event.
     * @param {function} mouseOverCallback
     */
    function setMouseOver(mouseOverCallback) {
        layoutOptions.mouseOverNode = mouseOverCallback;
    }

    /**
     * Function to call when mouse out registers on a node.
     * It takes a d3 mouse over event.
     * @param {function} mouseOutCallback
     */
    function setMouseOut(mouseOutCallback) {
        layoutOptions.mouseOutNode = mouseOutCallback;
    }

    /**
     * Function called when mousedown on node.
     * @param mouseDownCallback - callback function
     */
    function setMouseDown(mouseDownCallback) {
        layoutOptions.mouseDownNode = mouseDownCallback;
    }

    /**
     * Add a node or a group to a group
     * @param group - target group, either an existing group, or a new group to create
     * @param children - object containing nodes and/or groups property. they are arrays of ID values
     * @param preventLayout - prevent layout restart from occuring
     */
    function addToGroup(group, children: { nodes?: string[], groups?: string[] }, preventLayout?: boolean) {
        const nodeId = children.nodes;
        const subGroupId = children.groups;
        // check minimum size
        if (nodeId.length === 0 && (subGroupId && subGroupId.length <= 1)) {
            throw new Error("Minimum 1 node or two subgroups");
        }
        // check nodes
        const nodeIndices: number[] = nodeId.map(id => nodes.findIndex(d => d.id === id));
        if (!nodeIndices.every(i => i >= 0)) {
            throw new Error("One or more nodes do not exist. Check node hash is correct");
        }
        // check subGroups
        let groupIndices = [];
        if (subGroupId) {
            groupIndices = subGroupId.map(id => groups.findIndex(g => g.id === id));
            if (!groupIndices.every(i => i < groups.length && i >= 0)) {
                throw new Error("One or more groups do not exist.");
            }
        }

        const nodesWithParentsID = nodeId.filter(id => nodeMap.get(id).parent);
        if (nodesWithParentsID.length > 0) {
            unGroup({ nodes: nodesWithParentsID }, true);
        }


        // get target group, if does not exist, create new group
        simulation.stop();
        const groupId = typeof (group) === "string" ? group : group.id;
        let groupObj = groupMap.get(groupId);
        if (!groupObj) {
            groupObj = {
                id: groupId,
                leaves: [],
                groups: [],
                data: group.data ? group.data : { color: layoutOptions.groupFillColor(), }
            };
            groups.push(groupObj);
            groupMap.set(groupId, groupObj);
        } else {
            if (!groupObj.leaves) {
                groupObj.leaves = [];
            }
            if (!groupObj.groups) {
                groupObj.groups = [];
            }
        }
        groupObj.leaves = groupObj.leaves.concat(nodeIndices);
        groupObj.groups = groupObj.groups.concat(groupIndices);
        if (!preventLayout) {
            if (groupObj.data.text) {
                return restart().then(() => repositionGroupText());
            }
            return restart();
        } else {
            return Promise.resolve();
        }
    }

    /**
     * Remove a group or node from a group
     * @param children - object containing nodes and/or groups property. they are arrays of ID values
     * @param preventLayout - prevent layout restart from occuring
     */
    function unGroup(children: { nodes?: string[], groups?: string[] } | [{ nodes?: string[], groups?: string[] }], preventLayout?: boolean) {
        simulation.stop();
        const childArray = Array.isArray(children) ? children : [children];
        childArray.forEach(child => {
            if (child.nodes) {
                // remove nodes from groups
                const leaves = child.nodes.map(id => nodeMap.get(id));
                leaves.forEach(d => {
                    if (d.parent) {
                        d.parent.leaves = d.parent.leaves.filter(leaf => leaf.id !== d.id);
                        delete d.parent;
                    }
                });
            }
            if (child.groups) {
                // remove groups from groups
                const subGroups = child.groups.map(id => {
                    const i = groups.findIndex(g => g.id === id);
                    return groups[i];
                });
                subGroups.forEach(g => {
                    if (g.parent) {
                        g.parent.groups = g.parent.groups.filter(sibling => sibling.id !== g.id);
                    }
                });
            }
        });

        // remove empty groups
        groups = groups.filter(g => {
            if (g.leaves.length === 0 && g.groups.length <= 1) {
                groupMap.delete(g.id);
                // empty group is a child of another group
                if (g.parent) {
                    g.parent.groups = g.parent.groups.filter(subgroup => subgroup.id !== g.id);
                }
                return false;
            } else {
                return true;
            }
        });
        if (!preventLayout) {
            return restart();
        } else {
            return Promise.resolve();
        }
    }

    /**
     * Helper function to add  a constraint to simulation
     * requires restarting simulation after
     * @param constraint
     */
    function createConstraint(constraint) {
        const leftIndex = nodes.map(v => v.id).indexOf(constraint.leftID);
        const rightIndex = nodes.map(v => v.id).indexOf(constraint.rightID);
        if (leftIndex === -1 || rightIndex === -1) {
            console.warn("Cannot create constraint, Node does not exist.", constraint);
            return;
        }
        constraints.push(Object.assign({}, constraint, { left: leftIndex, right: rightIndex }));
        simulation
            .constraints(constraints);
    }

    /**
     * Helper function to remove a constraint from simulation
     * requires restarting simulation after
     * @param constraint
     */
    function removeConstraint(constraint) {
        const index = constraints
            .map(c => JSON.stringify({ l: c.leftID, r: c.rightID }))
            .indexOf(JSON.stringify({ l: constraint.leftID, r: constraint.rightID }));
        if (index === -1) {
            console.warn("Cannot delete constraint, does not exist.", constraint);
            return;
        }
        constraints.splice(index, 1);
        simulation
            .constraints(constraints);
    }

    /**
     * Serialize the graph.
     * scheme: triplets: subj:hash-predicateType-obj:hash[]
     *         nodes: hash[]
     */
    function saveGraph() {
        d3.selectAll(".radial-menu").remove();
        const svg = d3.select(".svg-content-responsive");
        const t = d3.zoomIdentity.translate(0, 0).scale(1);
        svg.call(zoom.transform, t);
        layoutOptions.zoomScale(1);

        return new Promise((resolve, reject) => {
            tripletsDB.get({}, (err, l) => {
                if (err) {
                    reject(err);
                } else {
                    const saved = JSON.stringify({
                        triplets: l.map(v => ({ subject: v.subject, predicate: v.predicate, object: v.object })),
                        nodes: nodes.map(v => ({ hash: v.hash, x: v.x, y: v.y })),
                        groups: groups.map(v => ({
                            children: {
                                nodes: v.leaves.map(d => d.id),
                                groups: v.groups.map(g => g.id),
                            },
                            id: v.id,
                            data: v.data
                        })),
                    });
                    resolve(saved);
                }
            });
        });
    }

    function dragged(d) {
        const e = d3.event;
        // prevent drag whilst image resizing
        if (internalOptions.isImgResize) {
            d.py = d.y;
            d.px = d.x;
            return;
        }
        // Multiple item drag
        if (layoutOptions.isSelect && layoutOptions.isSelect() && layoutOptions.selection().nodes.size > 1) {
            const { dx, dy } = e;
            [...layoutOptions.selection().nodes.values()]
                .forEach(x => {
                    if (x.id !== d.id) {
                        x.px += dx;
                        x.py += dy;
                    }
                });
            return;
        }
        // Snap to alignment
        if (layoutOptions.nodeToPin(d) && layoutOptions.snapToAlignment) {
            alignElements.remove();
            const threshold = layoutOptions.snapThreshold;
            const xOffset = d.width / 2;
            const yOffset = d.height / 2;
            const gridX = new Map();
            const gridY = new Map();
            const gridCX = new Map();
            const gridCY = new Map();
            const dBoundsInflate = d.bounds.inflate(1);
            const xOverlapNodes = [];
            const yOverlapNodes = [];
            const foundAlignment = {
                x: false,
                xDist: false,
                y: false,
                yDist: false,
            };

            const mapHelper = (mapObj, key, value) => {
                value = [].concat(value);
                mapObj.has(key) ? mapObj.set(key, mapObj.get(key).concat([value])) : mapObj.set(key, [value]);
            };

            nodes.forEach((node) => {
                if (node.hash !== d.hash) {
                    // create map of possible alignment coordinates
                    const yCoords = [node.bounds.y, node.bounds.Y];
                    const xCoords = [node.bounds.x, node.bounds.X];
                    xCoords.forEach(x => mapHelper(gridX, Math.round(x * 2) / 2, yCoords));
                    yCoords.forEach(y => mapHelper(gridY, Math.round(y * 2) / 2, xCoords));
                    mapHelper(gridCX, Math.round(node.bounds.cx() * 2) / 2, yCoords);
                    mapHelper(gridCY, Math.round(node.bounds.cy() * 2) / 2, xCoords);

                    // find all overlapping node boundaries
                    if (node.bounds.overlapX(dBoundsInflate) > 0) {
                        xOverlapNodes.push(node.bounds);
                    }
                    if (node.bounds.overlapY(dBoundsInflate) > 0) {
                        yOverlapNodes.push(node.bounds);
                    }
                }
            });

            const findAligns = ({ centreMap, edgeMap, offset, threshold, position }) => {
                // check for centre alignments
                let alignments = [...centreMap.entries()].reduce((acc, curr) => {
                    if (curr[0] > position - threshold && curr[0] < position + threshold && curr[1].length > acc.array.length) {
                        return { coord: curr[0], array: curr[1], offset: 0 };
                    }
                    return acc;
                }, { coord: undefined, array: [], offset: undefined });
                // check for edge alignments
                alignments = [...edgeMap.entries()].reduce((acc, curr) => {
                    if (curr[0] > position + offset - threshold && curr[0] < position + offset + threshold && curr[1].length > acc.array.length) {
                        return { coord: curr[0], array: curr[1], offset: offset };
                    }
                    if (curr[0] > position - offset - threshold && curr[0] < position - offset + threshold && curr[1].length > acc.array.length) {
                        return { coord: curr[0], array: curr[1], offset: -offset };
                    }
                    return acc;

                }, alignments);
                return alignments;
            };
            const xAlign = findAligns({ centreMap: gridCX, edgeMap: gridX, offset: xOffset, threshold, position: e.x });
            const yAlign = findAligns({ centreMap: gridCY, edgeMap: gridY, offset: yOffset, threshold, position: e.y });
            if (xAlign.coord) { // if X alignment found
                const yarr = xAlign.array.reduce((acc, curr) => acc.concat(curr), []);
                alignElements.create("x", {
                    x: xAlign.coord,
                    X: xAlign.coord,
                    y: Math.min(...yarr, d.bounds.y) - 4,
                    Y: Math.max(...yarr, d.bounds.Y) + 4,
                });
                d.px = xAlign.coord - xAlign.offset;
                foundAlignment.x = true;
            }
            if (yAlign.coord) { // if Y alignment found
                const xarr = yAlign.array.reduce((acc, curr) => acc.concat(curr), []);
                alignElements.create("y", {
                    x: Math.min(...xarr, d.bounds.x) - 4,
                    X: Math.max(...xarr, d.bounds.X) + 4,
                    y: yAlign.coord,
                    Y: yAlign.coord,
                });
                // +1 required otherwise nodes collide.
                const offset = yAlign.offset === 0 ? 0 : yAlign.offset > 0 ? yAlign.offset + 1 : yAlign.offset - 1;
                d.py = yAlign.coord - offset;
                foundAlignment.y = true;
            }

            // Sort overlapping boundaries by position in increasing order
            xOverlapNodes.sort((a, b) => (a.y - b.y));
            yOverlapNodes.sort((a, b) => (a.x - b.x));

            const findOverlapGroups = ({ bounds, splitThreshold, axis }) => {
                const invAxis = axis === "X" ? "Y" : "X";
                const overlapGroups = [];
                let index: number = -1;
                const visited: boolean[] = new Array(bounds.length).fill(false);
                let tempArray = [];
                let newNode = false;
                for (let i = 0; i < bounds.length; i++) {
                    if (bounds[i][invAxis] < splitThreshold) {
                        index = i;
                    }
                    if (visited.every(v => v)) {
                        continue;
                    }
                    newNode = false;
                    if (!visited[i]) {
                        newNode = true;
                        visited[i] = true;
                    }
                    tempArray = [bounds[i]];
                    for (let j = i + 1; j < bounds.length; j++) {
                        if ((axis === "X" && bounds[i].overlapX(bounds[j]) > 0) || (axis === "Y" && bounds[i].overlapY(bounds[j]) > 0)) {
                            if (!visited[j]) {
                                newNode = true;
                                visited[j] = true;
                            }
                            tempArray.push(bounds[j]);
                        }
                    }
                    if (newNode && tempArray.length > 1) {
                        overlapGroups.push(tempArray);
                    }
                }
                return { overlapGroups, index };
            };

            const { overlapGroups: xOverlapGroups, index: xIndex } = findOverlapGroups({
                bounds: xOverlapNodes,
                splitThreshold: e.y - yOffset,
                axis: "X",
            });
            const { overlapGroups: yOverlapGroups, index: yIndex } = findOverlapGroups({
                bounds: yOverlapNodes,
                splitThreshold: e.x - xOffset,
                axis: "Y",
            });
            const dimensioningLines = {
                projection: [],
                dimension: [],
            };
            // If overlaps found in X axis

            if (xOverlapGroups.length > 0) {
                const xGaps = new Map();
                xOverlapGroups.forEach((group) => {
                    for (let i = 1; i < group.length; i++) {
                        mapHelper(xGaps, group[i].y - group[i - 1].Y, [group[i - 1], group[i]]);
                    }
                });

                const dimensionLineHelper = (pair) => {
                    const x = Math.max(...pair.reduce((acc, curr) => acc.concat(curr.X), []));
                    dimensioningLines.projection.push({
                        x: pair[0].X,
                        X: x + 12,
                        y: pair[0].Y,
                        Y: pair[0].Y,
                    });
                    dimensioningLines.projection.push({
                        x: pair[1].X,
                        X: x + 12,
                        y: pair[1].y,
                        Y: pair[1].y,
                    });
                    dimensioningLines.dimension.push({
                        x: x + 9,
                        X: x + 9,
                        y: pair[0].Y,
                        Y: pair[1].y,
                    });
                };

                const dimLinesBelow = (i, g) => {
                    const X = Math.max(d.bounds.X, xOverlapNodes[i].X);
                    // projection line on target node
                    dimensioningLines.projection.push({
                        x: d.bounds.X,
                        X: X + 12,
                        y: xOverlapNodes[i].y - g,
                        Y: xOverlapNodes[i].y - g,
                    });
                    // projection line on neighbour node
                    dimensioningLines.projection.push({
                        x: xOverlapNodes[i].X,
                        X: X + 12,
                        y: xOverlapNodes[i].y,
                        Y: xOverlapNodes[i].y,
                    });
                    // dimension line between projection lines
                    dimensioningLines.dimension.push({
                        x: X + 9,
                        X: X + 9,
                        y: xOverlapNodes[i].y - g,
                        Y: xOverlapNodes[i].y,
                    });
                };

                const dimLinesAbove = (i, g) => {
                    const X = Math.max(d.bounds.X, xOverlapNodes[i].X);
                    // projection line on target node
                    dimensioningLines.projection.push({
                        x: d.bounds.X,
                        X: X + 12,
                        y: xOverlapNodes[i].Y + g,
                        Y: xOverlapNodes[i].Y + g,
                    });
                    // projection line on neighbour node
                    dimensioningLines.projection.push({
                        x: xOverlapNodes[i].X,
                        X: X + 12,
                        y: xOverlapNodes[i].Y,
                        Y: xOverlapNodes[i].Y,
                    });
                    // dimension line between projection lines
                    dimensioningLines.dimension.push({
                        x: X + 9,
                        X: X + 9,
                        y: xOverlapNodes[i].Y + g,
                        Y: xOverlapNodes[i].Y,
                    });
                };

                xGaps.forEach((b, g) => {
                    let alignFound = false;
                    if (xIndex > -1) {
                        if (xOverlapNodes[xIndex].Y + g > e.y - yOffset - threshold && xOverlapNodes[xIndex].Y + g < e.y - yOffset + threshold) {
                            if (!foundAlignment.y || d.py === xOverlapNodes[xIndex].Y + g + yOffset) {
                                d.py = xOverlapNodes[xIndex].Y + g + yOffset;
                                dimLinesAbove(xIndex, g);
                                alignFound = true;
                                foundAlignment.yDist = true;
                            }

                        }
                    }
                    if (xIndex < xOverlapNodes.length - 1) {
                        if (xOverlapNodes[xIndex + 1].y - g > e.y + yOffset - threshold && xOverlapNodes[xIndex + 1].y - g < e.y + yOffset + threshold) {
                            if (!foundAlignment.y || d.py === xOverlapNodes[xIndex + 1].y - g - yOffset) {
                                d.py = xOverlapNodes[xIndex + 1].y - g - yOffset;
                                dimLinesBelow(xIndex + 1, g);
                                alignFound = true;
                                foundAlignment.yDist = true;
                            }
                        }
                    }
                    if (alignFound) {
                        b.forEach(pair => dimensionLineHelper(pair));
                        alignElements.create("yDist", dimensioningLines);
                    }
                });
                // if target node is in middle
                if (xIndex >= 0 && xIndex < xOverlapNodes.length - 1 && !foundAlignment.yDist) {
                    const midpoint = (xOverlapNodes[xIndex + 1].y + xOverlapNodes[xIndex].Y) / 2;
                    const y = midpoint - yOffset;
                    const Y = midpoint + yOffset;
                    if (midpoint > e.y - threshold && midpoint < e.y + threshold && (!foundAlignment.y || d.py === midpoint)) {
                        d.py = midpoint;
                        const X = Math.max(d.bounds.X, xOverlapNodes[xIndex].X, xOverlapNodes[xIndex + 1].X);
                        // projection line on target node bottom
                        dimensioningLines.projection.push({
                            x: d.bounds.X,
                            X: X + 12,
                            y: Y,
                            Y: Y,
                        });
                        // projection line on top neighbour node
                        dimensioningLines.projection.push({
                            x: xOverlapNodes[xIndex].X,
                            X: X + 12,
                            y: xOverlapNodes[xIndex].Y,
                            Y: xOverlapNodes[xIndex].Y,
                        });
                        // dimension node above
                        dimensioningLines.dimension.push({
                            x: X + 9,
                            X: X + 9,
                            y: y,
                            Y: xOverlapNodes[xIndex].Y,
                        });
                        // projection line on target node top
                        dimensioningLines.projection.push({
                            x: d.bounds.X,
                            X: X + 12,
                            y: y,
                            Y: y,
                        });
                        // projection line on bottom neighbour  node
                        dimensioningLines.projection.push({
                            x: xOverlapNodes[xIndex + 1].X,
                            X: X + 12,
                            y: xOverlapNodes[xIndex + 1].y,
                            Y: xOverlapNodes[xIndex + 1].y,
                        });
                        // dimension node below
                        dimensioningLines.dimension.push({
                            x: X + 9,
                            X: X + 9,
                            y: Y,
                            Y: xOverlapNodes[xIndex + 1].y,
                        });
                        alignElements.create("yDist", dimensioningLines);
                    }
                }

            }
            if (yOverlapGroups.length > 0) {
                const yGaps = new Map();
                yOverlapGroups.forEach((group) => {
                    for (let i = 1; i < group.length; i++) {
                        mapHelper(yGaps, group[i].x - group[i - 1].X, [group[i - 1], group[i]]);
                    }
                });

                const dimensionLineHelper = (pair) => {
                    const y = Math.max(...pair.reduce((acc, curr) => acc.concat(curr.Y), []));
                    dimensioningLines.projection.push({
                        y: pair[0].Y,
                        Y: y + 12,
                        x: pair[0].X,
                        X: pair[0].X,
                    });
                    dimensioningLines.projection.push({
                        y: pair[1].Y,
                        Y: y + 12,
                        x: pair[1].x,
                        X: pair[1].x,
                    });
                    dimensioningLines.dimension.push({
                        y: y + 9,
                        Y: y + 9,
                        x: pair[0].X,
                        X: pair[1].x,
                    });
                };

                const dimLinesRight = (i, g) => {
                    const Y = Math.max(d.bounds.Y, yOverlapNodes[i].Y);
                    // projection line on target node
                    dimensioningLines.projection.push({
                        y: d.bounds.Y,
                        Y: Y + 12,
                        x: yOverlapNodes[i].x - g,
                        X: yOverlapNodes[i].x - g,
                    });
                    // projection line on neighbour node
                    dimensioningLines.projection.push({
                        y: yOverlapNodes[i].Y,
                        Y: Y + 12,
                        x: yOverlapNodes[i].x,
                        X: yOverlapNodes[i].x,
                    });
                    // dimension line between projection lines
                    dimensioningLines.dimension.push({
                        y: Y + 9,
                        Y: Y + 9,
                        x: yOverlapNodes[i].x - g,
                        X: yOverlapNodes[i].x,
                    });
                };

                const dimLinesLeft = (i, g) => {
                    const Y = Math.max(d.bounds.Y, yOverlapNodes[i].Y);
                    // projection line on target node
                    dimensioningLines.projection.push({
                        y: d.bounds.Y,
                        Y: Y + 12,
                        x: yOverlapNodes[i].X + g,
                        X: yOverlapNodes[i].X + g,
                    });
                    // projection line on neighbour node
                    dimensioningLines.projection.push({
                        y: yOverlapNodes[i].Y,
                        Y: Y + 12,
                        x: yOverlapNodes[i].X,
                        X: yOverlapNodes[i].X,
                    });
                    // dimension line between projection lines
                    dimensioningLines.dimension.push({
                        y: Y + 9,
                        Y: Y + 9,
                        x: yOverlapNodes[i].X + g,
                        X: yOverlapNodes[i].X,
                    });
                };

                yGaps.forEach((b, g) => {
                    let alignFound = false;
                    if (yIndex > -1) {
                        if (yOverlapNodes[yIndex].X + g > e.x - xOffset - threshold && yOverlapNodes[yIndex].X + g < e.x - xOffset + threshold) {
                            if (!foundAlignment.x || d.px === yOverlapNodes[yIndex].X + g + xOffset) {
                                d.px = yOverlapNodes[yIndex].X + g + xOffset;
                                dimLinesLeft(yIndex, g);
                                alignFound = true;
                                foundAlignment.xDist = true;
                            }

                        }
                    }
                    if (yIndex < yOverlapNodes.length - 1) {
                        if (yOverlapNodes[yIndex + 1].x - g > e.x + xOffset - threshold && yOverlapNodes[yIndex + 1].x - g < e.x + xOffset + threshold) {
                            if (!foundAlignment.x || d.px === yOverlapNodes[yIndex + 1].x - g - xOffset) {
                                d.px = yOverlapNodes[yIndex + 1].x - g - xOffset;
                                dimLinesRight(yIndex + 1, g);
                                alignFound = true;
                                foundAlignment.xDist = true;
                            }
                        }
                    }
                    if (alignFound) {
                        b.forEach(pair => dimensionLineHelper(pair));
                        alignElements.create("xDist", dimensioningLines);
                    }
                });
                // if target node is in middle
                if (yIndex >= 0 && yIndex < yOverlapNodes.length - 1 && !foundAlignment.xDist) {
                    const midpoint = (yOverlapNodes[yIndex + 1].x + yOverlapNodes[yIndex].X) / 2;
                    const x = midpoint - xOffset;
                    const X = midpoint + xOffset;
                    if (midpoint > e.x - threshold && midpoint < e.x + threshold && (!foundAlignment.x || d.px === midpoint)) {
                        d.px = midpoint;
                        const Y = Math.max(d.bounds.Y, yOverlapNodes[yIndex].Y, yOverlapNodes[yIndex + 1].Y);
                        // projection line on target node bottom
                        dimensioningLines.projection.push({
                            y: d.bounds.Y,
                            Y: Y + 12,
                            x: X,
                            X: X,
                        });
                        // projection line on top neighbour node
                        dimensioningLines.projection.push({
                            y: yOverlapNodes[yIndex].Y,
                            Y: Y + 12,
                            x: yOverlapNodes[yIndex].X,
                            X: yOverlapNodes[yIndex].X,
                        });
                        // dimension node above
                        dimensioningLines.dimension.push({
                            y: Y + 9,
                            Y: Y + 9,
                            x: x,
                            X: yOverlapNodes[yIndex].X,
                        });
                        // projection line on target node top
                        dimensioningLines.projection.push({
                            y: d.bounds.Y,
                            Y: Y + 12,
                            x: x,
                            X: x,
                        });
                        // projection line on bottom neighbour  node
                        dimensioningLines.projection.push({
                            y: yOverlapNodes[yIndex + 1].Y,
                            Y: Y + 12,
                            x: yOverlapNodes[yIndex + 1].x,
                            X: yOverlapNodes[yIndex + 1].x,
                        });
                        // dimension node below
                        dimensioningLines.dimension.push({
                            y: Y + 9,
                            Y: Y + 9,
                            x: X,
                            X: yOverlapNodes[yIndex + 1].x,
                        });
                        alignElements.create("xDist", dimensioningLines);
                    }
                }
            }
        }
    }

    /**
     * Given background color, return if foreground colour should be black or white based on colour brightness
     * defaults to black
     * @param {string} color - background color in hexadecimal format
     */
    function computeTextColor(color: string) {
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
     * creates temporary pop up for group text
     * Can be removed by passing show as false, or by restarting
     * @param show - true show text, false hide
     * @param groupId - id of group
     * @param text - dummy text defaults as "New"
     */
    function groupTextPreview(show: boolean, groupId: string | string[], text?: string) {
        const groupArr = Array.isArray(groupId) ? groupId : [groupId];
        let groupSel = group.select("text");
        if (groupId) {
            groupSel = groupSel.filter(d => groupArr.includes(d.id));
        }
        groupSel.html((d) => {
            if ((!d.data.text || d.data.text == "") && show) {
                return text || "New";
            } else {
                return d.data.text;
            }
        });
        return restart(undefined, true);
    }

    /**
     * Update classes of all elements without updating other properties.
     */
    function updateHighlighting() {
        group.select(".group")
            .attr("class", d => `group ${d.data.class}`);
        node.select("path")
            .attr("class", d => d.class);
        link.select(".line-front")
            .attr("marker-start", d => {
                const color = typeof layoutOptions.edgeColor == "string" ? layoutOptions.edgeColor : layoutOptions.edgeColor(d.predicate);
                if (typeof layoutOptions.edgeArrowhead != "number") {
                    if (layoutOptions.edgeArrowhead(d.predicate) == -1 || layoutOptions.edgeArrowhead(d.predicate) == 2) {
                        if (d.predicate.class.includes("highlight")) {
                            return addArrowDefs(defs, "409EFF", true);
                        }
                        return addArrowDefs(defs, color, true);
                    }
                    return "none";
                }
                return addArrowDefs(defs, color, true);
            })
            .attr("marker-end", d => {
                const color = typeof layoutOptions.edgeColor == "string" ? layoutOptions.edgeColor : layoutOptions.edgeColor(d.predicate);
                if (typeof layoutOptions.edgeArrowhead != "number") {
                    if (layoutOptions.edgeArrowhead(d.predicate) == 1 || layoutOptions.edgeArrowhead(d.predicate) == 2) {
                        if (d.predicate.class.includes("highlight")) {
                            return addArrowDefs(defs, "409EFF", false);
                        }
                        return addArrowDefs(defs, color, false);
                    }
                    return "none";
                }
                return addArrowDefs(defs, color, false);
            })
            .attr("class", d => "line-front " + d.predicate.class.replace("highlight", "highlight-edge"))
    }

    /**
     * These exist to prevent errors when the user
     * tabs away from the graph.
     */
    window.onfocus = function () {
        restart();
    };
    window.onblur = function () {
        simulation.stop();
    };
    // Public api
    /**
     * TODO:
     * Allow reference to the graph in the options object.
     * Solutions?:
     *  - Maybe have a "this" reference passed into the callbacks.
     */
    return {
        // Check if node is drawn.
        hasNode: (nodeHash) => nodes.filter(v => v.hash == nodeHash).length === 1,
        // Public access to the levelgraph db.
        getDB: () => tripletsDB,
        // Get node from nodeMap
        getNode: (hash) => nodeMap.get(hash),
        // Get Group from groupMap
        getGroup: (hash) => groupMap.get(hash),
        // Get nodes and edges by coordinates
        selectByCoords,
        // Get edge from predicateMap
        getPredicate: (hash) => predicateMap.get(hash),
        // Get Layout options
        getLayoutOptions: () => layoutOptions,
        // Get SVG element. If you want the node use `graph.getSVGElement().node();`
        getSVGElement: () => svg,
        // Get Stringified representation of the graph.
        saveGraph,
        // add a directed edge
        addTriplet,
        // remove an edge
        removeTriplet,
        // update edge data in database
        updateTriplet,
        // remove a node and all edges connected to it.
        removeNode,
        // add a node or array of nodes.
        addNode,
        // edit node property
        editNode,
        // edit edge property
        editEdge,
        // Add nodes or groups to group
        addToGroup,
        // Remove nodes or groups from group
        unGroup,
        // Show or hide group text popup
        groupTextPreview,
        // Restart styles or layout.
        restart: {
            styles: updateStyles,
            textAlign: repositionText,
            redrawEdges: createNewLinks,
            layout: restart,
            handleDisconnects: handleDisconnects,
            repositionGroupText: repositionGroupText,
            highlight: updateHighlighting,
        },
        canvasOptions: {
            setWidth: (width) => {
                svg.attr("viewBox", `0 0 ${width} ${layoutOptions.height}`);
                layoutOptions.width = width;
            },
            setHeight: (height) => {
                svg.attr("viewBox", `0 0 ${layoutOptions.width} ${height}`);
                layoutOptions.height = height;
            },
        },
        // Set event handlers for node.
        nodeOptions: {
            setDblClickNode,
            setClickNode,
            setMouseOver,
            setMouseOut,
            setMouseDown,
        },
        // Handler for clicking on the edge.
        edgeOptions: {
            setClickEdge: (callback) => {
                layoutOptions.clickEdge = callback;
            },
            setDblClickEdge: (callback) => {
                layoutOptions.dblclickEdge = callback;
            }
        },
        groupOptions: {
            setDblClickGroup: (callback) => {
                layoutOptions.dblclickGroup = callback;
            }
        },
        // Change layouts on the fly.
        // May be a webcola memory leak if you change the layout too many times.
        colaOptions: {
            flowLayout: {
                down: (callback) => {
                    layoutOptions.flowDirection = "y";
                    if (layoutOptions.layoutType == "flowLayout") {
                        simulation.flowLayout(layoutOptions.flowDirection, layoutOptions.edgeLength);
                    } else {
                        layoutOptions.layoutType = "flowLayout";
                        simulation = updateColaLayout_1.updateColaLayout(layoutOptions);
                    }
                    restart(callback);
                },
                right: (callback) => {
                    layoutOptions.flowDirection = "x";
                    if (layoutOptions.layoutType == "flowLayout") {
                        simulation.flowLayout(layoutOptions.flowDirection, layoutOptions.edgeLength);
                    } else {
                        layoutOptions.layoutType = "flowLayout";
                        simulation = updateColaLayout_1.updateColaLayout(layoutOptions);
                    }
                    restart(callback);
                }
            }
        }
    };
}

exports.default = networkVizJS;
// # sourceMappingURL=networkViz.js.map
