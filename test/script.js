import networkVizJS from '../src/networkViz';
var graph = networkVizJS("exampleGraph")

graph.edgeOptions.setStrokeWidth(d => d.edgeData.width);
graph.edgeOptions.setColor(predicate => {console.log(predicate); return "green"})
graph.edgeOptions.setLength(({edgeData}) => edgeData.length)

setTimeout(() => {
    graph.addNode({hash:"testNode1"})
}, 1000)

setTimeout(() => {
    graph.addNode({hash:"testNode4"})
}, 6000)

setTimeout(() => {
    graph.addTriplet({subject: {hash:"testNode1"}, predicate:{type:"someType", length:80, color:"green", width: 1}, object: {hash:"child"}});
}, 3000)


// setInterval(() => {
//     graph.colaOptions.flowLayout.down();
// }, 1000)

// setInterval(() => {
//     graph.colaOptions.flowLayout.right();
// }, 800)
