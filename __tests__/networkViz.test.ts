/**
 * @jest-environment jsdom
 */
/// <reference types="jest" />

import networkViz from "../src/networkViz";
import * as jsdom from 'jsdom';
var n = require('../src/networkViz');

describe("Importing", function(){
    it("Should import as a function", () => {
        // Demonstrates require import path.
        expect(n).toHaveProperty("default");
        expect(n.default).toEqual(expect.any(Function));
        expect(networkViz).toEqual(expect.any(Function));
    });
});

describe("Embedding", function(){
    it("SVG embed on div - id", function(){
        document.body.innerHTML = `<div id="testId">
        </div>`;
        expect(document.getElementsByTagName("svg").length).toEqual(0);
        expect(document.getElementsByClassName("svg-container").length).toBeFalsy();
        networkViz("testId");
        expect(document.getElementsByTagName("svg").length).toEqual(1);
        console.log(document.body.innerHTML);
        expect(document.getElementsByClassName("svg-container").length).toBeTruthy();
        expect((<SVGElement>document.getElementsByTagName("svg")[0]).getAttribute("viewBox").split(/\s+|,/)).toEqual(["0", "0", "900", "600"]);
    });
});






/**
 * This is frankly incredible.
 */
describe("Click a button", () => {
    test("Go to google home page",  () => {
        const mockFn = jest.fn();
        document.body.innerHTML = `<div>
    <span id="username" />
    <button id="button" />
</div>
        `
        document.getElementById("button").addEventListener("click", function(){
            mockFn();
        });
        document.getElementById('button').click();
        expect(mockFn.mock.calls.length).toBe(1);
    })
})
