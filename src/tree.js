// stuff to deal with decision trees
import _ from 'lodash';
import deepFreeze from 'deep-freeze';
import d3 from 'd3';

import { cleanRawR2D3Tree } from './tree_clean.js';

// methods for cleaned trees
export const isRoot    = (node) => node.parent === undefined;
export const isLeaf    = (node) => node.leaf;
export const getRoot   = (nodes) => _.head(_.values(_.pickBy(nodes, isRoot)));
export const getLeaves = (nodes) => _.pickBy(nodes, isLeaf);
export const getPaths  = (nodes) => _.mapValues(getLeaves(nodes),
                                                node => treeLineage(nodes, node));

/** return link object between source and destination */
function makeLink(srcId, dstId) {
	return { source : srcId, target : dstId };
}


/** return map from node id to relative point locations */
function getPoints(nodes) {
	// clone nodes because d3 mutates them
	let treeNodes = _.cloneDeep(nodes);

	let layout = d3.layout.tree()
	    .separation(() => 1)
	    .children(d => d.children ? d.children.map(id => treeNodes[id]) : []);

	// d3 add x, y properties to each node object
	treeNodes = layout.nodes(getRoot(treeNodes));
	let points = treeNodes.map(n => ( { id: n.id,
	                                    x: n.x,
	                                    y: n.y }));
	// node position points keyed by node id
	return _.keyBy(points, 'id');
}


/** constructor for decision trees */
export function makeDecisionTree(raw_tree) {
	let _nodes = cleanRawR2D3Tree(raw_tree);
	let nodes = deepFreeze(_.cloneDeep(_nodes));

	let root   = getRoot(nodes);     // root node
	let leaves = getLeaves(nodes);   // all leaf nodes
	let points = getPoints(nodes);

	// all paths through the tree. how to get to each leaf. note that
	// there is only one path to any leaf.
	let paths  = _.mapValues(leaves,
	                         leaf => treeLineage(nodes, leaf));

	// array of all tree links
	let links = _.flatMap(_.values(nodes), function childLinks(node) {
		return _.map(node.children,
		             childId => makeLink(node.id, childId));
	});

	// run samples through decision tree
	//
	// return value is a map from leaf nodes to a list of samples that
	// ended up at that leaf.
	let applySamples = function apply(samples) {
		return applySampleSet(nodes, root, samples);
	};

	// classify samples by target/nontarget and by path through tree
	let classifySamples = function classify(samples) {
		return classifySampleSet(nodes, samples);
	};

	let api = { nodes, root, leaves, links, points, paths,
	            applySamples, classifySamples };
	return api;
}


/** run set of samples through decision tree at root.
 *
 * returns sample lists keyed by leaf node ids
 */
function applySampleSet(nodes, root, samples) {
	if (root === undefined)
		return {};
	if (isLeaf(root)) {
		let res = {};
		res[root.id] = samples;
		return res;
	}

	// partition on decision node split value
	let split = _.partition(
		samples,
		(s) => s[root.split_key] <= Number(root.split_point)
	);
	let a = applySampleSet(nodes, nodes[root.children[0]], split[0]),
	    b = applySampleSet(nodes, nodes[root.children[1]], split[1]);
	return _.merge(a, b);
}


/** partition applied samples into target/non-target groups
 *
 * "applied samples" from `applySampleSet` are sorted by the leaf node
 * they pass through. so we decide whether a given leaf node is target or
 * non-target and then assign its samples accordingly.
*/
function classifyAppliedSampleSet(nodes, apSamples) {
	const splitOnTarget  = (nodes) => _.partition(nodes, n => n.target);

	let leaves = getLeaves(nodes);
	let splits = splitOnTarget(leaves);
	let splitLeaves = _.zipObject(['target', 'nontarget'], splits);

	return _.mapValues(splitLeaves, function collectSamples(leafList) {
		return _.flatMap(leafList, leaf => apSamples[leaf.id]);
	});
}


/** return samples classified by the tree nodes, both by path and by target */
function classifySampleSet(nodes, samples) {
	const ap_samples = applySampleSet(nodes, getRoot(nodes), samples);
	const classified = classifyAppliedSampleSet(nodes, ap_samples);
	return { samples:  samples,
	         byPath:   ap_samples,
	         byTarget: classified };
}


/** return list of node ids giving path from root to given node */
export function treeLineage(nodes, node) {
	if (node.parent == undefined)
		return [node.id];
	return [...treeLineage(nodes, nodes[node.parent]), node.id];
}
