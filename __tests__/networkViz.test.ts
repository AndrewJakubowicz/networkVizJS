/**
 * @jest-environment jsdom
 */

import * as n from "../src/networkViz";
import * as jsdom from 'jsdom';

it("Should return Hello World", () => {
    expect(n.networkViz.helloWorld()).toBe("Hello World")
});


/**
 * This is frankly incredible.
 */
describe("Visit google.com", () => {
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
