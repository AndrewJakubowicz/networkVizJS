/** networkVizJS is already defined on the webpage */
var graph1 = networkVizJS("exampleGraph1", {
    edgeLength: ({edgeData}) => edgeData.length,
    edgeLabelText: ({edgeData}) => edgeData.type,
    allowDrag: true
})

graph1.edgeOptions.setStrokeWidth(d => d.edgeData.width);
graph1.edgeOptions.setColor(predicate => {console.log(predicate); return "green"})

setTimeout(() => {
    graph1.addNode({hash:"testNode1"})
}, 1000)

setTimeout(() => {
    graph1.addNode({hash:"Stacey"})
}, 6000)

setTimeout(() => {
    graph1.addTriplet({subject: {hash:"testNode1"}, predicate:{type:"someType", length:800, color:"pink", width: 10}, object: {hash:"child"}});
}, 3000)


// setInterval(() => {
//     graph1.colaOptions.flowLayout.down();
// }, 1000)

// setInterval(() => {
//     graph1.colaOptions.flowLayout.right();
// }, 800)



/**
 * networkVizJS example with user layout override.
 * 
 * This example also shows how to change the colours
 * of a node dynamically.
 */
var graph2 = networkVizJS("exampleGraph2", {
    layoutType: "linkDistance",
    avoidOverlaps: true,
    handleDisconnected: false,
    enableEdgeRouting: false,
    nodeShape: "rect",
    width: 300,
    height: 300,
    edgeLength: d => d.edgeData.length
});

graph2.nodeOptions.setNodeColor(d => d.color || 'white');
graph2.nodeOptions.nodeStrokeWidth(d => d.strokeWidth || 2);
graph2.nodeOptions.nodeStrokeColor(d => d.stroke || "black");

let changingNode = {hash:"changingColor", color: "red", strokeWidth: 10, stroke: "violet"};
let node2 = {hash: "anotherNode"};
let node3 = {hash: "more Nodes woooooo"};
graph2.addNode([changingNode, node2, node3]);
graph2.addTriplet({subject: changingNode, predicate: {type:"-", length: 200}, object: node3})
graph2.addTriplet({subject: node3, predicate: {type:"-", length: 30}, object: node2})
setInterval(()=> {
    changingNode.color = "green";
    changingNode.strokeWidth = 2;
    graph2.restart();
}, 2000)

setInterval(()=> {
    changingNode.color = "blue";
    graph2.restart();
}, 2500)
