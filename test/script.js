console.log("loaded graph")
import networkVizJS from '../src/networkViz';
var graph = networkVizJS("exampleGraph")
console.log("loaded graph2")

graph.setEdgeStroke(d => d.edgeData.length);

graph.addNode({hash:"testNode1"})

graph.addTriplet({subject: {hash:"testNode1"}, predicate:{type:"someType", length:10}, object: {hash:"child"}});

