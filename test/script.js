/** networkVizJS is already defined on the webpage */
var graph = networkVizJS.default("exampleGraph")

graph.edgeOptions.setStrokeWidth(d => d.edgeData.width);
graph.edgeOptions.setColor(predicate => {console.log(predicate); return "green"})
graph.edgeOptions.setLength(({edgeData}) => edgeData.length)

setTimeout(() => {
    graph.addNode({hash:"testNode1"})
}, 1000)

setTimeout(() => {
    graph.addNode({hash:"Stacey"})
}, 6000)

setTimeout(() => {
    graph.addTriplet({subject: {hash:"testNode1"}, predicate:{type:"someType", length:800, color:"pink", width: 10}, object: {hash:"child"}});
}, 3000)


// setInterval(() => {
//     graph.colaOptions.flowLayout.down();
// }, 1000)

// setInterval(() => {
//     graph.colaOptions.flowLayout.right();
// }, 800)
