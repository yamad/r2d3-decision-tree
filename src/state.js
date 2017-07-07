/**
 * Application state for decision tree diagram
 *
 * This module defines UI state and config for the application. It
 * supports the one-way information flow in React/Redux designs,
 * although Redux is not actually used (yet).
 */
import _ from 'lodash';
import { createSelector } from 'reselect';
import d3 from 'd3';


const initialState = {
	ui: {
		sample_hover_id: null,
		tree_node_hover_id: null,
		animation_extent: 0,
		sample_radius: 1.8,
		tree_offset: 7,
		points: {
			start:         { x:    0, y:   0  },
			end_path:      { x: null, y: 0.72 },
			end_target:    { x: 0.25, y: 0.8  },
			end_nontarget: { x: 0.75, y: 0.8  }
		},
		extent: {
			tree: { min: 0.06, max: 0.7 },
			results_training: { min: 0.75, max: 1.00 },
			results_test:     { min: 0.75, max: 0.9  }
		},
		canvas: {
		 	size:   { width: 600,
			          height: 600 },
			margin: { top: 10,
			          bottom: 10,
			          left: 10,
			          right: 10 }
		}
	}
};


/**
 * make a new state, with default initial values
 */
export function makeState() {
	return Object.assign({}, initialState);
};


/**
 * make a public API of (cacheable) selectors for state
 *
 * this pattern is from the `reselect` library intended for working
 * with Redux. `createSelector` selectors only recompute when relevant
 * state changes occur.
 */
export function makeSelector() {
	let s = {
		canvasSize	 : state => state.ui.canvas.size,
		treeExtent	 : state => state.ui.extent.tree,
		canvasMargin : state => state.ui.canvas.margin
	};

	s.xScale      = createSelector([ s.canvasSize,
	                                 s.canvasMargin ], xScale);
	s.yScale      = createSelector([ s.canvasSize,
	                                 s.canvasMargin ], yScale);
	s.yTreeScale  = createSelector([ s.canvasSize,
	                                 s.canvasMargin,
	                                 s.treeExtent ], yTreeScale);
	return s;
};


// === Selector helpers ====


/** return scaling function to map normalized x coordinate to screen */
function xScale(size, margin) {
	var xm = margin.top + margin.bottom;
	return d3.scale.linear()
		.domain([0, 1])
		.range([xm, size.width - xm]);
}


/** return scaling to map normalized y coordinate to diagram height */
function yScale(size, margin) {
	var ym = margin.left + margin.right;
	return d3.scale.linear()
		.domain([0, 1])
		.range([ym, size.height - ym]);
}


/** return scaling function to map normalized y coordinate to tree height */
function yTreeScale(size, margin, extent) {
	return d3.scale.linear()
		.domain([0, 1])
		.range([extent.min * size.height,
		        extent.max * size.height]);
}
