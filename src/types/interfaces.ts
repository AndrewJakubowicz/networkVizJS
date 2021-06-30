import type { Group as colaGroup, Link, Node as colaNode, Rectangle } from "webcola";
import type { Selection as d3Selection } from "d3";
// todo fix selection: - mistakenly used Selection instead of d3Selection - selection is DOM text selection
type Selection = any;

export interface LayoutOptions {
    databaseName: string;               // Force the database name
    layoutType: "linkDistance" | "flowLayout" | "jaccardLinkLengths";
    jaccardModifier: number;            // Modifier for jaccardLinkLengths, number between 0 and 1
    avoidOverlaps: boolean;             // True: No overlaps, False: Overlaps
    handleDisconnected: boolean;        // False by default, clumps disconnected nodes
    flowDirection: "x" | "y";
    color_defs: { color: string[]; id: string }[];
    enableEdgeRouting: boolean;         // Edges route around nodes
    edgeTextOrientWithPath: boolean,    // Only garuanteed to work with straight edges, ie no edge routing
    nodeShape: string;                  // default node shape text description
    nodePath: string | { (nodeObject?: Node): string };   // function returns node path from shape descriptor
    width: number;                      // SVG width
    height: number;                     // SVG height
    pad: number;                        // Padding outside of nodes
    margin: number;                     // Margin inside of nodes
    groupPad: number;                   // padding around group
    alignTimer: number                  // time (milliseconds) to confirm constraint creation

    canDrag(): boolean;                 // True: You can drag nodes, False: You can't

    nodeDragStart(d: Node, element: any): void;      // This callback is called when a drag event starts on a node.

    nodeDragged(d: Node, element: any, alignment: any): void;      // conveys alignment information during each drag event

    nodeDragEnd(d: Node, element: any): void;        // Called when drag event ends

    edgeLabelText: string | { (d?: EdgeData, i?: number): string };

    // Mouse event handlers

    clickAway(): void;

    // Nodes
    mouseDownNode(nodeObject?: Node, d3Selection?: Selection, event?: MouseEvent): void;

    mouseOverNode(nodeObject?: Node, d3Selection?: Selection, event?: MouseEvent): void;

    mouseOutNode(nodeObject?: Node, d3Selection?: Selection, event?: MouseEvent): void;

    mouseUpNode(nodeObject?: Node, d3Selection?: Selection, event?: MouseEvent): void;

    clickNode(nodeObject?: Node, d3Selection?: Selection, event?: MouseEvent): void;

    dblclickNode(nodeObject?: Node, d3Selection?: Selection, event?: MouseEvent): void;

    // Groups
    mouseOverGroup(groupObject?: Group, d3Selection?: Selection, event?: MouseEvent): void;

    mouseOutGroup(groupObject?: Group, d3Selection?: Selection, event?: MouseEvent): void;

    clickGroup(groupObject?: Group, d3Selection?: Selection, event?: MouseEvent): void;

    dblclickGroup(groupObject?: Group, d3Selection?: Selection, event?: MouseEvent): void;

    // Edges
    mouseOverEdge(edgeObject?: Edge, d3Selection?: Selection, event?: MouseEvent): void;

    mouseOutEdge(edgeObject?: Edge, d3Selection?: Selection, event?: MouseEvent): void;

    clickEdge(edgeObject?: Edge, d3Selection?: Selection, event?: MouseEvent): void;

    dblclickEdge(edgeObject?: Edge, d3Selection?: Selection, event?: MouseEvent): void;

    mouseOverConstraint(constraint?: AlignConstraint, d3Selection?: d3Selection<SVGGElement, AlignConstraint, null, undefined>, event?: MouseEvent): void;

    mouseOutConstraint(constraint?: AlignConstraint, d3Selection?: d3Selection<SVGGElement, AlignConstraint, null, undefined>, event?: MouseEvent): void;

    clickConstraint(constraint?: AlignConstraint, d3Selection?: d3Selection<SVGGElement, AlignConstraint, null, undefined>, event?: MouseEvent): void;

    clickConstraintGuide(d: Node, alignedNodes: Node[], axis: "x" | "y"): void

    // These are "live options"
    nodeToPin: boolean | { (d?: Node, i?: number): boolean };
    nodeToColor: string | { (d?: Node, i?: number): string };        // Return a valid hexadecimal colour.
    nodeToText: string | { (d?: Node, i?: number): string };        // Return text used to display in node.
    nodeStrokeWidth: number | { (d?: Node, i?: number): number };
    nodeStrokeColor: string | { (d?: Node, i?: number): string };
    nodeStrokeDash: string | { (d?: Node, i?: number): string };
    nodeFontSize: string | { (d?: Node, i?: number): string };
    edgeFontSize: string | { (d?: Node, i?: number): string };      // return string number with "px" appended
    groupFontSize: string | { (d?: Node, i?: number): string };
    edgeColor: string | { (d?: EdgeData, i?: number): string };
    edgeArrowhead: number | { (d?: EdgeData, i?: number): number };  // edgeArrowhead: 0 - None, 1 - Right, -1 - Left, 2 - Bidirectional
    edgeStroke: number | { (d?: EdgeData, i?: number): number };
    edgeStrokePad: number | { (d?: EdgeData, i?: number): number };  // size of clickable area behind edge
    edgeDasharray: number | { (d?: EdgeData): number };
    edgeLength: number;
    edgeSmoothness: number;                                 // amount of smoothing applied to vertices in edges
    groupFillColor: string | { (g?: Group): string };
    snapToAlignment: boolean;                               // Enable snap to alignment whilst dragging
    snapThreshold: number;                                  // Snap to alignment threshold
    easyConstrain: boolean;                                 // enable easy constraint creation on drag snapping.
    palette: string[];  // colour palette selection

    zoomScale(scale: number): void;     // Triggered when zooming

    isSelect(): boolean; // is tool in selection mode
    nodeSizeChange(): void; // Triggers when node dimensions update

    selection(): any;   // Returns current selection from select tool

    imgResize(bool: boolean): void;  // Toggle when resizing image

    edgeRemove(edgeObject?: Edge, d3Selection?: Selection, event?: MouseEvent): void; // TODO -ya defunct?

}

// TODO Implement edges
type Edge = any;

export interface EdgeData {
    strokeWidth?: number;
    arrowhead?: -1 | 0 | 1 | 2;
    stroke?: string;
    strokeDasharray?: number;
    strokePad?: number;
    text?: string;
}

export interface Triplet {
    subject: any;
    object: any;
    predicate: any;
}

export type Id = string;

export interface InputAlignConstraint {
    type: "alignment";
    axis: "x" | "y";
    visible?: boolean;
    nodeOffsets?: { id: Id; offset: number }[]; // might not be passed in
    offsets?: { node: number; offset: number }[]; // computed internally
}

export interface AlignConstraint extends InputAlignConstraint {
    // might not be passed in
    nodeOffsets: { id: Id; offset: number }[];
    // node index computed internally
    offsets: { node: number; offset: number }[];
    // return constraint boundary, bound on creation
    bounds: () => { x: number; X: number; y: number; Y: number; }
}

export interface InputSeparationConstraint {
    type: "separation";
    axis: "x" | "y";
    gap: number;
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
    payload?: any;
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
    getByCoords(boundary: { x: number; X: number; y: number; Y: number }): { nodes: Node[]; edges: Edge[]; groups: Group[] };

    // Get edge from predicateMap
    getPredicate(id?: Id): Edge | Edge[];

    // Get Layout options
    getLayoutOptions(): LayoutOptions;

    // Get SVG element. If you want the node use `graph.getSVGElement().node();`
    getSVGElement(): d3Selection<SVGElement, undefined, HTMLDivElement, any>;

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

    // toggle constraint visibility
    constraintVisibility(value: boolean, constraint?: AlignConstraint | AlignConstraint[], preventUpdate?: boolean): void,

    // Show or hide group text popup
    groupTextPreview(show: boolean, groupId: Id | Id[], text?: string): void;

    // add def to allow gradients in nodes
    addColourDef: (color: string[], id: string) => void;

    // modify colour defs
    updateColourDef: (colours: { color: string[], id: string }[]) => void;

    // Restart styles or layout.
    restart: {
        // Redraw without changing layout
        styles(): Promise<void>;
        // Aligns text to centre of node
        textAlign(): Promise<void>;
        // Redraw the edges
        redrawEdges(preventLayout?: boolean): Promise<void>;
        // restart simulation and redraw layout
        layout(callback: { (): void }, preventLayout?: boolean, constraintIterations ?: number): Promise<void>;
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
            down(callback: { (): void }): void;
            right(callback: { (): void }): void;
        },
        forceLayout(callback: { (): void }): void;
        edgeLength(edgeLen: number, callback: { (): void }): void;
        reverseTriplets: ()=> Promise<void>;
    };
}
