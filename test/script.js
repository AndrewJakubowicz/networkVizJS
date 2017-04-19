/** networkVizJS is already defined on the webpage */
var graph1 = networkVizJS("exampleGraph1")

graph1.edgeOptions.setStrokeWidth(d => d.edgeData.width);
graph1.edgeOptions.setColor(predicate => {console.log(predicate); return "green"})
graph1.edgeOptions.setLength(({edgeData}) => edgeData.length)

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
    layoutType: "flowLayout",
    avoidOverlaps: true,
    handleDisconnected: false,
    flowDirection: "y",
    enableEdgeRouting: false,
    nodeShape: "rect",
    width: 300,
    height: 300,
});

graph2.nodeOptions.setNodeColor(d => d.color);
graph2.nodeOptions.nodeStrokeWidth(d => d.strokeWidth);
graph2.nodeOptions.nodeStrokeColor(d => d.stroke);

let changingNode = {hash:"changingColor", color: "red", strokeWidth: 10, stroke: "violet"};

graph2.addNode(changingNode);

setInterval(()=> {
    changingNode.color = "green";
    changingNode.strokeWidth = 2;
    graph2.restart();
}, 2000)

setInterval(()=> {
    changingNode.color = "blue";
    graph2.restart();
}, 2500)
