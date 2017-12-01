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
        pad: 5,
        margin: 10,
        canDrag: () => true,
        nodeDragStart: undefined,
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
        nodeToColor: "white",
        nodeStrokeWidth: 1,
        nodeStrokeColor: "grey",
        // TODO: clickNode (node, element) => void
        clickNode: (node) => console.log("clicked", node),
        clickAway: () => undefined,
        edgeColor: "black",
        edgeStroke: 2,
        edgeLength: d => {
            console.log(`length`, d);
            return 150;
        },
        clickEdge: (d, element) => undefined,
    };
    const X = 37;
    const Y = -13;
    const p1x = 25 + X;
    const p1y = 25 + Y;
    const p2x = 75 + X;
    const p3x = 100 + X;
    const p4y = 50 + Y;
    var d0 = "M16 48 L48 48 L48 16 L16 16 Z", //RECT
    d1 = "M20,40a20,20 0 1,0 40,0a20,20 0 1,0 -40,0", //CIRCLE
    // d2 = "M148.1,310.5h-13.4c-4.2,0-7.7-3.4-7.7-7.7v-7.4c0-4.2,3.4-7.7,7.7-7.7h13.4c4.2,0,7.7,3.4,7.7,7.7v7.4  C155.7,307.1,152.3,310.5,148.1,310.5z"; //CAPSULE
    d2 = `M ${p1x} ${p1y} L ${p2x} ${p1y} C ${p3x} ${p1y} ${p3x} ${p4y} ${p2x} ${p4y} L ${p1x} ${p4y} C ${X} ${p4y} ${X} ${p1y} ${p1x} ${p1y} `; //CAPSULE
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
    drag.on("start", () => {
        layoutOptions.nodeDragStart && layoutOptions.nodeDragStart();
        internalOptions.isDragging = true;
    }).on("end", () => {
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
        node.select("path")
            .attr("transform", function (d) {
            // Scale appropriately using http://stackoverflow.com/a/9877871/6421793
            const currentWidth = this.getBBox().width, w = d.width, currentHeight = this.getBBox().height, h = d.height, scaleW = w / currentWidth, scaleH = h / currentHeight;
            if (isNaN(scaleW) || isNaN(scaleH) || isNaN(w) || isNaN(h)) {
                return "";
            }
            return `translate(${-w / 2},${-h / 2}) scale(${scaleW},${scaleH})`;
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
            node.select("text").each(function (d) {
                const text = d3.select(this);
                const margin = layoutOptions.margin, pad = layoutOptions.pad;
                const extra = 2 * margin + 2 * pad;
                // The width must reset to allow the box to get smaller.
                // Later we will set width based on the widest tspan/line.
                d.width = d.minWidth || 0;
                if (!(d.width)) {
                    d.width = d.minWidth || 0;
                }
                // Loop over the tspans and recalculate the width based on the longest text.
                text.selectAll("tspan").each(function (d) {
                    const lineLength = this.getComputedTextLength();
                    if (d.width < lineLength + extra) {
                        d.width = lineLength + extra;
                    }
                });
            }).each(function (d) {
                // Only update the height, the width is calculated
                // by iterating over the tspans in the `wrap` function.
                const b = this.getBBox();
                const extra = 2 * margin + 2 * pad;
                d.height = b.height + extra;
            })
                .attr("y", function (d) {
                const b = d3.select(this).node().getBBox();
                // Todo: Minus 2 is a hack to get the text feeling 'right'.
                return d.height / 2 - b.height / 2 - 2;
            })
                .attr("x", function (d) {
                // Apply the correct x value to the tspan.
                const b = this.getBBox();
                const x = d.width / 2 - b.width / 2;
                d.textPosition = x;
                // We don't set the tspans with an x attribute.
                d3.select(this).selectAll("tspan")
                    .attr("x", d.textPosition);
                return d.textPosition;
            });
            d3.selectAll("#graph .node").each(function (d) {
                const node = d3.select(this);
                const foOnNode = node.selectAll('.node-status-icons');
                var pined = layoutOptions.nodeToPin && layoutOptions.nodeToPin(d);
                if (pined) {
                    foOnNode
                        .attr('x', d => d.width / 2 || 0)
                        .attr('y', 0)
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
            parent.selectAll('.menu-action').remove();
            parent.selectAll('.menu-shape').remove();
            parent.selectAll('.menu-color').remove();
            parent.selectAll('.menu-trash').remove();
        }
        else {
            d3.selectAll('.menu-action').remove();
            d3.selectAll('.menu-shape').remove();
            d3.selectAll('.menu-color').remove();
            d3.selectAll('.menu-trash').remove();
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
        var foWidth = 40;
        var foHeight = d.height;
        var foX = d.width;
        var foY = 0;
        let currentShape = d.nodeShape;
        let firstShape = true;
        let shapeY = 3;
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
                .attr("x", -27)
                .attr("y", shapeY)
                .attr("width", 24)
                .attr("height", 21)
                .attr('class', 'menu-shape-rect')
                .attr('fill', '#edfdfd')
                .attr('stroke', '#b8c6c6')
                .attr('stroke-width', 2)
                .on("click", function () {
                hoverMenuRemoveIcons(parent);
                parent.selectAll('path').remove();
                parent.insert("path", "text")
                    .attr("d", d2);
                d.nodeShape = "capsule";
                layoutOptions.updateNodeShape && layoutOptions.updateNodeShape(d);
                updateStyles();
            });
        }
        if (currentShape !== "rect") {
            if (!firstShape)
                shapeY = shapeY + 26;
            firstShape = false;
            shapeMenu.append("rect")
                .attr("x", -27)
                .attr("y", shapeY)
                .attr("width", 24)
                .attr("height", 21)
                .attr('class', 'menu-shape-rect')
                .attr('fill', '#edfdfd')
                .attr('stroke', '#b8c6c6')
                .attr('stroke-width', 2)
                .on("click", function () {
                hoverMenuRemoveIcons(parent);
                parent.selectAll('path').remove();
                parent.insert("path", "text")
                    .attr("d", d0);
                d.nodeShape = "rect";
                layoutOptions.updateNodeShape && layoutOptions.updateNodeShape(d);
                updateStyles();
            });
        }
        if (currentShape !== "circle") {
            if (!firstShape)
                shapeY = shapeY + 36;
            firstShape = false;
            shapeMenu.append("circle")
                .attr("cx", -15)
                .attr("cy", shapeY)
                .attr("r", 12)
                .attr('class', 'menu-shape-circle')
                .attr('fill', '#edfdfd')
                .attr('stroke', '#b8c6c6')
                .attr('stroke-width', 2)
                .on("click", function () {
                hoverMenuRemoveIcons(parent);
                parent.selectAll('path').remove();
                parent.insert("path", "text")
                    .attr("d", d1);
                d.nodeShape = "circle";
                layoutOptions.updateNodeShape && layoutOptions.updateNodeShape(d);
                updateStyles();
            });
        }
        //CREATE COLOR SELECTOR ICON
        var foColor = parent.append('foreignObject')
            .attr("x", (d.width / 2) - 12)
            .attr("y", -28)
            .attr('class', 'menu-color');
        var colorPik = foColor.append('xhtml:div')
            .append('div');
        if (d.id.slice(0, 5) === 'note-') {
            colorPik.append('div')
                .html('<div id="controls"><div><span data-type="color" id="bgpicker" /></span></div></div>');
            $("#bgpicker").css('background-color', d.color);
            colorPik.on("click", function () {
                layoutOptions.mouseOverRadial && layoutOptions.mouseOverRadial(d);
                var current = {
                    'picker': "#bgpicker",
                    'color': d.color,
                    'graphic': "#brush"
                };
                $("#bgpicker").colpick({
                    color: d.color,
                    onChange: function (hsb, hex, rgb, el, bySetColor) {
                        var newColor = '#' + hex;
                        $("#brush").css("fill", newColor);
                        $("#bgpicker").css('background-color', newColor);
                        d.color = newColor;
                        element.attr('fill', newColor);
                        layoutOptions.updateNodeColor && layoutOptions.updateNodeColor(d);
                    },
                    onSubmit: function (hsb, hex, rgb, el) {
                        $(el).colpickHide();
                        hoverMenuRemoveIcons(parent);
                    }
                }).css('background-color', d.color);
            })
                .on("mouseout", function () {
                setTimeout(function () {
                    hoverMenuRemoveIcons(parent);
                }, 50);
            });
        }
        //CREATE TRASH ICON
        var foTrash = parent.append('foreignObject')
            .attr("x", (d.width / 2) - 12)
            .attr("y", d.height + 2)
            .attr('class', 'menu-trash')
            .on("mouseout", function () {
            var e = d3.event;
            var element = d3.select(this);
            var mouse = d3.mouse(this);
            var mosX = mouse[0];
            var mosY = mouse[1];
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
            console.log("clicked");
            layoutOptions.nodeRemove && layoutOptions.nodeRemove(d);
        })
            .on("mouseover", function () {
            layoutOptions.mouseOverRadial && layoutOptions.mouseOverRadial(d);
        });
        //CREATE RIGHT MENU
        var fo = parent.append('foreignObject')
            .attr('x', foX + 5)
            .attr('y', foY)
            .attr('width', foWidth)
            .attr('height', foHeight)
            .attr('class', 'menu-action')
            .on("mouseout", function () {
            var e = d3.event;
            var element = d3.select(this);
            var mouse = d3.mouse(this);
            var mosX = mouse[0];
            var mosY = mouse[1];
            setTimeout(function () {
                if (mosX > d.width + 21 || mosY > d.height - 4 || mosY < 2) {
                    hoverMenuRemoveIcons(parent);
                }
            }, 50);
        });
        var div = fo.append('xhtml:div')
            .append('div')
            .on("mouseover", function () {
            layoutOptions.mouseOverRadial && layoutOptions.mouseOverRadial(d);
        });
        //CREATE PIN ICON
        var pinIcon = div.append('div');
        if (d.fixed) {
            pinIcon.html('<i class="fa fa-thumb-tack pinned"></i>');
        }
        else {
            pinIcon.html('<i class="fa fa-thumb-tack unpinned"></i>');
        }
        pinIcon.on("click", function () {
            if (!d.fixed) {
                d.fixed = true; // eslint-disable-line no-param-reassign
            }
            else {
                d.fixed = false; // eslint-disable-line no-param-reassign
            }
            layoutOptions.clickPin && layoutOptions.clickPin(d, element);
            hoverMenuRemoveIcons(parent);
            restart();
        });
        //CREATE DRAW ARROW icon
        div.append('div')
            .html('<i class="fa fa-arrow-right custom-icon"></i>')
            .on("mousedown", function () {
            layoutOptions.startArrow && layoutOptions.startArrow(d, element);
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
            nodeEnter.append("text")
                .attr("dx", 0)
                .attr("dy", 0)
                .attr("text-anchor", "left")
                .style("font", "100 22px Helvetica Neue");
            // Choose the node shape and style.
            let nodeShape;
            nodeShape = nodeEnter.insert("path", "text");
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
             * Check if the d.shortname is a list.
             */
            const textSelect = node.select("text")
                .text(undefined)
                .attr("class", d => d.class)
                .each(function (d) {
                // This function takes the text element.
                // We can call .each on it and build up
                // the tspan elements from the array of text
                // in the data.
                // Derived from https://bl.ocks.org/mbostock/7555321
                const margin = layoutOptions.margin, pad = layoutOptions.pad;
                const extra = 2 * margin + 2 * pad;
                const text = d3.select(this);
                /**
                 * If no shortname, then use hash.
                 */
                let tempText = d.shortname || d.hash;
                if (!Array.isArray(tempText)) {
                    tempText = [tempText];
                }
                const textCopy = tempText.slice(), words = textCopy.reverse(), lineheight = 1.1, // em
                lineNumber = 0, dy = parseFloat(text.attr("dy")) || 0;
                let word, 
                // TODO: I don't know why there needs to be a undefined tspan at the start?
                tspan = text.text(undefined).append("tspan").attr("dy", dy + "em");
                while (word = words.pop()) {
                    tspan = text.append("tspan")
                        .attr("dy", lineheight + "em")
                        .attr("x", d.textPosition || (d.width / 2) || 0)
                        .text(word);
                }
            })
                .attr("pointer-events", "none");
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
                let elem = d3.select(this);
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
                .attr("stroke-width", layoutOptions.edgeStroke * 10)
                .attr("stroke", 'rgba(0, 0, 0, 0)')
                .attr("fill", "none");
            linkEnter.append("path")
                .attr("stroke-width", layoutOptions.edgeStroke)
                .attr("stroke", layoutOptions.edgeColor)
                .attr("fill", "none")
                .attr("marker-end", d => `url(#arrow-${typeof layoutOptions.edgeColor == "string" ? layoutOptions.edgeColor : layoutOptions.edgeColor(d.edgeData)})`);
            linkEnter.on("click", function (d) {
                const elem = d3.select(this);
                setTimeout(() => {
                    layoutOptions.clickEdge(d, elem);
                }, 50);
            });
            // Add an empty text field.
            linkEnter.append("text")
                .attr("text-anchor", "middle")
                .style("font", "100 22px Helvetica Neue")
                .text(undefined);
            link = link.merge(linkEnter);
            /** Optional label text */
            if (typeof layoutOptions.edgeLabelText === "function") {
                link.select("text").text((d) => {
                    if (typeof d.edgeData.hash === "string") {
                        return layoutOptions.edgeLabelText(predicateMap.get(d.edgeData.hash));
                    }
                    return layoutOptions.edgeLabelText(d.edgeData);
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
            .then(updateStyles)
            .then(repositionText)
            .then(_ => {
            /**
             * Helper function for drawing the lines.
             */
            const lineFunction = d3.line()
                .x(d => d.x)
                .y(d => d.y);
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
                link.select("text")
                    .attr("x", d => {
                    let route;
                    try {
                        route = cola.makeEdgeBetween(d.source.innerBounds, d.target.innerBounds, 5);
                    }
                    catch (err) {
                        console.error(err);
                        return 0;
                    }
                    return (route.sourceIntersection.x + route.targetIntersection.x) / 2;
                })
                    .attr("y", d => {
                    let route;
                    try {
                        route = cola.makeEdgeBetween(d.source.innerBounds, d.target.innerBounds, 5);
                    }
                    catch (err) {
                        console.error(err);
                        return 0;
                    }
                    return (route.sourceIntersection.y + route.targetIntersection.y) / 2;
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
            links = l.map(({ subject, object, edgeData }) => {
                const source = nodeMap.get(subject);
                const target = nodeMap.get(object);
                predicateMap.set(edgeData.hash, edgeData); //TODO bandaid fix for predicatemap objects =/= links objects
                return { source, target, edgeData };
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
            return;
        }
        // Node needs a unique hash associated with it.
        const subject = tripletObject.subject, predicate = tripletObject.predicate, object = tripletObject.object;
        // Check that predicate doesn't already exist
        new Promise((resolve, reject) => tripletsDB.get({
            subject: subject.hash,
            predicate: predicate.type,
            object: object.hash
        }, function (err, list) {
            if (err)
                reject(err);
            resolve(list.length === 0);
        })).then(doesntExist => {
            if (!doesntExist) {
                console.warn("That edge already exists. Hash's and predicate type needs to be unique!");
                return;
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
            /**
             * Put the triplet into the LevelGraph database
             * and mutates the d3 nodes and links list to
             * visually pop on the node/s.
             */
            tripletsDB.put({
                subject: subject.hash,
                predicate: predicate.type,
                object: object.hash,
                edgeData: predicate
            }, (err) => {
                if (err) {
                    console.error(err);
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
            });
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
            predicate: predicate.type,
            object: object.hash
        }, function (err) {
            if (err)
                reject(err);
            resolve();
        })).then(() => {
            // Add nodes to graph
            simulation.stop();
            createNewLinks(callback);
        });
    }
    /**
     *  Update edge data. Fails silently if doesnt exist
     * @param {object} tripletObject
     */
    function updateTriplet(tripletObject) {
        // if (predicateMap.has(tripletObject.edgeData.hash)) {
        // predicateMap.set(tripletObject.edgeData.hash, tripletObject.edgeData); // TODO not needed if fix in createNewLinks is kept
        tripletsDB.del({ subject: tripletObject.subject, object: tripletObject.object }, (err) => {
            if (err) {
                console.log(err);
            }
            tripletsDB.put(tripletObject, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        });
        // }
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
    /**
     * Serialize the graph.
     * scheme: triplets: subj:hash-predicateType-obj:hash[]
     *         nodes: hash[]
     */
    const saveGraph = (callback) => {
        d3.selectAll('.radial-menu').remove();
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
    const transformCoordinates = ({ x, y }) => {
        let screenPoint = svg.node().createSVGPoint();
        screenPoint.x = x;
        screenPoint.y = y;
        let CTM = g.node().getScreenCTM();
        let point = screenPoint.matrixTransform(CTM.inverse());
        return {
            x: point.x,
            y: point.y
        };
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
        // Get Stringified representation of the graph.
        saveGraph,
        // Get SVG element. If you want the node use `graph.getSVGElement().node();`
        getSVGElement: () => svg,
        // Transform client coordinates into SVG coordinates
        transformCoordinates,
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