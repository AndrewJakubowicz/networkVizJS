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
    layoutType: "jaccardLinkLengths",
    avoidOverlaps: true,
    handleDisconnected: false,
    enableEdgeRouting: true,
    nodeShape: "rect",
    width: 300,
    height: 300,
    edgeLength: 100
});

graph2.nodeOptions.setNodeColor(d => d.color || 'white');
graph2.nodeOptions.nodeStrokeWidth(d => d.strokeWidth || 2);
graph2.nodeOptions.nodeStrokeColor(d => d.stroke || "black");

let changingNode = {hash:"changingColor", shortname:":)", color: "red", strokeWidth: 10, stroke: "violet"};
let node2 = {hash: "@spyr1014"};
let node3 = {hash: "dynamic nodes!"};
graph2.addNode([changingNode, node2, node3]);
graph2.addTriplet({subject: changingNode, predicate: {type:"-", length: 200}, object: node3})
graph2.addTriplet({subject: node3, predicate: {type:"-", length: 30}, object: node2})
setInterval(()=> {
    changingNode.color = "white";
    changingNode.shortname = "networkVizJS";
    changingNode.strokeWidth = 2;
    graph2.restart.layout();
}, 2500)

setInterval(()=> {
    changingNode.color = "lightgreen";
    changingNode.shortname = "IS AWESOME =D =D =D"
    graph2.restart.layout();
}, 1900);


function graph3(){
    // Initialise the graph. The first parameter is the div ID to create the graph in.
    // The second parameter is for user options.
    var graph = networkVizJS("graphExample3", {
    edgeLength: 100,
    layoutType: "linkDistance",
    nodeShape: "circle",
    allowDrag: true,
    enableEdgeRouting: false
    });
    // Helper function for creating the edges between nodes.
    const createEdge = function(source, target){
    return {
        subject: source,
        predicate: {type: "normal"},
        object: target}
    };
    
    // Currently all nodes need unique hashes.
    // shortname left blank because we don't need labels on the nodes.
    var node1 = {hash:"1", shortname: " "},
        node2 = {hash:"2", shortname: " "},
        node3 = {hash:"3", shortname: " "};
    var edge1 = createEdge(node1, node2),
        edge2 = createEdge(node2, node3),
        edge3 = createEdge(node3, node1);
    graph.addTriplet(edge1);
    graph.addTriplet(edge2);
    graph.addTriplet(edge3);

    var removingNode = true;
    setInterval(() => {
    if (removingNode){
        graph.removeNode(node3.hash);
    } else {
        graph.addTriplet(edge2);
        graph.addTriplet(edge3);
    }
    removingNode = !removingNode
}, 1000);
}
graph3();