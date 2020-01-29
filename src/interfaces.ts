export interface LayoutOptions {
    databaseName: string;
    layoutType: string;
    jaccardModifier: number;
    avoidOverlaps: boolean;
    handleDisconnected: boolean;
    flowDirection: string;
    enableEdgeRouting: boolean;
    nodeShape: string;  // default node shape text description
    nodePath: (nodeObject) => string;   // function returns node path from shape descriptor
    width: number;
    height: number;
    pad: number;
    margin: number;
    groupPad: number;

    canDrag(): boolean;

    nodeDragStart(d: any, element: any): void;    // This callback is called when a drag event starts on a node.

    nodeDragEnd(d: any, element: any): void;

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
    nodeToColor: string | { (d?: any, i?: number): string };
    nodeStrokeWidth: number | { (d?: any, i?: number): number };
    nodeStrokeColor: string | { (d?: any, i?: number): string };
    edgeColor: string | { (d?: any, i?: number): string };
    edgeArrowhead: number;  // edgeArrowhead: 0 - None, 1 - Right, -1 - Left, 2 - Bidirectional
    edgeStroke: number | { (d?: any, i?: number): number };
    edgeStrokePad: number | { (d?: any, i?: number): number };
    edgeDasharray: number;
    edgeLength: number | { (d?: any, i?: number): number };
    edgeSmoothness: number | { (d?: any, i?: number): number };
    groupFillColor: string;
    snapToAlignment: boolean;
    snapThreshold: number;
    palette: string[]; // colour palette selection

    zoomScale(scale: number): void;

    isSelect(): boolean; // is tool in selection mode
    nodeSizeChange(): void;

    selection(): any;

    imgResize(bool: boolean): void;

    edgeRemove(edgeObject?: any, d3Selection?: Selection, event?: MouseEvent): void; // TODO -ya defunct?

}


export interface Triplet {
    subject: any;
    object: any;
    predicate: any;
}
