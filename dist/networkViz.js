"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = networkVizJS;

var _d = require("d3");

var _d2 = _interopRequireDefault(_d);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * A graph is just a large object with endpoints that
 * can be pressed with side effects.
 */
var cola = require("webcola");
var levelgraph = require("levelgraph");
var level = require("level-browserify");

function networkVizJS(documentId) {
    var userLayoutOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


    /**
     * Default options for webcola
     */
    var defaultLayoutOptions = {
        layoutType: "flowLayout", // Define webcola length layout algorithm
        avoidOverlaps: true,
        handleDisconnected: false,
        flowDirection: "y",
        enableEdgeRouting: true,
        nodeShape: "circle"
    };

    /**
     * This creates the default object, and then overwrites any parameters
     * with the user parameters.
     */
    // let layoutOptions = {
    //     ...defaultLayoutOptions,
    //     ...userLayoutOptions
    // }
    var layoutOptions = defaultLayoutOptions;

    if (typeof documentId !== "string" || documentId === "") {
        throw new Error("Document Id passed into graph isn't a string.");
    }

    /**
     *  Options
     * TODO: wrap validation on each of the settings
     */
    var options = {
        // Set this as a function that transforms the node -> color string
        nodeToColor: undefined,
        clickNode: function clickNode(node) {
            return console.log("clicked", node);
        },
        clickAway: function clickAway() {
            return console.log("clicked away from stuff");
        },
        edgeColor: function edgeColor() {
            return "black";
        },
        edgeStroke: undefined,
        edgeLength: function edgeLength(d) {
            console.log("length", d);return 150;
        }
    };

    /**
     * nodeMap allows hash lookup of nodes.
     */
    var nodeMap = new Map();
    var predicateTypeToColorMap = new Map();
    var tripletsDB = levelgraph(level("Userdb-" + Math.random() * 100));
    var nodes = [];
    var links = [];
    var mouseCoordinates = [0, 0];

    var width = 900,
        height = 600,
        margin = 10,
        pad = 12;

    // Here we are creating a responsive svg element.
    var svg = _d2.default.select("#" + documentId).append("div").classed("svg-container", true).append("svg").attr("preserveAspectRatio", "xMinYMin meet").attr("viewBox", "0 0 " + width + " " + height).classed("svg-content-responsive", true);

    /**
     * Keep track of the mouse.
     */
    svg.on("mousemove", function () {
        mouseCoordinates = _d2.default.mouse(this);
    });
    svg.on("click", function () {
        options.clickAway();
    });

    /**
     * Set up [webcola](http://marvl.infotech.monash.edu/webcola/).
     * Later we'll be restarting the simulation whenever we mutate
     * the node or link lists.
     */
    var simulation = updateColaLayout();

    /**
     * Here we define the arrow heads to be used later.
     * Each unique arrow head needs to be created.
     */
    var defs = svg.append("defs");

    /**
     * Appends a new marker to the dom, for the new
     * marker color.
     * @param {defs DOMElement} definitionElement 
     * @param {string} color valid css color string
     */
    var createColorMarker = function createColorMarker(definitionElement, color) {
        definitionElement.append("marker").attr("id", "arrow-" + color).attr("viewBox", "0 -5 10 10").attr("refX", 8).attr("markerWidth", 6).attr("markerHeight", 6).attr("fill", color).attr("orient", "auto").append("path").attr("d", "M0,-5L10,0L0,5").attr("class", "arrowHead");
    };

    // Define svg groups
    var g = svg.append("g"),
        link = g.append("g").selectAll(".link"),
        node = g.append("g").selectAll(".node");

    /**
     * Add zoom/panning behaviour to svg.
     */
    var zoom = _d2.default.zoom().scaleExtent([0.1, 5]).on("zoom", zoomed);
    svg.call(zoom);
    function zoomed() {
        options.clickAway();
        g.attr("transform", _d2.default.event.transform);
    }

    /**
     * restart function adds and removes nodes.
     * It also restarts the simulation.
     * This is where aesthetics can be changed.
     */
    function restart() {
        /////// NODE ///////

        node = node.data(nodes, function (d) {
            return d.index;
        });
        node.exit().remove();
        var nodeEnter = node.enter().append("g").each(function (d) {
            d.createMargin = false;
        }).classed("node", true).attr("cursor", "move").call(simulation.drag);

        // Here we add node beauty.
        // To fit nodes to the short-name calculate BBox
        // from https://bl.ocks.org/mbostock/1160929
        var text = nodeEnter.append("text").attr("dx", -10).attr("dy", -2).attr("text-anchor", "middle").style("font", "100 22px Helvetica Neue").text(function (d) {
            return d.shortname || d.hash;
        }).each(function (d) {
            if (d.createMargin) {
                return;
            }
            var b = this.getBBox();
            var extra = 2 * margin + 2 * pad;
            d.width = b.width + extra;
            d.height = b.height + extra;
            d.createMargin = !d.createMargin;
        }).attr("x", function (d) {
            return d.width / 2;
        }).attr("y", function (d) {
            return d.height / 2;
        });
        // Choose the node shape and style.
        if (layoutOptions.nodeShape == "rect") {
            nodeEnter.insert("rect", "text"); // The second arg is what the rect will sit behind.
        } else if (layoutOptions.nodeShape == "circle") {
            nodeEnter.insert("circle", "text"); // The second arg is what the rect will sit behind.
        }
        nodeEnter.classed("node", true).attr("fill", function (d) {
            return options.nodeToColor && options.nodeToColor(d) || "aqua";
        });

        node = node.merge(nodeEnter);

        /**
         * Rebind the handlers on the nodes.
         */
        node.on('click', function (node) {
            // coordinates is a tuple: [x,y]
            setTimeout(function () {
                options.clickNode(node, mouseCoordinates);
            }, 50);
        });

        /////// LINK ///////
        link = link.data(links, function (d) {
            return d.source.index + "-" + d.target.index;
        });
        link.exit().remove();

        link = link.enter().append("path").attr("class", "line").attr("stroke-width", function (d) {
            return options.edgeStroke && options.edgeStroke(d) || 2;
        }).attr("stroke", function (d) {
            return options.edgeColor(d.edgeData);
        }).attr("fill", "none").attr("marker-end", function (d) {
            return "url(#arrow-" + options.edgeColor(d.edgeData) + ")";
        }).merge(link);

        /**
         * Helper function for drawing the lines.
         */
        var lineFunction = _d2.default.line().x(function (d) {
            return d.x;
        }).y(function (d) {
            return d.y;
        });

        /**
         * Causes the links to bend around the rectangles.
         * Source: https://github.com/tgdwyer/WebCola/blob/master/WebCola/examples/unix.html#L140
         */
        var routeEdges = function routeEdges() {
            if (links.length == 0 || !layoutOptions.enableEdgeRouting) {
                return;
            }
            simulation.prepareEdgeRouting();
            link.attr("d", function (d) {
                return lineFunction(simulation.routeEdge(d));
            });
            if (isIE()) link.each(function (d) {
                this.parentNode.insertBefore(this, this);
            });
        };
        // Restart the simulation.
        simulation.links(links); // Required because we create new link lists
        simulation.start(10, 15, 20).on("tick", function () {
            node.each(function (d) {
                if (d.bounds) {
                    d.innerBounds = d.bounds.inflate(-margin);
                }
            }).attr("transform", function (d) {
                return d.innerBounds ? "translate(" + d.innerBounds.x + "," + d.innerBounds.y + ")" : "translate(" + d.x + "," + d.y + ")";
            });
            node.select('rect').attr("width", function (d) {
                return d.innerBounds && d.innerBounds.width() || d.width;
            }).attr("height", function (d) {
                return d.innerBounds && d.innerBounds.height() || d.height;
            });

            node.select('circle').attr("r", function (d) {
                return (d.innerBounds && d.innerBounds.width() || d.width) / 2;
            }).attr("cx", function (d) {
                return (d.innerBounds && d.innerBounds.width() || d.width) / 2;
            }).attr("cy", function (d) {
                return (d.innerBounds && d.innerBounds.height() || d.height) / 2;
            });

            link.attr("d", function (d) {
                var route = cola.makeEdgeBetween(d.source.innerBounds, d.target.innerBounds, 5);
                return lineFunction([route.sourceIntersection, route.arrowStart]);
            });
            if (isIE()) link.each(function (d) {
                this.parentNode.insertBefore(this, this);
            });
        }).on("end", routeEdges);
        function isIE() {
            return navigator.appName == 'Microsoft Internet Explorer' || navigator.appName == 'Netscape' && new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) != null;
        }
    }

    // Helper function for updating links after node mutations.
    // Calls a function after links added.
    function createNewLinks() {
        tripletsDB.get({}, function (err, l) {
            if (err) {
                throw new Error(err);
            }
            // Create edges based on LevelGraph triplets
            links = l.map(function (_ref) {
                var subject = _ref.subject,
                    object = _ref.object,
                    edgeData = _ref.edgeData;

                var source = nodeMap.get(subject);
                var target = nodeMap.get(object);
                return { source: source, target: target, edgeData: edgeData };
            });
            restart();
        });
    }

    function addNode(nodeObject) {
        // Check that hash exists
        if (!nodeObject.hash) {
            var e = new Error("Node requires a hash field.");
            console.error(e);
            return;
        }

        // Add node to graph
        if (!nodeMap.has(nodeObject.hash)) {
            // Set the node
            nodes.push(nodeObject);
            nodeMap.set(nodeObject.hash, nodeObject);
        }
        restart();
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
            var e = new Error("TripletObject undefined");
            console.error(e);
            return false;
        }

        // Node needs a unique hash associated with it.
        var subject = tripletObject.subject,
            predicate = tripletObject.predicate,
            object = tripletObject.object;

        if (!(subject && predicate && object && true)) {
            throw new Error("Triplets added need to include all three fields.");
            return false;
        }

        // Check that hash exists
        if (!(subject.hash && object.hash)) {
            var e = new Error("Subject and Object require a hash field.");
            console.error(e);
            return false;
        }

        // Check that type field exists on predicate
        if (!predicate.type) {
            var e = new Error("Predicate requires type field.");
            console.error(e);
            return false;
        }

        // Check that type field is a string on predicate
        if (typeof predicate.type !== "string") {
            var e = new Error("Predicate type field must be a string");
            console.error(e);
            return false;
        }
        return true;
    }

    function addTriplet(tripletObject) {
        if (!tripletValidation(tripletObject)) {
            return;
        }
        // Node needs a unique hash associated with it.
        var subject = tripletObject.subject,
            predicate = tripletObject.predicate,
            object = tripletObject.object;

        /**
         * If a predicate type already has a color,
         * it is not redefined.
         */
        if (!predicateTypeToColorMap.has(options.edgeColor(predicate))) {
            predicateTypeToColorMap.set(options.edgeColor(predicate), true);

            // Create an arrow head for the new color
            createColorMarker(defs, options.edgeColor(predicate));
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
        }, function (err) {
            if (err) {
                throw new Error(err);
            }

            // Add nodes to graph
            if (!nodeMap.has(subject.hash)) {
                // Set the node
                nodes.push(subject);
                nodeMap.set(subject.hash, subject);
            }
            if (!nodeMap.has(object.hash)) {
                nodes.push(object);
                nodeMap.set(object.hash, object);
            }

            createNewLinks();
        });
    }

    function addEdge(triplet) {
        if (!tripletValidation(triplet)) {
            return;
        }
        // Node needs a unique hash associated with it.
        var subject = triplet.subject,
            predicate = triplet.predicate,
            object = triplet.object;

        if (!(nodeMap.has(subject.hash) && nodeMap.has(object.hash))) {
            // console.error("Cannot add edge between nodes that don't exist.")
            return;
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
        }, function (err) {
            if (err) {
                throw new Error(err);
            }

            createNewLinks();
        });
    }

    /**
     * Removes the node and all triplets associated with it.
     * @param {String} nodeHash hash of the node to remove.
     */
    function removeNode(nodeHash) {
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
                    return console.error("There was nothing to remove");
                }

                [].concat(_toConsumableArray(l1), _toConsumableArray(l2)).forEach(function (triplet) {
                    return tripletsDB.del(triplet, function (err) {
                        if (err) {
                            return console.error(err);
                        }
                    });
                });

                // Remove the node
                var nodeIndex = -1;
                for (var i = 0; i < nodes.length; i++) {
                    if (nodes[i].hash === nodeHash) {
                        nodeIndex = i;
                        break;
                    }
                }
                if (nodeIndex === -1) {
                    return console.error("There is no node");
                }

                nodeMap.delete(nodeHash);
                nodes.splice(nodeIndex, 1);

                createNewLinks();
            });
        });
    }

    function setNodeToColor(nodeToColorFunc) {
        options.nodeToColor = nodeToColorFunc;
    }

    /**
     * Function that fires when a node is clicked.
     * @param {function} selectNodeFunc 
     */
    function setSelectNode(selectNodeFunc) {
        options.clickNode = selectNodeFunc;
    }

    /**
     * Invoking this function will recenter the graph.
     */
    function recenterGraph() {
        svg.transition().duration(300).call(zoom.transform, _d2.default.zoomIdentity.translate(0, 0).scale(1));
    }

    /**
     * Replaces function to call when clicking away from a node.
     * @param {function} clickAwayCallback 
     */
    function setClickAway(clickAwayCallback) {
        options.clickAway = clickAwayCallback;
    }

    /**
     * Function called when choosing edge color based on predicate.
     * @param {function} edgeColorCallback takes string 'predicate.type' to a color.
     */
    function setEdgeColor(edgeColorCallback) {
        options.edgeColor = edgeColorCallback;
    }

    /**
     * Function called when choosing a stroke width.
     * Takes the edge object {source, edgeData, target} and returns a number
     * @param {function} edgeStrokeCallback 
     */
    function setEdgeStroke(edgeStrokeCallback) {
        options.edgeStroke = edgeStrokeCallback;
    }

    /**
     * Function for setting the ideal edge lengths.
     * This takes an edge object and should return a number.
     * Edge object has the following shape: {source, edgeData, target}.
     * This will become the min length.
     */
    function setEdgeLength(edgeLengthCallback) {
        options.edgeLength = edgeLengthCallback;
        restart();
    }

    /**
     * Function for updating webcola options.
     * Returns a new simulation and uses the defined layout variable.
     */
    function updateColaLayout() {
        var tempSimulation = cola.d3adaptor(_d2.default).size([width, height]).avoidOverlaps(layoutOptions.avoidOverlaps).handleDisconnected(layoutOptions.handleDisconnected);

        switch (layoutOptions.layoutType) {
            case "jaccardLinkLengths":
                tempSimulation = tempSimulation.jaccardLinkLengths(options.edgeLength);
                break;
            case "flowLayout":
                tempSimulation = tempSimulation.flowLayout(layoutOptions.flowDirection, options.edgeLength);
                break;
            case "linkDistance":
            default:
                tempSimulation = tempSimulation.linkDistance(options.edgeLength);
                break;
        }
        // Bind the nodes and links to the simulation
        return tempSimulation.nodes(nodes).links(links);
    }

    return {
        addTriplet: addTriplet,
        addEdge: addEdge,
        removeNode: removeNode,
        addNode: addNode,
        setNodeToColor: setNodeToColor,
        setSelectNode: setSelectNode,
        setClickAway: setClickAway,
        recenterGraph: recenterGraph,
        edgeOptions: {
            setStrokeWidth: setEdgeStroke,
            setLength: setEdgeLength,
            setColor: setEdgeColor
        },
        colaOptions: {
            flowLayout: {
                down: function down() {
                    layoutOptions.flowDirection = 'y';
                    if (layoutOptions.layoutType == "flowLayout") {
                        simulation.flowLayout(layoutOptions.flowDirection, options.edgeLength);
                    } else {
                        layoutOptions.layoutType = "flowLayout";
                        simulation = updateColaLayout();
                    }

                    restart();
                },
                right: function right() {
                    layoutOptions.flowDirection = 'x';
                    if (layoutOptions.layoutType == "flowLayout") {
                        simulation.flowLayout(layoutOptions.flowDirection, options.edgeLength);
                    } else {
                        layoutOptions.layoutType = "flowLayout";
                        simulation = updateColaLayout();
                    }

                    restart();
                }
            }
        }
    };
}