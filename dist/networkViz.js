"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const d3 = require("d3");
const cola = require("webcola");
const $ = require("jquery");
const levelgraph = require("levelgraph");
const level = require("level-browserify");
const jscolor = require("./util/jscolor");
const updateColaLayout_1 = require("./updateColaLayout");
const createColorArrow_1 = require("./util/createColorArrow");
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
        nodeShape: "rect",
        width: 900,
        height: 600,
        pad: 15,
        margin: 10,
        canDrag: () => true,
        nodeDragStart: undefined,
        nodeDragEnd: undefined,
        edgeLabelText: (edgeData) => edgeData.text,
        // Both mouseout and mouseover take data AND the selection (arg1, arg2)
        mouseDownNode: undefined,
        mouseOverNode: undefined,
        mouseOutNode: undefined,
        mouseUpNode: undefined,
        // These are "live options"
        updateNodeColor: undefined,
        updateNodeShape: undefined,
        nodeRemove: undefined,
        startArrow: undefined,
        clickPin: undefined,
        nodeToPin: false,
        nodeToColor: "#ffffff",
        nodeStrokeWidth: 1,
        nodeStrokeColor: "grey",
        clickNode: (node, element) => undefined,
        clickAway: () => undefined,
        edgeColor: "black",
        edgeStroke: 2,
        edgeStrokePad: 20,
        edgeLength: d => {
            console.log(`length`, d);
            return 150;
        },
        edgeSmoothness: 0,
        clickEdge: (d, element) => undefined,
        edgeRemove: undefined,
        mouseOverRadial: undefined,
        mouseOutRadial: undefined,
        colorPickerOpen: undefined,
        colorPickerClose: undefined,
    };
    const X = 37;
    const Y = -13;
    const p1x = 25 + X;
    const p1y = 25 + Y;
    const p2x = 75 + X;
    const p3x = 100 + X;
    const p4y = 50 + Y;
    const d0 = "M16 48 L48 48 L48 16 L16 16 Z", // RECT
    d1 = "M20,40a20,20 0 1,0 40,0a20,20 0 1,0 -40,0", // CIRCLE
    // d2 = "M148.1,310.5h-13.4c-4.2,0-7.7-3.4-7.7-7.7v-7.4c0-4.2,3.4-7.7,7.7-7.7h13.4c4.2,0,7.7,3.4,7.7,7.7v7.4  C155.7,307.1,152.3,310.5,148.1,310.5z"; // CAPSULE
    d2 = `M ${p1x} ${p1y} L ${p2x} ${p1y} C ${p3x} ${p1y} ${p3x} ${p4y} ${p2x} ${p4y} L ${p1x} ${p4y} C ${X} ${p4y} ${X} ${p1y} ${p1x} ${p1y} `; // CAPSULE
    const internalOptions = {
        isDragging: false
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
    let links = [];
    let groups = [];
    const groupByHashes = [];
    const width = layoutOptions.width, height = layoutOptions.height, margin = layoutOptions.margin, pad = layoutOptions.pad;
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
    }).on("end", (d, i, elements) => {
        layoutOptions.nodeDragEnd && layoutOptions.nodeDragEnd(d, elements[i]);
        internalOptions.isDragging = false;
    });
    /**
     * Create the defs element that stores the arrow heads.
     */
    const defs = svg.append("defs");
    // Define svg groups for storing the visuals.
    const g = svg.append("g");
    let group = g.append("g")
        .selectAll(".group"), link = g.append("g")
        .selectAll(".link"), node = g.append("g")
        .selectAll(".node");
    /**
     * Zooming and panning behaviour.
     */
    const zoom = d3.zoom().scaleExtent([0.1, 5]).on("zoom", zoomed);
    zoom.filter(function () {
        // Prevent zoom when mouse over node.
        return d3.event.target.tagName.toLowerCase() === "svg";
    });
    svg.call(zoom).on("dblclick.zoom", null);
    function zoomed() {
        layoutOptions.clickAway();
        g.attr("transform", d3.event.transform);
    }
    /**
     * Resets width or radius of nodes.
     * Allows dynamically changing node sizes based on text.
     */
    function updatePathDimensions() {
        hoverMenuRemoveIcons(); // hover menu does not automatically change size with node
        node.select("path")
            .attr("transform", function (d) {
            // Scale appropriately using http://stackoverflow.com/a/9877871/6421793
            const currentWidth = this.getBBox().width, w = d.width, currentHeight = this.getBBox().height, h = d.height, scaleW = (w - layoutOptions.margin) / currentWidth, scaleH = (h - layoutOptions.margin) / currentHeight;
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
     * @param textNodes - d3 selection of the text
     */
    function repositionText() {
        return Promise.resolve()
            .then(_ => {
            node.selectAll("text")
                .each(function (d) {
                const margin = layoutOptions.margin, pad = layoutOptions.pad;
                const extra = 2 * pad + margin;
                // The width must reset to allow the box to get smaller.
                // Later we will set width based on the width of the line.
                d.width = d.minWidth || 0;
                if (!(d.width)) {
                    d.width = d.minWidth || 0;
                }
                const lineLength = this.offsetWidth;
                if (d.width < lineLength + extra) {
                    d.width = lineLength + extra;
                }
            })
                .each(function (d) {
                // Only update the height, the width is calculated previously
                const height = this.offsetHeight;
                const extra = 2 * layoutOptions.pad + layoutOptions.margin;
                d.height = height === 0 ? 28 + extra : height + extra;
            });
            node.select(".node-HTML-content")
                .attr("width", function (d) {
                return d3.select(this).select("text").node().offsetWidth;
            })
                .attr("y", function (d) {
                const textHeight = d3.select(this).select("text").node().offsetHeight;
                // Minus 2 is a hack to get the text feeling 'right'.
                return d.height / 2 - textHeight / 2 - 2;
            })
                .attr("x", function (d) {
                const textWidth = d3.select(this).select("text").node().offsetWidth;
                const x = d.width / 2 - textWidth / 2;
                d.textPosition = x; // TODO-ya is this redundant now?
                return x;
            });
            link.select("foreignObject")
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
                }
                else {
                    foOnNode
                        .style("opacity", 0);
                }
            });
        });
    }
    /**
     * This function remove the icons from
     * the hover menu
     * @param node element's parent
     */
    function hoverMenuRemoveIcons(parent) {
        if (parent) {
            parent.selectAll(".menu-action").remove();
            parent.selectAll(".menu-shape").remove();
            parent.selectAll(".menu-color").remove();
            parent.selectAll(".menu-trash").remove();
            parent.selectAll(".menu-hover-box").remove();
            // parent.selectAll(".edge-hover-menu").remove();
        }
        else {
            d3.selectAll(".menu-action").remove();
            d3.selectAll(".menu-shape").remove();
            d3.selectAll(".menu-color").remove();
            d3.selectAll(".menu-trash").remove();
            d3.selectAll(".menu-hover-box").remove();
            // d3.selectAll(".edge-hover-menu").remove();
        }
    }
    /**
     * This function adds a menu to
     * Delete, Pin, Change color and Change shape of a node
     * @param node data, node d3 element
     */
    function addHoverMenu(d, me) {
        var element = d3.select(me); // The node
        var parent = d3.select(me.parentNode);
        var foWidth = 30;
        var foHeight = d.height - layoutOptions.margin / 2;
        var foX = d.width - layoutOptions.margin / 2;
        var foY = d.height / 2;
        let currentShape = d.nodeShape;
        let firstShape = true;
        let shapeY = 3 + d.height / 2 - 26;
        hoverMenuRemoveIcons();
        //CREATE SHAPES MENU
        var shapeMenu = parent.append("g")
            .attr('x', -30)
            .attr('y', foY)
            .attr('width', 30)
            .attr('height', foHeight)
            .attr('class', 'menu-shape')
            .on("mouseout", function () {
            var e = d3.event;
            var element = d3.select(this);
            var mouse = d3.mouse(this);
            var mosX = mouse[0];
            var mosY = mouse[1];
            setTimeout(function () {
                if (mosX < -20 || (mosY > d.height - 4 || mosY < 2)) {
                    hoverMenuRemoveIcons(parent);
                }
            }, 50);
        });
        if (currentShape !== "capsule") {
            firstShape = false;
            shapeMenu.append("rect")
                .attr("rx", 6)
                .attr("ry", 6)
                .attr("x", layoutOptions.margin / 2 - 27)
                .attr("y", shapeY)
                .attr("width", 24)
                .attr("height", 21)
                .attr('class', 'menu-shape-rect')
                .attr('fill', '#edfdfd')
                .attr('stroke', '#b8c6c6')
                .attr('stroke-width', 2)
                .on("click", function () {
                hoverMenuRemoveIcons(parent);
                layoutOptions.updateNodeShape && layoutOptions.updateNodeShape(d, "capsule");
            });
        }
        if (currentShape !== "rect") {
            if (!firstShape)
                shapeY = shapeY + 26;
            firstShape = false;
            shapeMenu.append("rect")
                .attr("x", layoutOptions.margin / 2 - 27)
                .attr("y", shapeY)
                .attr("width", 24)
                .attr("height", 21)
                .attr('class', 'menu-shape-rect')
                .attr('fill', '#edfdfd')
                .attr('stroke', '#b8c6c6')
                .attr('stroke-width', 2)
                .on("click", function () {
                hoverMenuRemoveIcons(parent);
                layoutOptions.updateNodeShape && layoutOptions.updateNodeShape(d, "rect");
            });
        }
        if (currentShape !== "circle") {
            if (!firstShape)
                shapeY = shapeY + 36;
            firstShape = false;
            shapeMenu.append("circle")
                .attr("cx", layoutOptions.margin / 2 - 15)
                .attr("cy", shapeY)
                .attr("r", 12)
                .attr('class', 'menu-shape-circle')
                .attr('fill', '#edfdfd')
                .attr('stroke', '#b8c6c6')
                .attr('stroke-width', 2)
                .on("click", function () {
                hoverMenuRemoveIcons(parent);
                layoutOptions.updateNodeShape && layoutOptions.updateNodeShape(d, "circle");
            });
        }
        //CREATE COLOR SELECTOR ICON
        let foColor = parent.append('foreignObject')
            .attr("x", (d.width / 2) - 12)
            .attr("y", -22 + layoutOptions.margin / 2)
            .attr("width", 24)
            .attr("height", 24)
            .style("overflow", "visible")
            .attr('class', 'menu-color');
        let colorPik = foColor.append('xhtml:div')
            .append('div');
        if (d.id.slice(0, 5) === 'note-') {
            colorPik.append('div')
                .html('<div id="controls"><div><i class="fa fa-paint-brush" id="bgpicker"></i></div></div>');
            let colorPickerEl = $("#bgpicker");
            colorPickerEl.css('color', d.color);
            colorPickerEl.css('text-shadow', '1px 0px 6px #1f2d3d');
            colorPickerEl.mouseover(function () {
                layoutOptions.mouseOverRadial && layoutOptions.mouseOverRadial(d);
                let current = {
                    'picker': "#bgpicker",
                    'color': d.color,
                    'graphic': "#brush"
                };
                let yy = colorPickerEl.colpick({
                    color: d.color ? d.color : "#ffffff",
                    onShow: function () {
                        layoutOptions.colorPickerOpen && layoutOptions.colorPickerOpen(d);
                    },
                    onChange: function (hsb, hex, rgb, el, bySetColor) {
                        let newColor = '#' + hex;
                        $("#brush").css("fill", newColor);
                        colorPickerEl.css('background-color', newColor);
                        element.attr('fill', newColor);
                    },
                    onSubmit: function (hsb, hex, rgb, el) {
                        $(el).colpickHide();
                        let newColor = '#' + hex;
                        if (newColor !== d.color) {
                            layoutOptions.updateNodeColor && layoutOptions.updateNodeColor(d, newColor);
                        }
                        hoverMenuRemoveIcons(parent);
                        layoutOptions.colorPickerClose && layoutOptions.colorPickerClose(d);
                    }
                });
            })
                .on("mouseout", function () {
                layoutOptions.mouseOutRadial && layoutOptions.mouseOutRadial(d);
                setTimeout(function () {
                    hoverMenuRemoveIcons(parent);
                }, 50);
            });
        }
        //CREATE TRASH ICON
        var foTrash = parent.append('foreignObject')
            .attr("x", (d.width / 2) - 12)
            .attr("y", d.height + 3 - layoutOptions.margin / 2)
            .attr('class', 'menu-trash')
            .attr("width", 22)
            .attr("height", 27)
            .style("overflow", "visible")
            .on("mouseout", function () {
            var e = d3.event;
            var element = d3.select(this);
            var mouse = d3.mouse(this);
            var mosX = mouse[0];
            var mosY = mouse[1];
            layoutOptions.mouseOutRadial && layoutOptions.mouseOutRadial(d);
            setTimeout(function () {
                if (mosX > d.width / 2 + 11 || mosX < d.width / 2 - 11 || mosY > d.height + 21) {
                    hoverMenuRemoveIcons(parent);
                }
            }, 50);
        });
        var trash = foTrash.append('xhtml:div')
            .append('div')
            .attr('class', 'icon-wrapper')
            .html('<i class="fa fa-trash-o custom-icon"></i>')
            .on("click", function () {
            layoutOptions.nodeRemove && layoutOptions.nodeRemove(d);
            layoutOptions.mouseOutRadial && layoutOptions.mouseOutRadial(d);
        })
            .on("mouseover", function () {
            layoutOptions.mouseOverRadial && layoutOptions.mouseOverRadial(d);
        });
        //CREATE RIGHT MENU
        var fo = parent.append('foreignObject')
            .attr('x', foX + 5)
            .attr('y', foY - 26)
            .attr('width', foWidth)
            .attr('height', 30)
            .attr('class', 'menu-action')
            .style("overflow", "visible")
            .on("mouseover", function () {
            layoutOptions.mouseOverRadial && layoutOptions.mouseOverRadial(d);
        })
            .on("mouseout", function () {
            var e = d3.event;
            var element = d3.select(this);
            var mouse = d3.mouse(this);
            var mosX = mouse[0];
            var mosY = mouse[1];
            layoutOptions.mouseOutRadial && layoutOptions.mouseOutRadial(d);
            setTimeout(function () {
                if (mosX > d.width + 21 || mosY > d.height - 4 || mosY < 2) {
                    hoverMenuRemoveIcons(parent);
                }
            }, 50);
        });
        var div = fo.append('xhtml:div')
            .append('div');
        //CREATE PIN ICON
        var pinIcon = div.append('div').attr('class', 'icon-wrapper');
        if (d.fixed) {
            pinIcon.html('<i class="fa fa-thumb-tack pinned"></i>');
        }
        else {
            pinIcon.html('<i class="fa fa-thumb-tack unpinned"></i>');
        }
        pinIcon.on("click", function () {
            layoutOptions.clickPin && layoutOptions.clickPin(d, element);
            hoverMenuRemoveIcons(parent);
            layoutOptions.mouseOutRadial && layoutOptions.mouseOutRadial(d);
            restart();
        });
        //CREATE DRAW ARROW icon
        div.append('div').attr('class', 'icon-wrapper')
            .html('<i class="fa fa-arrow-right custom-icon"></i>')
            .on("mousedown", function () {
            layoutOptions.startArrow && layoutOptions.startArrow(d, element);
        });
        const parentBBox = parent.node().getBBox();
        parent.insert("rect", "path")
            .attr("x", parentBBox.x - 4)
            .attr("y", parentBBox.y - 2)
            .attr("width", parentBBox.width)
            .attr("height", parentBBox.height)
            .attr("fill", "rgba(0,0,0,0)")
            .attr("class", "menu-hover-box")
            .on("mouseout", (d, i, n) => {
            const elem = n[i];
            const e = d3.event;
            e.preventDefault();
            const mouse = d3.mouse(elem);
            const bbox = elem.getBBox();
            const mosX = mouse[0];
            const mosY = mouse[1];
            if (mosX < bbox.x || mosX > (bbox.width + bbox.x) || mosY > (bbox.height + bbox.y) || mosY < bbox.y) {
                hoverMenuRemoveIcons(parent);
            }
        });
        layoutOptions.mouseOverNode && layoutOptions.mouseOverNode(d, element);
    }
    /**
     * This function delete the node hover menu.
     * It will calculate at which position to the node
     * the menu should be removed
     * @param node data, node d3 element
     */
    function deleteHoverMenu(d, me) {
        var e = d3.event;
        e.preventDefault();
        var element = d3.select(me);
        var parent = d3.select(me.parentNode);
        var mouse = d3.mouse(me.parentElement);
        var mosX = mouse[0];
        var mosY = mouse[1];
        if (mosY < -15 || mosY > d.height + 2 || mosX < -30 || mosX > d.width + 20) {
            hoverMenuRemoveIcons(parent);
        }
        //if (mosX < -20 || mosX > (d.width + 40) || mosY < -15 || mosY > d.height + 10 ||
        //   (mosX < d.width && mosX > d.width / 2 && mosY > 0 && mosY < d.height) ||
        //   (mosX < d.width / 2 && mosX > 0 && mosY > 0 && mosY < d.height)) {
        //   hoverMenuRemoveIcons(parent)
        // }
        layoutOptions.mouseOutNode && layoutOptions.mouseOutNode(d, element);
    }
    /**
     * Update the d3 visuals without layout changes.
     */
    function updateStyles() {
        return new Promise((resolve, reject) => {
            ///// GROUPS /////
            group = group.data(groups);
            const groupEnter = group.enter()
                .append("rect")
                .attr("rx", 8)
                .attr("ry", 8)
                .attr("class", "group")
                .style("fill", "green");
            // .call(simulation.drag);
            group = group.merge(groupEnter);
            /////// NODE ///////
            node = node.data(nodes, d => d.index);
            node.exit().remove();
            const nodeEnter = node.enter()
                .append("g")
                .classed("node", true);
            // Only allow dragging nodes if turned on.
            // if (layoutOptions.canDrag()) {
            nodeEnter.attr("cursor", "move").call(drag); // Drag controlled by filter.
            // } else {
            //     nodeEnter.attr("cursor", "default");
            // }
            // Here we add node beauty.
            // To fit nodes to the short-name calculate BBox
            // from https://bl.ocks.org/mbostock/1160929
            const textBox = nodeEnter.append("foreignObject")
                .attr("pointer-events", "none")
                .classed("node-HTML-content", true)
                .attr("width", 1)
                .attr("height", 1)
                .style("overflow", "visible")
                .append("xhtml:div")
                .attr("xmlns", "http://www.w3.org/1999/xhtml")
                .append("text");
            textBox
                .attr("contenteditable", "true")
                .attr("tabindex", "-1")
                .attr("class", d => d.class)
                .attr("pointer-events", "none")
                .style("cursor", "text")
                .style("text-align", "center")
                .style("display", "inline-block")
                .style("font", "100 22px Helvetica Neue")
                .style("white-space", "pre");
            // .html(function (d) {
            //     return d.shortname || d.hash;
            // });
            // Choose the node shape and style.
            let nodeShape;
            nodeShape = nodeEnter.insert("path", "foreignObject");
            if (typeof layoutOptions.nodeShape == "string" && layoutOptions.nodeShape == "rect") {
                // nodeShape = nodeEnter.insert("rect", "text")     // The second arg is what the rect will sit behind.
                nodeShape.attr("d", "M16 48 L48 48 L48 16 L16 16 Z");
            }
            else if (typeof layoutOptions.nodeShape == "string" && layoutOptions.nodeShape == "circle") {
                // Circle path technique from:
                // http://stackoverflow.com/a/10477334/6421793
                nodeShape.attr("d", "M20,40a20,20 0 1,0 40,0a20,20 0 1,0 -40,0");
            }
            else if (typeof layoutOptions.nodeShape == "function") {
                nodeShape.attr("d", layoutOptions.nodeShape);
            }
            nodeShape.attr("vector-effect", "non-scaling-stroke");
            // nodeEnter.append("foreignObject")
            //     .classed("node-status-icons", true)
            //     .append('xhtml:div')
            //     .append('div')
            //     .html('<i class="fa fa-thumb-tack"></i>');
            // Merge the entered nodes to the update nodes.
            node = node.merge(nodeEnter)
                .classed("fixed", d => d.fixed || false);
            /**
             * Update the text property (allowing dynamically changing text)
             */
            const textSelect = node.select("text")
                .html(function (d) {
                return d.shortname || d.hash;
            })
                .attr("class", d => d.class);
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
            updateShapes.on("mouseover", function (d) {
                if (internalOptions.isDragging) {
                    return;
                }
                addHoverMenu(d, this);
            }).on("mouseout", function (d) {
                if (internalOptions.isDragging) {
                    return;
                }
                deleteHoverMenu(d, this);
            }).on("click", function (d) {
                const elem = d3.select(this);
                setTimeout(() => {
                    layoutOptions.clickNode(d, elem);
                }, 50);
            }).on("mouseup", function (d) {
                layoutOptions.mouseUpNode && layoutOptions.mouseUpNode(d, d3.select(this));
            }).on("mousedown", function (d) {
                if ((layoutOptions.canDrag === undefined) || (layoutOptions.canDrag())) {
                    return;
                }
                layoutOptions.mouseDownNode && layoutOptions.mouseDownNode(d, d3.select(this));
            });
            /////// LINK ///////
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
                .attr("stroke-width", layoutOptions.edgeStroke)
                .attr("stroke", layoutOptions.edgeColor)
                .attr("fill", "none")
                .attr("marker-end", d => `url(#arrow-${typeof layoutOptions.edgeColor == "string" ? layoutOptions.edgeColor : layoutOptions.edgeColor(d.edgeData)})`);
            linkEnter.on("mouseenter", function (d) {
                addEdgeHoverMenu(d, this);
            }).on("mouseleave", function (d) {
                deleteEdgeHoverMenu(d, this);
            }).on("click", function (d) {
                const elem = d3.select(this);
                setTimeout(() => {
                    layoutOptions.clickEdge(d, elem);
                }, 50);
            });
            // Add an empty text field.
            linkEnter
                .append("foreignObject")
                .attr("width", 1)
                .attr("height", 1)
                .style("overflow", "visible")
                .append("xhtml:div")
                .attr("xmlns", "http://www.w3.org/1999/xhtml")
                .append("text")
                .attr("contenteditable", "true")
                .attr("tabindex", "-1")
                .style("display", "inline-block")
                .style("text-align", "center")
                .style("font", "100 22px Helvetica Neue")
                .style("white-space", "pre")
                .style("background-color", "white")
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
            return resolve();
        });
    }
    /**
     * restart function adds and removes nodes.
     * It also restarts the simulation.
     * This is where aesthetics can be changed.
     */
    function restart(callback) {
        // Todo: Promise chain.
        return Promise.resolve()
            .then(() => {
            if (callback === "NOUPDATE") {
                return;
            }
            else {
                return updateStyles();
            }
        })
            .then(repositionText)
            .then(_ => {
            /**
             * Helper function for drawing the lines.
             * Adds quadratic curve to smooth corners in line
             */
            const lineFunction = points => {
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
                    }
                    else {
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
                    }
                    else {
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
                }
                catch (err) {
                    console.error(err);
                    return;
                }
                try {
                    link.selectAll("path").attr("d", d => lineFunction(simulation.routeEdge(d, undefined)));
                }
                catch (err) {
                    console.error(err);
                    return;
                }
                try {
                    if (isIE())
                        link.selectAll("path").each(function (d) {
                            this.parentNode.insertBefore(this, this);
                        });
                }
                catch (err) {
                    console.log(err);
                    return;
                }
                link.select("text").attr("x", d => {
                    const arrayX = simulation.routeEdge(d, undefined);
                    const middleIndex = Math.floor(arrayX.length / 2) - 1;
                    return (arrayX[middleIndex].x + arrayX[middleIndex + 1].x) / 2;
                }).attr("y", d => {
                    const arrayY = simulation.routeEdge(d, undefined);
                    const middleIndex = Math.floor(arrayY.length / 2) - 1;
                    return (arrayY[middleIndex].y + arrayY[middleIndex + 1].y) / 2;
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
                    }
                    catch (err) {
                        console.error(err);
                        return;
                    }
                    return lineFunction([route.sourceIntersection, route.arrowStart]);
                });
                if (isIE())
                    link.each(function (d) {
                        this.parentNode.insertBefore(this, this);
                    });
                link.select("foreignObject")
                    .attr("x", (d, i, n) => {
                    const textWidth = d3.select(n[i]).select("text").node().offsetWidth;
                    let route;
                    try {
                        route = cola.makeEdgeBetween(d.source.innerBounds, d.target.innerBounds, 5);
                    }
                    catch (err) {
                        console.error(err);
                        return 0;
                    }
                    return (route.sourceIntersection.x + route.targetIntersection.x - textWidth) / 2;
                })
                    .attr("y", (d, i, n) => {
                    const textHeight = d3.select(n[i]).select("text").node().offsetHeight;
                    let route;
                    try {
                        route = cola.makeEdgeBetween(d.source.innerBounds, d.target.innerBounds, 5);
                    }
                    catch (err) {
                        console.error(err);
                        return 0;
                    }
                    return (route.sourceIntersection.y + route.targetIntersection.y - textHeight) / 2;
                });
                group.attr("x", function (d) {
                    return d.bounds.x;
                })
                    .attr("y", function (d) {
                    return d.bounds.y;
                })
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
        })
            .then(() => typeof callback === "function" && callback());
    }
    // Helper function for updating links after node mutations.
    // Calls a function after links added.
    function createNewLinks(callback) {
        tripletsDB.get({}, (err, l) => {
            if (err) {
                console.error(err);
            }
            // Create edges based on LevelGraph triplets
            links = l.map(({ subject, object, predicate }) => {
                const source = nodeMap.get(subject);
                const target = nodeMap.get(object);
                predicateMap.set(predicate.hash, predicate); // update predicateMap to match new link object
                return { source, target, predicate };
            });
            restart(callback);
        });
    }
    /**
     * Take a node object or list of nodes and add them.
     * @param {object | object[]} nodeObject
     */
    function addNode(nodeObjectOrArray, callback, preventLayout) {
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
        }
        else {
            addNodeObjectHelper(nodeObjectOrArray);
        }
        // Draw the changes, and either fire callback or pass it on to restart.
        if (!preventLayout) {
            restart(callback);
        }
        else {
            typeof callback === "function" && callback();
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
     */
    function addTriplet(tripletObject, callback, preventLayout) {
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
            const edgeColor = typeof layoutOptions.edgeColor == "string" ? layoutOptions.edgeColor : layoutOptions.edgeColor(predicate);
            if (!predicateTypeToColorMap.has(edgeColor)) {
                predicateTypeToColorMap.set(edgeColor, true);
                // Create an arrow head for the new color
                createColorArrow_1.default(defs, edgeColor);
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
            if (!preventLayout) {
                createNewLinks(callback);
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
     */
    function removeTriplet(tripletObject, callback) {
        if (!tripletValidation(tripletObject)) {
            return;
        }
        // Node needs a unique hash associated with it.
        const subject = tripletObject.subject, predicate = tripletObject.predicate, object = tripletObject.object;
        // Check that predicate doesn't already exist
        new Promise((resolve, reject) => tripletsDB.del({
            subject: subject.hash,
            predicate: predicate,
            object: object.hash
        }, function (err) {
            if (err)
                reject(err);
            resolve();
        })).then(() => {
            // Add nodes to graph
            predicateMap.delete(predicate.hash);
            simulation.stop();
            createNewLinks(callback);
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
                    nodeMap.delete(nodeHash);
                    createNewLinks(callback);
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
                    createNewLinks(callback);
                });
            });
        });
    }
    /**
     * Function that fires when a node is clicked.
     * @param {function} selectNodeFunc
     */
    function setSelectNode(selectNodeFunc) {
        layoutOptions.clickNode = selectNodeFunc;
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
            }
            else {
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
            }
            else {
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
                    }
                    else {
                        node.filter(d => d.id === id).select("path").attr("fill", values[0]);
                    }
                });
                break;
            }
            case "nodeShape": {
                const shapePaths = values.map(v => layoutOptions.nodeShape({ nodeShape: v }));
                editNodeHelper(prop);
                idArray.forEach((id, i) => {
                    if (multipleValues) {
                        node.filter(d => d.id === id).select("path").attr("d", shapePaths[i]);
                    }
                    else {
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
            case "shortname": {
                editNodeHelper(prop);
                restart();
                break;
            }
            default: {
                editNodeHelper(prop);
                console.warn("Caution. You are modifying a new or unknown property: %s.", action.property);
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
    // Function called when mousedown on node.
    function setMouseDown(mouseDownCallback) {
        layoutOptions.mouseDownNode = mouseDownCallback;
    }
    /**
     * Merges a node into another group.
     * If this node was in another group previously it removes it from the prior group.
     */
    function mergeNodeToGroup(nodeInGroupHash, nodeToMergeHash, callback) {
        console.error("THIS FEATURE IS NOT READY");
        console.error("USE AT YOUR OWN RISK!");
        /**
         * Groups need to be defined using indexes.
         */
        let indexOfGroupNode = -1;
        let indexOfNodeToMerge = -1;
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].hash == nodeInGroupHash) {
                indexOfGroupNode = i;
            }
            if (nodes[i].hash == nodeToMergeHash) {
                indexOfNodeToMerge = i;
            }
            if (indexOfGroupNode !== -1 && indexOfNodeToMerge !== -1) {
                break;
            }
        }
        // Verify that the initial node exists.
        if (indexOfGroupNode == -1) {
            return console.error("You're trying to merge with a node that doesn't exist. Check that the node hash is correct.");
        }
        if (indexOfNodeToMerge == -1) {
            return console.error("The node you are trying to merge doesn't exist. Check the node hash is correct or add the node to the graph.");
        }
        // Find the set that the merge node is part of.
        // Also remove the node we're merging from any sets it might be in.
        let indexInSets = -1;
        groupByHashes.forEach((set, index) => {
            if (set.has(nodeInGroupHash)) {
                indexInSets = index;
                set.add(nodeToMergeHash);
            }
            if (set.has(nodeToMergeHash) && !set.has(nodeInGroupHash)) {
                set.delete(nodeToMergeHash);
            }
        });
        if (indexInSets === -1) {
            // Create a new grouping.
            groupByHashes.push(new Set([nodeToMergeHash, nodeInGroupHash]));
        }
        simulation.stop();
        // Here we create a new group object with the updated group unions.
        const newGroupObject = [];
        groupByHashes.forEach(set => {
            const indexOfSet = [];
            const setArray = [...set];
            let nodeIndex;
            for (let i = 0; i < setArray.length; i++) {
                nodeIndex = nodeMap.get(setArray[i]).index;
                indexOfSet.push(nodeIndex);
            }
            // Create and push an object with the indexes of the nodes.
            newGroupObject.push({ leaves: indexOfSet });
        });
        groups = newGroupObject;
        restart(callback);
    }
    // function deleteEdgeHoverMenu(d, me) { // incomplete
    //     const e = d3.event;
    //     e.preventDefault();
    //     const element = d3.select(me);
    //     const parent = d3.select(me.parentNode);
    //     const mouse = d3.mouse(me);
    //     // console.log(me)
    //     const mosX = mouse[0];
    //     var mosY = mouse[1];
    //     // console.log(mosX, mouse)
    //     if (mosY < -15) {
    //         hoverMenuRemoveIcons(parent);
    //     }
    // }
    // function addEdgeHoverMenu(d, me) { // incomplete
    //     hoverMenuRemoveIcons();
    //     let element = d3.select(me);
    //     let parent = d3.select(me.parentNode);
    //     let textBox = element.select("text");
    //     const array = simulation.routeEdge(d, undefined);
    //     const middleIndex = Math.floor(array.length / 2) - 1;
    //     const Xmid = (array[middleIndex].x + array[middleIndex + 1].x) / 2;
    //     const Ymid = (array[middleIndex].y + array[middleIndex + 1].y) / 2;
    //     const menuGroup = element.insert("g", "path")
    //         .attr("class", "edge-hover-menu");
    //
    //     // //CREATE TRASH ICON
    //     // var foTrash = element
    //     //     .append('foreignObject')
    //     //     .attr("x", Xmid)
    //     //     .attr("y", Ymid + 15)
    //     //     .attr('class', 'menu-trash')
    //     //     .attr("width", 22)
    //     //     .attr("height", 27)
    //     //     .style("overflow", "visible")
    //     //     .on("click", function () {
    //     //         console.log("cc")
    //     //         const edge = {
    //     //             subject: d.source,
    //     //             predicate: d.predicate,
    //     //             object: d.target
    //     //         };
    //     //         layoutOptions.edgeRemove && layoutOptions.edgeRemove(edge);
    //     //         // layoutOptions.mouseOutRadial && layoutOptions.mouseOutRadial(d);
    //     //     })
    //
    //     // .on("mouseout", function () {
    //     //     var e = d3.event;
    //     //     var element = d3.select(this);
    //     //     var mouse = d3.mouse(this);
    //     //     var mosX = mouse[0];
    //     //     var mosY = mouse[1];
    //     //     layoutOptions.mouseOutRadial && layoutOptions.mouseOutRadial(d);
    //     //     setTimeout(function () {
    //     //         if (mosX > d.width / 2 + 11 || mosX < d.width / 2 - 11 || mosY > d.height + 21) {
    //     //             hoverMenuRemoveIcons(menuGroup);
    //     //         }
    //     //     }, 50);
    //     // });
    //     // var trash = foTrash.append('xhtml:div')
    //     //     .append('div')
    //     //     .attr('class', 'icon-wrapper')
    //     //     .html('<i class="fa fa-trash-o custom-icon"></i>')
    //     //
    //     //
    //     // // .on("mouseover", function () {
    //     // //     layoutOptions.mouseOverRadial && layoutOptions.mouseOverRadial(d);
    //     // // });
    //
    // }
    function addEdgeHoverMenu(d, me) {
        return;
    }
    function deleteEdgeHoverMenu(d, me) {
        return;
    }
    /**
     * Serialize the graph.
     * scheme: triplets: subj:hash-predicateType-obj:hash[]
     *         nodes: hash[]
     */
    const saveGraph = (callback) => {
        d3.selectAll(".radial-menu").remove();
        tripletsDB.get({}, (err, l) => {
            const saved = JSON.stringify({
                triplets: l.map(v => ({ subject: v.subject, predicate: v.predicate, object: v.object })),
                nodes: nodes.map(v => ({ hash: v.hash, x: v.x, y: v.y }))
            });
            callback(saved);
        });
    };
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
    /**
     * Transform client coordiantes to transformed SVG coordiantes
     * @param {number} x clientX
     * @param {number} y clientY
     * @returns {{x: number; y: number}}
     */
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
        // Get edge from predicateMap
        getPredicate: (hash) => predicateMap.get(hash),
        // Get Stringified representation of the graph.
        saveGraph,
        // Get SVG element. If you want the node use `graph.getSVGElement().node();`
        getSVGElement: () => svg,
        // add a directed edge
        addTriplet,
        // remove an edge
        removeTriplet,
        // update edge data in database
        updateTriplet,
        // EXPERIMENTAL - DONT USE YET.
        mergeNodeToGroup,
        // remove a node and all edges connected to it.
        removeNode,
        // add a node or array of nodes.
        addNode,
        // edit node property
        editNode,
        // edit edge property
        editEdge,
        // Restart styles or layout.
        restart: {
            styles: updateStyles,
            textAlign: repositionText,
            redrawEdges: createNewLinks,
            layout: restart,
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
            setClickNode: setSelectNode,
            setMouseOver,
            setMouseOut,
            setMouseDown,
        },
        // Handler for clicking on the edge.
        edgeOptions: {
            setClickEdge: (callback) => {
                layoutOptions.clickEdge = callback;
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
                    }
                    else {
                        layoutOptions.layoutType = "flowLayout";
                        simulation = updateColaLayout_1.updateColaLayout(layoutOptions);
                    }
                    restart(callback);
                },
                right: (callback) => {
                    layoutOptions.flowDirection = "x";
                    if (layoutOptions.layoutType == "flowLayout") {
                        simulation.flowLayout(layoutOptions.flowDirection, layoutOptions.edgeLength);
                    }
                    else {
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
//# sourceMappingURL=networkViz.js.map