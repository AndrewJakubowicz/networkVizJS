import type { Group as colaGroup, Link, Node as colaNode, Rectangle } from "webcola";
import type { Selection as d3Selection } from "d3";

export interface LayoutOptions {
    databaseName: string;               // Force the database name
    layoutType: "linkDistance" | "flowLayout" | "jaccardLinkLengths";
    jaccardModifier: number;            // Modifier for jaccardLinkLengths, number between 0 and 1
    avoidOverlaps: boolean;             // True: No overlaps, False: Overlaps
    handleDisconnected: boolean;        // False by default, clumps disconnected nodes
    flowDirection: "x" | "y";
    enableEdgeRouting: boolean;         // Edges route around nodes
    nodeShape: string;                  // default node shape text description
    nodePath: (nodeObject) => string;   // function returns node path from shape descriptor
    width: number;                      // SVG width
    height: number;                     // SVG height
    pad: number;                        // Padding outside of nodes
    margin: number;                     // Margin inside of nodes
    groupPad: number;                   // padding around group

    canDrag(): boolean;                 // True: You can drag nodes, False: You can't

    nodeDragStart(d: any, element: any): void;      // This callback is called when a drag event starts on a node.

    nodeDragEnd(d: any, element: any): void;        // Called when drag event ends

    edgeLabelText: string | { (d?: any, i?: number): string };

    // Mouse event handlers

    clickAway(): void;

    // Nodes
    mouseDownNode(nodeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;

    mouseOverNode(nodeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;

    mouseOutNode(nodeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;

    mouseUpNode(nodeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;

    clickNode(nodeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;

    dblclickNode(nodeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;

    // Groups
    mouseOverGroup(groupObject?: any, d3Selection?: Selection, event?: MouseEvent): void;

    mouseOutGroup(groupObject?: any, d3Selection?: Selection, event?: MouseEvent): void;

    clickGroup(groupObject?: any, d3Selection?: Selection, event?: MouseEvent): void;

    dblclickGroup(groupObject?: any, d3Selection?: Selection, event?: MouseEvent): void;

    // Edges
    mouseOverEdge(edgeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;

    mouseOutEdge(edgeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;

    clickEdge(edgeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;

    dblclickEdge(edgeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;


    // These are "live options"
    nodeToPin: boolean | { (d?: any, i?: number): boolean };
    nodeToColor: string | { (d?: any, i?: number): string };        // Return a valid hexadecimal colour.
    nodeStrokeWidth: number | { (d?: any, i?: number): number };
    nodeStrokeColor: string | { (d?: any, i?: number): string };
    edgeColor: string | { (d?: any, i?: number): string };
    edgeArrowhead: number | { (d?: any, i?: number): number };  // edgeArrowhead: 0 - None, 1 - Right, -1 - Left, 2 - Bidirectional
    edgeStroke: number | { (d?: any, i?: number): number };
    edgeStrokePad: number | { (d?: any, i?: number): number };  // size of clickable area behind edge
    edgeDasharray: number | { (d?: any): number };
    edgeLength: number | { (d?: any, i?: number): number };
    edgeSmoothness: number;                                 // amount of smoothing applied to vertices in edges
    groupFillColor: string | { (g?: any): string };
    snapToAlignment: boolean;                               // Enable snap to alignment whilst dragging
    snapThreshold: number;                                  // Snap to alignment threshold
    palette: string[];  // colour palette selection

    zoomScale(scale: number): void;     // Triggered when zooming

    isSelect(): boolean; // is tool in selection mode
    nodeSizeChange(): void; // Triggers when node dimensions update

    selection(): any;   // Returns current selection from select tool

    imgResize(bool: boolean): void;  // Toggle when resizing image

    edgeRemove(edgeObject?: any, d3Selection?: Selection, event?: MouseEvent): void; // TODO -ya defunct?

}

// TODO Implement edges
type Edge = any;

export interface Triplet {
    subject: any;
    object: any;
    predicate: any;
}

export type Id = string;

export interface InputAlignConstraint {
    type: "alignment";
    axis: "x" | "y";
    nodeOffsets?: { id: Id; offset: number }[]; // might not be passed in
    offsets?: { node: number; offset: number }[]; // computed internally
}

export interface AlignConstraint extends InputAlignConstraint {
    // might not be passed in
    nodeOffsets: { id: Id; offset: number }[];
    // node index computed internally
    offsets: { node: number; offset: number }[];
}

export interface InputSeparationConstraint {
    type: "separation";
    axis: "x" | "y";
    gap: Number;
    // might not be passed in
    leftID?: Id;
    rightID?: Id;
    // node index computed internally
    left?: number;
    right?: number;
}

export interface SeparationConstraint extends InputSeparationConstraint {
    // might not be passed in
    leftID: Id;
    rightID: Id;
    // node index computed internally
    left: number;
    right: number;
}

export type Constraint = AlignConstraint | SeparationConstraint;

export interface Group extends colaGroup {
    id: Id;
    data: GroupData;
    parent?: Group;
    groups?: Group[];
    leaves?: Node[];
    padding: any;
}

interface GroupData {
    color: string;
    class: string;
    text: string;
    level: number;
}


export interface Node extends colaNode {
    id: Id;
    hash: Id;   // deprecated
    shortname: string;
    bounds: Rectangle;
    constraint?: Constraint[];
    parent?: Group;
    class: string;
    nodeShape: string;
    img?: any;
    color: string;
    fixedWidth?: number | boolean;
    textPosition: number;
    px: any;
    py: any;
    innerBounds: Rectangle;
}

export interface Graph {
    // Check if node is drawn.
    hasNode(id: Id): boolean;

    // Public access to the levelgraph db.
    getDB(): any;

    // Get node from nodeMap
    getNode(id?: Id): Node | Node[];

    // Get Group from groupMap
    getGroup(id?: Id): Group | Group[];

    // Get nodes and edges by coordinates
    selectByCoords(boundary: { x: number; X: number; y: number; Y: number }): { nodes: Node[]; edges: Edge[]; groups: Group[] };

    // Get edge from predicateMap
    getPredicate(id?: Id): Edge | Edge[];

    // Get Layout options
    getLayoutOptions(): LayoutOptions;

    // Get SVG element. If you want the node use `graph.getSVGElement().node();`
    getSVGElement(): d3Selection<SVGElement, Node, HTMLElement, any>;

    // Get Stringified representation of the graph.
    saveGraph(): Promise<string>;

    // add a directed edge
    addTriplet(tripletObject: Edge, preventLayout?: boolean): Promise<void>;

    // remove an edge
    removeTriplet(tripletObject: Edge, preventLayout?: boolean): Promise<void>;

    // update edge data in database
    updateTriplet(tripletObject: Edge): void;

    // remove a node and all edges connected to it.
    removeNode(nodeHash: Id): void;

    // add a node or array of nodes.
    addNode(nodeObjectOrArray: Node | Node[], preventLayout?: boolean): Promise<void>;

    // edit node property
    editNode(action: { property: string; id: Id | Id[]; value: any | any[] }): void;

    // edit edge property
    editEdge(action: { property: string; id: Id | Id[]; value: any | any[] }): void;

    // Add nodes or groups to group
    addToGroup(group: Group | Id, children: { nodes?: Id[]; groups?: Id[] }, preventLayout?: boolean): void;

    // Remove nodes or groups from group
    unGroup(children: { nodes?: Id[]; groups?: Id[] } | [{ nodes?: Id[]; groups?: Id[] }], preventLayout?: boolean): void;

    // Create new constraint or add nodes to an existing alignment constraint
    constrain;

    // remove nodes from an existing alignment constraint; remove all nodes to remove constraint
    unconstrain(nodeId: Id | Id[], constraint?: Constraint): void;

    // Show or hide group text popup
    groupTextPreview(show: boolean, groupId: Id | Id[], text?: string): void;

    // Restart styles or layout.
    restart: {
        // Redraw without changing layout
        styles(): Promise<void>;
        // Aligns text to centre of node
        textAlign(): Promise<void>;
        // Redraw the edges
        redrawEdges(): Promise<void>;
        // restart simulation and redraw layout
        layout(callback: () => void, preventLayout?: boolean): Promise<void>;
        // Handle disconnected graph components
        handleDisconnects(): void;
        // Aligns group text
        repositionGroupText(): void;
        // Refresh highlighted elements
        highlight(): void;
    };
    canvasOptions: {
        setWidth(width: number): void;
        setHeight(height: number): void;
    };
    // Set event handlers for node.
    nodeOptions: {
        setDblClickNode;
        setClickNode;
        setMouseOver;
        setMouseOut;
        setMouseDown;
    };
    // Handler for clicking on the edge.
    edgeOptions: {
        setClickEdge;
        setDblClickEdge;
    };
    groupOptions: {
        setDblClickGroup;
    };
    // Change layouts on the fly.
    // May be a webcola memory leak if you change the layout too many times.
    colaOptions: {
        flowLayout: {
            down(callback: () => void): void;
            right(callback: () => void): void;
        };
    };
}
