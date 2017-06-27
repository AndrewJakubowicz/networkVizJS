# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [UNCHANGED]

### Added

 - Karma and Jasmine tests
 - Function for setting mouseDown on node.
 - zoom prevented if not initiated on svg
 - mouseDown added
 - drag conditional event propagation. (allows conditional control of drag event)
 - hasNode method that allows us to check if node exists on diagram.
 - String representation of the predicates and nodes (for saving).
 - Default database name if not specified.
 - Jaccard modifier to control clustering. (`layoutOptions.jaccardModifier`)

### Changed

 - Fixed errors so they throw properly
 - Widths can get smaller (They could only increase previously)
 - canDrag is just a boolean
 - Made database more random - to try and avoid ANY conflicts at all.
 - removeNode now accepts an optional callback to fire after node is removed.
 - Restored line routing.
 - Text display code now supports multiline. shortname can be an array of lines.
    - FIXED: line routing has broken. - The arrows don't end in the right position.
    - FIXED: text mirroring the last added node.
 - deleted a lot of useless API that can be specified in the options once.

### Removed

 - 'node' class from node paths. Class 'node' refers to the group element.
 - Jest tests
 - The old way the text was laid out.
 - addEdge method (It was a worse addTriplet)

## [0.0.4]

### Changed

 - Tested Jest support
 - Changed codebase to TypeScript
 - All nodes are now paths. (This allows for path to be defined in the node's data)
 - removeNode now removes disconnected nodes.
 - d3 and webcola is now external
 - api for restarting the graph (split into style and layout restart)

### Added

 - Grouping nodes added! - Only to 1 deep.
 - clickEdge added
 - click on node callback (setClickNode)
 - mouseup callback
 - dragStart callback
 - mouseOver and mouseOut callbacks don't fire while dragging.
 - mouseOver and mouseOut callbacks added to nodes.
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
