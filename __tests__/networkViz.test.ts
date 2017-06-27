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
});




