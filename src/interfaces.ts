

export interface LayoutOptions {
    databaseName: string;
    layoutType: string;
    jaccardModifier: number;
    avoidOverlaps: boolean;
    handleDisconnected: boolean;
    flowDirection: string;
    enableEdgeRouting: boolean;
    nodeShape: string; // Can be an svg path.
    width: number;
    height: number;
    pad: number;
    margin: number;
    canDrag(): boolean;
    // This callback is called when a drag event starts on a node.
    nodeDragStart(): void;
    nodeDragEnd(): void;
    edgeLabelText: string | {(d?: any, i?: number): string};
    // Both mouseout and mouseover take data AND the selection (arg1, arg2)
    mouseDownNode(nodeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;
    mouseOverNode(nodeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;
    mouseOutNode(nodeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;
    mouseUpNode(nodeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;
    clickNode(nodeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;
    clickEdge(edgeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;
    clickAway(): void;
    // These are "live options"
    nodeToPin: boolean | {(d?: any, i?: number): boolean};
    nodeToColor: string | {(d?: any, i?: number): string};
    nodeStrokeWidth: number | {(d?: any, i?: number): number};
    nodeStrokeColor: string | {(d?: any, i?: number): string};
    edgeColor: string | {(d?: any, i?: number): string};
    edgeStroke: number | {(d?: any, i?: number): number};
    edgeStrokePad: number | {(d?: any, i?: number): number};
    edgeLength: number | {(d?: any, i?: number): number};
    edgeSmoothness: number | {(d?: any, i?: number): number};
    edgeRemove(edgeObject?: any, d3Selection?: Selection, event?: MouseEvent): void;
    mouseOverRadial(d?: any): void; // TODO remove
    mouseOutRadial(d?: any): void; // TODO remove
    snapToAlignment: boolean;
    snapThreshold: number;
    zoomScale(scale: number): void;
    isSelect(): boolean;
    nodeSizeChange(): void;
    selection(): any;
    imgResize(bool: boolean): void;
}


export interface Triplet {
    subject: any;
    object: any;
    predicate: any;
}