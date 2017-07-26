/// <reference types="jasmine" />

import networkViz from "../src/networkViz";
const n = require("../src/networkViz");

describe("Importing", function(){
    it("Should import as a function", () => {
        // Demonstrates require import path.
        expect(typeof n.default).toEqual("function");
        expect(typeof networkViz).toEqual("function");
    });
});

describe("Api", function() {
    // inject the HTML for the tests
    beforeEach(function() {
        const domHTML = '<div id="graph"></div>';

        document.body.insertAdjacentHTML(
            "afterbegin",
            domHTML,
        );
    });

    // remove the html after each test
    afterEach(function() {
        document.body.removeChild(document.getElementById("graph"));
    });

    it("Test creation of graph with default options", function() {
        expect(document.getElementsByTagName("svg").length).toEqual(0);
        expect(document.getElementsByClassName("svg-container").length).toBeFalsy();
        networkViz("graph");
        expect(document.getElementsByTagName("svg").length).toEqual(1);
        expect(document.getElementsByClassName("svg-container").length).toBeTruthy();
        expect((<SVGElement>document.getElementsByTagName("svg")[0]).getAttribute("viewBox").split(/\s+|,/)).toEqual(["0", "0", "900", "600"]);
    });

    it("Add a node", function(done) {
        const graph = networkViz("graph");
        graph.addNode({hash: "1", shortname: " "}, () => {
            expect(document.getElementsByTagName("path").length).toEqual(1);
            done();
        });
    });

    it("Add a node without a hash", function(){
        const graph = networkViz("graph");
        expect(() => graph.addNode("badNode", undefined)).toThrowError("Parameter must be either an object or an array");
    });

    it("Add many nodes", function(done) {
        const graph = networkViz("graph");
        const node1 = {hash: "1", shortname: "My Node!"};
        const node2 = {hash: "2", shortname: "Another node!"};
        graph.addNode([node1, node2], () => {
            expect(document.getElementsByClassName("node").length).toEqual(2);
            done();
        });
    });

    it("Add a triplet between two nodes", function(done) {
        const graph = networkViz("graph");
        const node1 = {hash: "1", shortname: "My Node!"};
        const node2 = {hash: "2", shortname: "Another node!"};
        graph.addTriplet({
              subject: node1
            , predicate: {type: "edge"}
            , object: node2},
            () => {
                // Check that we have 1 line group and 2 node groups.
                expect(document.getElementsByClassName("line").length).toEqual(1);
                expect(document.getElementsByClassName("node").length).toEqual(2);
                done();
            });
    });

    it("Remove an edge between two nodes", function(done) {
        const graph = networkViz("graph");
        const node1 = {hash: "1", shortname: "My Node!"};
        const node2 = {hash: "2", shortname: "Another node!"};

        // Add triplet then remove the edge (keeping the two nodes).
        graph.addTriplet({
              subject: node1
            , predicate: {type: "edge"}
            , object: node2
            },
            () => {
                // Check that we have 1 line group and 2 node groups.
                expect(document.getElementsByClassName("line").length).toEqual(1);
                expect(document.getElementsByClassName("node").length).toEqual(2);
                graph.removeTriplet({
                    subject: node1
                    , predicate: {type: "edge"}
                    , object: node2
                    }, () => {
                        expect(document.getElementsByClassName("line").length).toEqual(0);
                        expect(document.getElementsByClassName("node").length).toEqual(2);
                        done();
                    });
            });
    });

    it("Remove node and check that edges break", function(done) {
        const graph = networkViz("graph");
        const node1 = {hash: "1", shortname: "My Node!"};
        const node2 = {hash: "2", shortname: "Another node!"};

        // Add triplet then remove the edge (keeping the two nodes).
        graph.addTriplet({
              subject: node1
            , predicate: {type: "edge"}
            , object: node2
            },
            () => {
                // Check that we have 1 line group and 2 node groups.
                expect(document.getElementsByClassName("line").length).toEqual(1);
                expect(document.getElementsByClassName("node").length).toEqual(2);
                graph.removeNode("1", () => {
                        expect(document.getElementsByClassName("line").length).toEqual(0);
                        expect(document.getElementsByClassName("node").length).toEqual(1);
                        done();
                    });
            });
    });

    it("Add nodes and check that classes are attached", function(done) {
        const graph = networkViz("graph");
        const node1 = {hash: "1", class: "someClass1"};
        const node2 = {hash: "2", class: "rar"};

        graph.addTriplet({
            subject: node1,
            predicate: {type: "edge"},
            object: node2 },
            () => {
                // Each class is applied twice. Once on path and once on text content of node.
                expect(document.getElementsByClassName("someClass1").length).toEqual(2);
                expect(document.getElementsByClassName("node").length).toEqual(2);
                done();
            }
        );
    });

    it("Adding fixed:true to a node adds a class 'fixed' to the node group", function(done) {
        const graph = networkViz("graph");
        const node1 = {hash: "1", class: "someClass1"};
        const node2 = {hash: "2", class: "rar"};
        new Promise((resolve, reject) => {
            graph.addTriplet({
                subject: node1,
                predicate: {type: "edge"},
                object: node2 },
                () => {
                    expect(document.getElementsByClassName("fixed").length).toEqual(0);
                    resolve();
                }
            );
        }).then(_ => {
            (node1 as any).fixed = true;
        }).then(graph.restart.styles)
          .then(_ => {
            // Check that fixed class is added
            expect(document.getElementsByClassName("fixed").length).toEqual(1);
        })
          .then(_ => {
            (node1 as any).fixed = false;
        }).then(graph.restart.styles)
          .then(_ => {
            expect(document.getElementsByClassName("fixed").length).toEqual(0);
            expect(document.getElementsByClassName("node").length).toEqual(2);
            done();
        });
    });

    it("Changing edge labels", function(done) {
        const graph = networkViz("graph", ({
            edgeLabelText: d => d.someText,
        } as any));
        const node1 = {hash: "1", class: "someClass1"};
        const node2 = {hash: "2", class: "rar"};
        // Hash allows the edge to be stored uniquely.
        // Type allows controlling the colour of the edge.
        // someText is how we'll change the text.
        const predicate1 = {hash: "1", type: "edge", someText: "Text that changes"};
        new Promise((resolve, reject) => {
            graph.addTriplet({
                subject: node1,
                predicate: predicate1,
                object: node2 },
                () => {
                    expect(document.getElementsByClassName("line").length).toEqual(1);
                    expect(document.getElementsByClassName("line")[0].textContent).toEqual("Text that changes");
                    resolve();
                }
            );
        }).then(_ => {
            (predicate1 as any).someText = "CHANGED!";
        }).then(graph.restart.styles)
          .then(_ => {
            // Check that the text has changed.
            expect(document.getElementsByClassName("line")[0].textContent).toEqual("CHANGED!");
            done();
        });
    });
});





