import _ from 'lodash';
import { createSelector } from 'reselect';
import d3 from 'd3';

const initialState = {
	tree: {
		nodes: {},
		links: []
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
			start: {},
			end_target: {},
			end_nontarget: {},
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

export const makeState = function(tree_data) {
	let state = Object.assign({}, initialState);
	let tree_lo  = d3.layout.tree().separation(() => 1);

	let nodes = tree_lo.nodes(tree_data);
	let links = tree_lo.links(nodes);

	function normalizeNode(n) {
		return Object.assign({}, n,
		                     { children : _.map(n.children, n => n.id),
		                       parent : n.parent ? n.parent.id : null });
	}

	function childType(n) {
		if (n.parent == null)
			return "ROOT";

		switch (n.id) {
		case n.parent.children[0]:
			return 'LEFT';
			break;
		case n.parent.children[1]:
			return 'RIGHT';
			break;
		default:
			return 'UKNOWN';
			break;
		}
	}

	nodes = _.map(nodes, n => Object.assign({}, n, { side : childType(n)}));
	nodes = _.map(nodes, normalizeNode);

	state.tree.nodes = _.keyBy(nodes, n => n.id); // make map keyed by node id
	state.tree.links = _.map(links, l => _.mapValues(l, n => n.id));
	return state;
};

// make a private set of selectors for state
// TODO: is this necessary?
export const makeSelector = () => {
	let s = {
		treeNodes	 : state => state.tree.nodes,
		treeLinks	 : state => state.tree.links,
		treeLeaves   : state => _.filter(_.values(state.tree.nodes),
		                                 n => _.isEmpty(n.children)),
		samples		 : state => state.samples,
		sampleSets	 : state => state.samples_sets,
		canvasSize	 : state => state.ui.canvas.size,
		canvasMargin : state => state.ui.canvas.margin
	};

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
