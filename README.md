# NetworkVizJS

<p align="center">
<img src="https://media.giphy.com/media/xUA7b6EQrHg94qkynC/giphy.gif" alt="Interacting with diagram">
</p>

## Examples

- [Easy Dynamically changing graph](https://bl.ocks.org/SpyR1014/d82570c509028e6b0a519ef885ab58f0)
- [Very simple graph editor](http://mind-map-prototype.surge.sh/)

_... more to come or contribute your own_

## Why this project exists

Force directed graphs can be a mighty headache especially when trying to dynamically update nodes.

This project aims to abstract away much of the process of drawing a graph leaving you to focus on the
things that matter.

### Features

 - Dragging.
 - Panning and zooming.
 - Avoid overlapping nodes.
 - Easy interface for adding / removing nodes.
 - Routing the edge lines around nodes.

<p align="center">
<img src="https://media.giphy.com/media/xUPGciVhMEBSWGN94c/giphy.gif" alt="Interacting with diagram">
</p>

 - Very stable using [Webcola](http://marvl.infotech.monash.edu/webcola/) as the layout.
 - Easy handlers that allow you to finely tune the experience for the user.
 - Various layouts supported out of the box:
    - Flow layout for force directed graph (horizontally and vertically)
    - Jaccard layout (where denser node regions spread out)
    - Regular layout allowing a fixed or dynamic edge length.
 - An intuitive API which lets you do what you want.


>> Adding a node is as easy as `graph.addNode(<your node object>)`!


## Development status

> In early development but very usable.
> Contributions as pull requests and issues welcome.

Lets make prototyping graphs faster and more interactive!

## Installation

### Use npm with a bundler like Webpack

```shell
npm install --save networkvizjs
```


## Todo

- [ ] Batch node and edge updates without layout refreshing
- [ ] Stabilise API (need help / guidance)
- [ ] Add svg tests (need help / guidance)


