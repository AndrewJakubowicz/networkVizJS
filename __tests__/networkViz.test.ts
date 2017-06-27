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

    it("Test creation of graph", function() {
        expect(document.getElementsByTagName("svg").length).toEqual(0);
        expect(document.getElementsByClassName("svg-container").length).toBeFalsy();
        networkViz("graph");
        expect(document.getElementsByTagName("svg").length).toEqual(1);
        expect(document.getElementsByClassName("svg-container").length).toBeTruthy();
        expect((<SVGElement>document.getElementsByTagName("svg")[0]).getAttribute("viewBox").split(/\s+|,/)).toEqual(["0", "0", "900", "600"]);
    });
});




