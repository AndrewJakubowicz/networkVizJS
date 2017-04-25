# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

### Changed

 - d3 and webcola is now external
 - api for restarting the graph (split into style and layout restart)

### Added

 - getSVGElement endpoint for getting reference to the svg 'canvas'.
    - useful for getting absolute x and y co-ordinates.
 - shortnames can be updated, and nodes will reflect the change after a layout restart.

## 0.0.3

### Changed

 - Graph modification calls `stop()` the layout preventing bugs.
    - Fixed infinite loop bug
 - Improved overall performance

## 0.0.2

### Added

 - Toggle on/off drag

## 0.0.1
### Added

 - Verification for cola layout
 - Limited restart to styles only
 - Label text for edges with routing
 - Node graph mutation (stroke, stroke-width, fill)
 - Added npm build scripts
 - Added userOptions on initialization
 - Added UMD library definition (full d3 at the moment)
 - Add options for different webcola options (flowLayout, jaccardLinkLength)
 - Add options for circles/rect graphs
 - Added edge color by edge type option
 - Add edges between visible nodes
 - Recenter graph (not very good)
 - Zoom and panning
 - Graph options callback for selecting nodes
 - Node color option function
 - Edge Routing
 - Initial Node d3 mutation - addNode
 - Predicate edge color option (with marker color change)
 - Dynamic node size
 - Remove node by hash
 - Stopped Graph Jumping (handleDisconnect to false)
 - Graph resize feature
 - addTriplet endpoint to the graphFactory

### Changed

 - AddNode can take an array of nodes
