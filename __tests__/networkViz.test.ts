/**
 * @jest-environment jsdom
 */
/// <reference types="jest" />

import * as n from "../src/networkViz";
import * as jsdom from 'jsdom';

it("Should import as a function", () => {
    var networkViz = require('../src/networkViz');
    expect(networkViz).toHaveProperty("default");
    expect(networkViz.default).toEqual(expect.any(Function));
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
