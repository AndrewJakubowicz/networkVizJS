import * as cola from "webcola";
import * as d3 from "d3";
import type { LayoutOptions } from "./types/interfaces";

/**
 * Function for updating webcola options.
 * Returns a new simulation and uses the defined layout variable.
 */
export default function updateColaLayout(layoutOptions: LayoutOptions) {
    let tempSimulation = cola
        .d3adaptor(d3)
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
            tempSimulation = tempSimulation.jaccardLinkLengths(layoutOptions.edgeLength as any, layoutOptions.jaccardModifier);
            break;
        case "flowLayout":
            if (layoutOptions.edgeLength === undefined || !(typeof layoutOptions.edgeLength === "number" || typeof layoutOptions.edgeLength === "function")) {
                console.error("'edgeLength' needs to be set to a number or function for flowLayout to work properly");
            }
            tempSimulation = tempSimulation.flowLayout(layoutOptions.flowDirection, layoutOptions.edgeLength);
            break;
        case "linkDistance":
        default:
            tempSimulation = tempSimulation.linkDistance(layoutOptions.edgeLength as any);
            break;
    }
    // Bind the nodes and links to the simulation

    return tempSimulation;
}
