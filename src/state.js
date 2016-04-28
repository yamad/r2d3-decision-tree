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
		canvas: {
		 	size:   { width: 600,
			          height: 900 },
			margin: { top: 10,
			          bottom: 10,
			          left: 10,
			          right: 10 }
		}
	}
};

export const makeState = function(tree_data) {
	let state = Object.assign({}, initialState);
	const tree_lo  = d3.layout.tree().separation(() => 1);

	let nodes = tree_lo.nodes(tree_data);
	let links = tree_lo.links(nodes);

	function normalizeNode(n) {
		return Object.assign(
			{ children : _.map(n.children, n => n.id),
			  parent : n.parent ? n.parent.id : null
			},
			n);
	}

	function childType(n) {
		if (n.parent == null) return "root";
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

	nodes = _.map(nodes, normalizeNode);
	nodes = _.keyBy(nodes, n => n.id); // make map keyed by node id

	state.tree.nodes = _.mapValues(nodes,
	                               n => Object.assign({ side : childType(n)}, n));
	state.tree.links = _.map(links, l => _.mapValues(l, n => n.id));
	return state;
};

// memoized selectors
const treeNodesSelector    = state => state.tree.nodes;
const samplesSelector      = state => state.samples;
const sampleSetsSelector   = state => state.samples_sets;
const canvasSizeSelector   = state => state.canvas.size;
const canvasMarginSelector = state => state.canvas.margin;

const get_xscaler = createSelector(
	canvasSizeSelector,
	canvasMarginSelector,
	(size, margin) => {
		const xm = margin.top + margin.bottom;
		return d3.scale.linear()
			.domain([0, 1])
			.range([xm, size.width - xm]);}
);

const get_yscaler = createSelector(
	canvasSizeSelector,
	canvasMarginSelector,
	(size, margin) => {
		const ym = margin.left + margin.right;
		return d3.scale.linear()
			.domain([0, 1])
			.range([ym, size.height - ym]);}
);



var ComputeTestTree = function(tree, test_set) {
  var test_tree = _.assignIn({}, tree);
  var test_stats = [];

  var partitionFork = function(tree, data, depth) {
    tree.samples = data.length;

    // Partition based on if data is Target
    var target = _.partition(data, function(d) {
      return d.target > 0.5;
    });

    // Partition based on if data is above or below split
    var split = _.partition(data, function(d) {
      return d[tree.key] > parseFloat(tree.value);
    });

    // Compute Gini for Given Node
    var isTargetLength = target[0].length/data.length;
    var isNotTargetLength = target[1].length/data.length;
    var gini = 1 - (isTargetLength*isTargetLength + isNotTargetLength*isNotTargetLength);

    tree.gini = gini;

    // Some additional Statistics about the data
    var hasChildren = (split[0].length > 0 && split[1].length >0);
    var max = _.max(data, function(d) {
      return d[tree.key];
    })[tree.key];
    var min = _.min(data, function(d) {
      return d[tree.key];
    })[tree.key];

    var stats = {
      data : data,
      data_rows : {
        true : _.pluck(target[0], "index"),
        false : _.pluck(target[1], "index")
      },
      has_children: hasChildren,
      node: tree.id
    }

    test_stats[parseInt(stats.node)] = stats;

    if(hasChildren) {
      stats.attribute = tree.key,
      stats.max_val = max;
      stats.min_val = min;
      stats.data_values = {
        true : _.pluck(target[0], tree.key),
        false : _.pluck(target[1], tree.key)
      }
      stats.split_location = {
        left_side: split[1],
        right_side: split[0]
      }
      stats.split_point = tree.value

      partitionFork(tree.children[0], split[1], depth+1);
      partitionFork(tree.children[1], split[0], depth+1);
    }

  }

  partitionFork(test_tree, test_set, 0);

  return {
    tree: test_tree,
    stats: test_stats
  }
}
