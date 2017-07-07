// stuff to deal with decision trees
import _ from 'lodash';
import fp from 'lodash/fp';
import deepFreeze from 'deep-freeze';
import d3 from 'd3';

import { clean_r2d3_tree_data } from './tree_clean.js';

// methods for cleaned trees
export const isRoot    = (node) => node.parent === undefined;
export const isLeaf    = (node) => node.leaf;
export const getRoot   = (nodes) => _.head(_.values(_.pickBy(nodes, isRoot)));
export const getLeaves = (nodes) => _.pickBy(nodes, isLeaf);
export const getPaths  = (nodes) => _.mapValues(getLeaves(nodes),
                                                _.curry(treeLineage)(nodes));

const mapToId        = (nodes) => _.map(nodes, a => a.id);
const splitOnTarget  = (nodes) => _.partition(nodes, (n) => n.target);

const makeLink = ( src_id, dst_id ) => {
	return { source : src_id, target : dst_id };
};

// find relative point locations and key by node
const findPoints = (nodes) => {
	const clone_nodes = _.cloneDeep(nodes);
	const layout = d3.layout.tree()
		      .separation(() => 1)
	      .children(d => d.children ? d.children.map(a => clone_nodes[a]) : []);

	const tree_nodes = layout.nodes(getRoot(clone_nodes)); // destructive change!

	// node position points keyed by node id
	const points = _.keyBy(_.map(tree_nodes, n => _.pick(n, ['id', 'x', 'y'])), 'id');
	return points;
};

// constructor for decision trees
export const makeDecisionTree = (raw_tree) => {
	const nodes = clean_r2d3_tree_data(raw_tree);
	const frozen_nodes = deepFreeze(_.cloneDeep(nodes));
	let dt = {};

	dt.getNode = (id) => nodes[id];
	dt.root     = getRoot(frozen_nodes);		   // root node
	dt.leaves   = getLeaves(frozen_nodes);		   // all leaf nodes
	dt.nodes    = nodes;
	dt.fnodes   = frozen_nodes;

	dt.links   = _.flatMap(_.values(frozen_nodes),
	                       (n) => _.map(n.children, _.curry(makeLink)(n.id)));
	dt.points  = findPoints(frozen_nodes);

	dt.leafIDs = _.zipObject(['target', 'nontarget'],
	                         fp.map(mapToId)(splitOnTarget(dt.leaves)));

	// all paths through the tree. how to get to each leaf. note that
	// there is only one path to any leaf.
	dt.lineage  = _.curry(treeLineage)(frozen_nodes);
	dt.paths    = _.mapValues(dt.leaves, dt.lineage);

	// run list of samples through decision tree.
	//
	// return value is a map from leaf nodes to a list of samples that
	// ended up at that leaf.
	dt.applySampleSet = _.curry(applySampleSet)(frozen_nodes)(dt.root);
	return dt;
};

/** run set of samples through decision tree at root.
 *
 * returns sample lists keyed by leaf node ids
 */
export function applySampleSet(nodes, root, samples) {
	if (root === undefined)
		return {};
	if (isLeaf(root)) {
		let res = {};
		res[root.id] = samples;
		return res;
	}

	// partition on decision node split value
	const split = _.partition(
		samples,
		(s) => s[root.split_key] <= parseFloat(root.split_point)
	);
	const a = applySampleSet(nodes, nodes[root.children[0]], split[0]);
	const b = applySampleSet(nodes, nodes[root.children[1]], split[1]);
	return _.merge(a, b);
};

/** partition applied samples into target/non-target groups */
export function classifyAppliedSampleSet(nodes, ap_samples) {
	const leaves       = _.pickBy(nodes, isLeaf);
	const split_leaves = _.zipObject(['target', 'nontarget'],
	                                 _.map(splitOnTarget(leaves), mapToId));
	return fp.mapValues(xs => fp.flatMap(i => ap_samples[i])(xs))(split_leaves);
}

export function classifySampleSet(nodes, samples) {
	const ap_samples = applySampleSet(nodes, getRoot(nodes), samples);
	const classified = classifyAppliedSampleSet(nodes, ap_samples);
	return { byPath:   ap_samples,
	         byTarget: classified };
}


/** return list of node ids giving path from root to given node */
export function treeLineage(nodes, node) {
	if (node.parent == undefined)
		return [node.id];
	return treeLineage(nodes, nodes[node.parent]).concat(node.id);
}


const makeSampleSet = (name, samples) => {
	return {
		id          : name,			// unique sample set id
		sample_leaf : {}			// map from sample id to associated tree leaf id
		// the leaf uniquely identifies the
		// path taken through the tree and how
		// the tree classified the sample.
	};
};

const makeSampleSetUI = () => {
	return {
		progress: 0,
		start: 0,
		end: 0,
		position: { x: 0,
		            y: 0 }
	};
};
