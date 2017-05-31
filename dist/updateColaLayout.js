"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cola = require("webcola");
const d3 = require("d3");
/**
 * Function for updating webcola options.
 * Returns a new simulation and uses the defined layout variable.
 */
function updateColaLayout(layoutOptions) {
    let tempSimulation = cola.d3adaptor(d3)
        .size([layoutOptions.width, layoutOptions.height])
        .avoidOverlaps(layoutOptions.avoidOverlaps)
        .handleDisconnected(layoutOptions.handleDisconnected);
    // TODO: Work out what's up with the edge length.
    switch (layoutOptions.layoutType) {
        case "jaccardLinkLengths":
            // layoutOptions.edgeLength needs to be a number for jaccard to work.
            if (layoutOptions.edgeLength === undefined || typeof layoutOptions.edgeLength !== "number") {
                console.error("'edgeLength' needs to be set to a number for jaccardLinkLengths to work properly");
            }
            tempSimulation = tempSimulation.jaccardLinkLengths(layoutOptions.edgeLength, layoutOptions.jaccardModifier);
            break;
        case "flowLayout":
            if (layoutOptions.edgeLength === undefined || !(typeof layoutOptions.edgeLength === "number" || typeof layoutOptions.edgeLength === "function")) {
                console.error("'edgeLength' needs to be set to a number or function for flowLayout to work properly");
            }
            tempSimulation = tempSimulation.flowLayout(layoutOptions.flowDirection, layoutOptions.edgeLength);
            break;
        case "linkDistance":
        default:
            tempSimulation = tempSimulation.linkDistance(layoutOptions.edgeLength);
            break;
    }
    // Bind the nodes and links to the simulation
    return tempSimulation;
}
exports.updateColaLayout = updateColaLayout;
//# sourceMappingURL=updateColaLayout.js.map