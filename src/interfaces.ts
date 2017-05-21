

export interface layoutOptions {
    layoutType: string
    avoidOverlaps: boolean
    handleDisconnected: boolean
    flowDirection: string
    enableEdgeRouting: boolean
    nodeShape: string // Can be an svg path.
    width: number
    height: number
    pad: number
    margin: number
    allowDrag: boolean
    // This callback is called when a drag event starts on a node.
    nodeDragStart(): void
    edgeLabelText: string | {(d?: any, i?: number): string};
    // Both mouseout and mouseover take data AND the selection (arg1, arg2)
    mouseOverNode(nodeObject?: any, d3Selection?: Selection): void
    mouseOutNode(nodeObject?: any, d3Selection?: Selection): void
    mouseUpNode(nodeObject?: any, d3Selection?: Selection): void
    // These are "live options"
    nodeToColor: string | {(d?: any, i?: number): string};
    nodeStrokeWidth: number | {(d?: any, i?: number): number};
    nodeStrokeColor: string | {(d?: any, i?: number): string};
    // TODO: clickNode (node, element) => void
    clickNode(nodeObject?: any, d3Selection?: Selection): void
    clickAway(): void
    edgeColor: string | {(d?: any, i?: number): string};
    edgeStroke: number | {(d?: any, i?: number): number};
    edgeLength: number | {(d?: any, i?: number): number};
    clickEdge(edgeObject?: any, d3Selection?: Selection): void
}


export interface triplet {
    subject: any
    object: any
    predicate: any
}