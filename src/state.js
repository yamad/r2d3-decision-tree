import _ from 'lodash';
import { createSelector } from 'reselect';
import { observable } from 'mobx';
import { clean_r2d3_tree_data } from './tree.js';
import d3 from 'd3';

const initialState = {
	tree: {
		nodes: {}
	},
	samples: [],
	sample_sets: {},

	ui: {
		sample_hover_id: null,
		tree_node_hover_id: null,
		animation_extent: 0,
		sample_radius: 1.8,
		tree_offset: 7,
		points: {
			start:         { x:    0, y:   0  },
			end_path:      { x: null, y: 0.7  },
			end_target:    { x: 0.25, y: 0.75 },
			end_nontarget: { x: 0.75, y: 0.75 }
		},
		extent: {
			tree: { min: 0.02, max: 0.6 },
			results_training: { min: 0.75, max: 1.00 },
			results_test:     { min: 0.75, max: 0.9  }
		},
		canvas: {
		 	size:   { width: 600,
			          height: 500 },
			margin: { top: 10,
			          bottom: 10,
			          left: 10,
			          right: 10 }
		}
	}
};

export const makeState = function() {
	let state = Object.assign({}, initialState);
	return state;
};


// make a private set of selectors for state
// TODO: is this necessary?
export const makeSelector = () => {
	let s = {
		treeNodes	 : state => state.tree.nodes,
		treeLeaves   : state => _.filter(_.values(state.tree.nodes),
		                                 n => _.isEmpty(n.children)),
		samples		 : state => state.samples,
		sampleSets	 : state => state.samples_sets,
		canvasSize	 : state => state.ui.canvas.size,
		treeExtent	 : state => state.ui.extent.tree,
		canvasMargin : state => state.ui.canvas.margin
	};

	s.treeLinks = createSelector([ s.treeNodes ],
	                             (nodes) => d3.layout.tree().links(nodes));

	s.x_scaler = createSelector([ s.canvasSize, s.canvasMargin ],
	                            (size, margin) => {
		                            const xm = margin.top + margin.bottom;
		                            return d3.scale.linear()
			                            .domain([0, 1])
			                            .range([xm, size.width - xm]);});
	s.y_scaler = createSelector([ s.canvasSize, s.canvasMargin ],
	                            (size, margin) => {
		                            const ym = margin.left + margin.right;
		                            return d3.scale.linear()
			                            .domain([0, 1])
			                            .range([ym, size.height - ym]);});

	s.y_tree_scaler = createSelector(
		[ s.canvasSize, s.canvasMargin, s.treeExtent ],
		(size, margin, extent) => {
			return d3.scale.linear()
				.domain([0, 1])
				.range([extent.min * size.height,
				        extent.max * size.height]);
		});

	const treeLineage = (nodes, id) => {
		const n = nodes[id];
		if (n.parent == null)
			return [n];
		return treeLineage(nodes, n.parent).concat(n);
	};
	s.treePaths = createSelector([ s.treeLeaves, s.treeNodes ],
	                             (leaves, nodes) => _.map(leaves, n => treeLineage(nodes, n.id)));

	return s;
};
