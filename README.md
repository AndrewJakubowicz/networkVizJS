# Easy, interactive graphs with networkVizJS

<p align="center">
<img src="https://media.giphy.com/media/xUA7b6EQrHg94qkynC/giphy.gif" alt="Interacting with diagram">
</p>

## Examples

- [Very simple graph editor](http://mind-map-prototype.surge.sh/)
### vue-graphViz
A fully functional graph editor built using networkVizJS
- [Demo Link](https://andrewjakubowicz.github.io/vue-graphViz/)
- [Github Project Link](https://github.com/AndrewJakubowicz/vue-graphViz)


## Why this project exists

Force directed graphs can be a mighty headache especially when trying to dynamically update nodes.

This project aims to abstract away much of the process of drawing a graph leaving you to focus on the
things that matter.

### Features

 - Dragging.
 - Panning and zooming.
 - Avoid overlapping nodes.
 - Easy interface for adding / removing nodes.
 - Routing the edge lines around nodes.

<p align="center">
<img src="https://media.giphy.com/media/xUPGciVhMEBSWGN94c/giphy.gif" alt="Interacting with diagram">
</p>

 - Very stable using [Webcola](http://marvl.infotech.monash.edu/webcola/) as the layout.
 - Easy handlers that allow you to finely tune the experience for the user.
 - Various layouts supported out of the box:
    - Flow layout for force directed graph (horizontally and vertically)
    - Jaccard layout (where denser node regions spread out)
    - Regular layout allowing a fixed or dynamic edge length.
 - An intuitive API which lets you do what you want.


>> Adding a node is as easy as `graph.addNode(<your node object>)`!


## Quickstart using Webpack or another bundler

```shell
npm install --save networkvizjs
```

Import the module:

```javascript
// ES6
import networkVizJS from "networkVizJS";
// commonjs
var networkVizJS = require('networkVizJS').default;
```

Given we have an div with id `graph1`, we can initiate
a graph in that div using:

```typescript
const graph = networkVizJS('graph1', options?);
```

Node must have at least these two properties:
Optionally you can define `x` and `y`.

### Adding and removing nodes
```typescript
const node = {
    id: "uniqueString", // id must be unique
    hash: "uniqueString",   // see notes below
    shortname: "New Node",
    class: "",
    fixed: true,
    // optional properties
    nodeShape: "rect",
    color: '#aadcdc',
    img: false,
    fixedWidth: false,
}
```
`addNode` takes a node object or a list of nodes.
They'll be immediately drawn to the svg canvas!

```javascript
graph.addNode(node);
```
`removeNode` just takes a node hash.
It deletes the node and all edges that include that node.
```javascript
graph.removeNode("uniqueString");
```

### Adding and removing triplets (or edges between nodes)

To define an edge you use a triplet with the shape:

```javascript
var someEdge = {
    subject: { /* Node to start at */ }
    predicate: { type: "someType", hash: 'uniqueString' } // Type allows different coloured edges. Hash must be unique
    object: { /* Node to finish at */ }
}
```

```javascript
graph.addTriplet(triplet);
graph.removeTriplet(triplet);
```

You're pretty much good to go!
Below is the rest of the API.

### Node Object:
The full node object is defined below

Note: id and hash are the same, hash is depreceated but still needs to be defined for the time being

```typescript
interface Node {
// the following options are required as a minimum definition
    id: Id;                 // unique id string.
    hash: Id;               // deprecated - still required for compatability
    shortname: string;      // text to display
    class: string;          // CSS class to be applied to node element
    fixed: boolean | number // node has fixed position or will auto layout 
                // internally is a bitstring in the form of a number but can be used as a simple boolean

// the following will revert to the default specified in layoutOptions
// valid values are determined by the function defined in layoutOptions
    nodeShape: string;      // string description of node path
    color: string;          // node color - use hex color code string

// optional properties
    img?: any;              // image data inside node
    fixedWidth?: number | boolean;  // Set to number to manually set node width or false

// properties set internally
    constraint?: Constraint[];  // list of constraints applying to this node
    parent?: Group;             // Group node is contained in
    width?: number;             // specify a width and height of the node's bounding box if you turn on avoidOverlaps
    height?: number;            // specify a width and height of the node's bounding box if you turn on avoidOverlaps
    index?: number,             // index in nodes array, this is initialized by Layout.start()         
    bounds: Rectangle;          // Rectangle of node bounds
    innerBounds: Rectangle;     // Rectangle of node bounds
    textPosition: number;       // TODO may be deprecated

// positioning is set internally but may be overwritten
    px: number;
    py: number;
    x:number;
    y:number;
}
```

## Options object:

These options are all optional.
Just pass in the ones you want.

```typescript
interface LayoutOptions {
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
```

## Methods on graph object
These are the API options available on each instance of a graph
```typescript
interface Graph {
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
```

## Todo

- [ ] Batch node and edge updates without layout refreshing
- [ ] Stabilise API (need help / guidance)
- [ ] Add svg tests (need help / guidance)
- [ ] Document full api


