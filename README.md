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

### Group Object
All properties available on the group object are shown below.

Leaves should be entered as an array of node indices to avoid weird bugs
webcola will convert the index to the node object internally.
 
```typescript
interface Group {
    id: Id;                 // unique ID string
    data: GroupData;        // Group data see below
    parent?: Group;         // Parent group
    groups?: Group[];       // Groups nested in group
    leaves?: Node[];        // Nodes contained in group
    bounds?: Rectangle;     // Rectangle of group bounds
    padding: any;           // number or rectangle of group padding
}

interface GroupData {
    color?: string;         // group colour
    class?: string;         // CSS class to be applied to HTML element
    text?: string;          // group text label
    level?: number;         // Group nesting level - set internally
}
```

## Options object:

These options are all optional.
Just pass in the ones you want.
This controls default settings of colours/sizes etc... as well as
behaviour to be performed on user interaction events eg. clickOnNode

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
    nodePath: string | { (nodeObject?: Node): string };   // function returns node path from shape descriptor
    width: number;                      // SVG width
    height: number;                     // SVG height
    pad: number;                        // Padding outside of nodes
    margin: number;                     // Margin inside of nodes
    groupPad: number;                   // padding around group

    canDrag(): boolean;                 // True: You can drag nodes, False: You can't

    nodeDragStart(d: Node, element: any): void;      // This callback is called when a drag event starts on a node.

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


    // These are "live options"
    nodeToPin: boolean | { (d?: Node, i?: number): boolean };
    nodeToColor: string | { (d?: Node, i?: number): string };        // Return a valid hexadecimal colour.
    nodeStrokeWidth: number | { (d?: Node, i?: number): number };
    nodeStrokeColor: string | { (d?: Node, i?: number): string };
    edgeColor: string | { (d?: EdgeData, i?: number): string };
    edgeArrowhead: number | { (d?: EdgeData, i?: number): number };  // edgeArrowhead: 0 - None, 1 - Right, -1 - Left, 2 - Bidirectional
    edgeStroke: number | { (d?: EdgeData, i?: number): number };
    edgeStrokePad: number | { (d?: EdgeData, i?: number): number };  // size of clickable area behind edge
    edgeDasharray: number | { (d?: EdgeData): number };
    edgeLength: number | { (d?: Edge, i?: number): number };
    edgeSmoothness: number;                                 // amount of smoothing applied to vertices in edges
    groupFillColor: string | { (g?: Group): string };
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

    hasNode(id: Id): boolean
Check if node is drawn.
Returns boolean value on existence of node in graph.

    getDB(): any
Public access to the levelgraph db.Returns the levelgraph db object.

See https://github.com/levelgraph/levelgraph for documentation

    getNode(id?: Id): Node | Node[]
Returns node object matching id. Leave id blank for all nodes. 

    getGroup(id?: Id): Group | Group[]
Returns group object matching id. Leave id blank for all groups. 


    getByCoords(boundary: { x: number; X: number; y: number; Y: number }): { nodes: Node[]; edges: Edge[]; groups: Group[] }
Get nodes, edges, and group objects within defined co-ordinate boundary.
Nodes and groups are defined to be inside if any overlap occurs between their bounds and target boundary.
Edges are defined to be inside boundary if at least the middle 2/3rds of the line is within the bounds.


    getPredicate(id?: Id): Edge | Edge[]
Get edge predicate from predicateMap. Leave id blank for all edges.

    getLayoutOptions(): LayoutOptions
Returns layout options object.

    getSVGElement(): d3Selection<SVGElement, Node, HTMLElement, any>
Get d3 selection of the mainSVG element.
 If you want the HTML node use: `graph.getSVGElement().node();`

    saveGraph(): Promise<string>
Get stringified representation of the graph.
Returns a promise containing the serialised graph.

    addTriplet(tripletObject: Edge, preventLayout?: boolean): Promise<void>
Add an edge to graph. Adds the node if it's not already present otherwise it just adds the edge.

Set preventLayout flag to true to prevent layout restart from occurring automatically on completion
Returns promise that resolves on completion.


    removeTriplet(tripletObject: Edge, preventLayout?: boolean): Promise<void>
Remove an edge from graph. Silently fails if edge doesn't exist.

Set preventLayout flag to true to prevent layout restart from occurring automatically on completion
Returns promise that resolves on completion.

    updateTriplet(tripletObject: Edge): void
DEPRECATED. Use editEdge method instead.
 
Update edge data in the triplet database. Fails silently if doesn't exist.

    removeNode(nodeHash: Id): void
Remove a node and all edges connected to it.


    addNode(nodeObjectOrArray: Node | Node[], preventLayout?: boolean): Promise<void>
Add a node or array of nodes to graph.

Set preventLayout flag to true to prevent layout restart from occurring automatically on completion
Returns promise that resolves on completion.

    editNode(action: { property: string; id: Id | Id[]; value: any | any[] }): void
Public function to mutate node objects.

Can mutate single nodes or multiple nodes at once. Can mutate multiple nodes to have 1 value, or multiple nodes to each have their own value

for multiple values, value array length==id Array length, first value will be mapped to first id in array etc...
    
    editEdge(action: { property: string; id: Id | Id[]; value: any | any[] }): void
Public function to mutate edge objects.

can mutate single edges or multiple edges at once. can mutate multiple edges to have 1 value, or multiple edges to each have their own value.

for multiple values, value array length==id array length, first value will be mapped to first id in array etc...

    addToGroup(group: Group | Id, children: { nodes?: Id[]; groups?: Id[] }, preventLayout?: boolean): void
Add nodes or groups to group. 

Set preventLayout flag to true to prevent layout restart from occurring automatically on completion
Returns promise that resolves on completion.

    unGroup(children: { nodes?: Id[]; groups?: Id[] } | [{ nodes?: Id[]; groups?: Id[] }], preventLayout?: boolean): void
Remove nodes or groups from group

Set preventLayout flag to true to prevent layout restart from occurring automatically on completion
Returns promise that resolves on completion.

    constrain(consData: InputAlignConstraint | AlignConstraint, targets: { id: Id; offset: number }[])
    constrain(consData: InputSeparationConstraint, targets: [Id, Id])
Create new constraint or add nodes to an existing alignment constraint.
Constraints between a pair of nodes e.g. separation constraint cannot be modified, only deleted and created.

see: https://github.com/tgdwyer/WebCola/wiki/Constraints for constraint documentation.

requires restarting simulation after completion.

    unconstrain(nodeId: Id | Id[], constraint?: Constraint): void;
remove nodes from an existing alignment constraint; remove all nodes to remove constraint

requires restarting simulation after completion.

    groupTextPreview(show: boolean, groupId: Id | Id[], text?: string): void
Show or hide group text popup by creating temporary pop up at top of node for text
Can be removed by passing show as false, or by restarting

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

## Todo

- [ ] Batch node and edge updates without layout refreshing
- [ ] Stabilise API (need help / guidance)
- [ ] Add svg tests (need help / guidance)
- [ ] Document full api


