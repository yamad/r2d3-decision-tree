// stuff to deal with decision trees
import _ from 'lodash';
import fp from 'lodash/fp';
import deepFreeze from 'deep-freeze';

const make_r2d3_fork_node = () => ({
	id:       null,			// unique node id
	samples:  0,			// sample count
	key:     "",			// factor name
	value:    0,			// factor split point
	gini:	  0,			// gini index for calculating split
	children: []			// descendant tree nodes, direct refs
});

const make_r2d3_leaf_node = () => ({
	id:        null,		// unique node id
	samples:   1,			// sample count
	value:     [0, 0],		// sample counts per class
	impurity:  0,			// *not used
	criterion: "gini"		// *not used
});

const makeForkNode = () => ({
	id:          null,		// unique node id
	type:        "",		// type, ROOT/LEFT/RIGHT
	leaf:        false,		// true if a leaf node
	samples:     0,			// sample count
	split_key:   "",		// split factor name
	split_point: 0,			// split factor value
	parent:      null,      // parent node id
	children:    []			// descendant tree nodes, ids
});

const makeLeafNode = () => ({
	id:            null,	 // unique node id
	type:          "",		 // type, ROOT/LEFT/RIGHT
	leaf:          true,	 // true if a leaf node
	samples:       0,		 // sample count
	sample_counts: [0, 0],	 // number of classified target/non-target samples
	target:		   false,	 // clasifies target or non-target samples?
	parent:        null,     // parent node id
	children:      null		 // descendant tree nodes, ids
});

// assign values from source object to destination object, for all
// (shallow) attributes that exist in both.
const deriveObject = (dst, src) => {
	_.forIn(dst, (value, key) => {
		if (_.has(src, key)) dst[key] = src[key];
	});
	return dst;
};

// clean/normalize/prepare R2D3 tree data
//
// returns a map (object) of nodes keyed by id. references to
// parent/child nodes are normalized (by id, not direct reference)
//
// expects a single root node with all descendant nodes in the
// 'children' attribute, as shown in `tree_data` of
// `tree-training-set-98.js` file. all functions operate on
// denormalized data.
export function clean_r2d3_tree_data(raw) {
	const isLeaf = (n) => _.isUndefined(n.children);
	const isRoot = (n) => _.isUndefined(n.parent);

		// flatten embedded child nodes into a list
	const flattenTree = (root) => {
		if (isLeaf(root)) return [root];

		// more to do. recurse through children
		const assignParent = (n) => _.assign({ parent : root}, n);
		root.children = _.map(root.children, assignParent);
		return [root].concat(_.flatMap(root.children, flattenTree));
	};

	// replace direct references with ids. works on single node
	const normalizeNode = (node) => {
		if (!_.isNull(node, 'children') && !_.isEmpty(node, 'children'))
			node.children = _.map(node.children, c => parseInt(c.id));
		if (!_.isNull(node.parent))
			node.parent   = parseInt(node.parent.id);
		return node;
	};

	// split type of child (left, right, root). works on denormalized data
	// precalculating now avoids tree traversal (and implicit ordering)
	const addType = (n) => {
		if (isRoot(n))
			n.type = 'ROOT';
		else if (n == n.parent.children[0])
			n.type = 'LEFT';
		else if (n == n.parent.children[1])
			n.type = 'RIGHT';
		else
			n.type = 'UNKNOWN';
		return n;
	};

	// assign useful attributes to a leaf node
	//
	const transformLeafNode = (n) => {
		let a = deriveObject(makeLeafNode(), n);

		// rename vague attribute names
		//
		// in leaf nodes, `value` is an array giving sample counts for
		// A/B classification.
		if (n.value == null) throw new Error("Invalid tree input: no value on node");
		a.sample_counts = n.value;
		a.target = n.value[0] > n.value[1];

		// parse strings into numbers
		a.id = parseInt(n.id);
		a.samples = parseInt(n.samples);
		return a;
	};

	// assign useful attributes to a fork node (non-leaf node)
	const transformForkNode = (n) => {
		let a = deriveObject(makeForkNode(), n);

		// rename vague attribute names
		a.split_key   = n.key;
		a.split_point = parseFloat(n.value);

		// parse strings into numbers
		a.id      = parseInt(n.id);
		a.samples = parseInt(n.samples);
		return a;
	};

	const transformNode = (n) => {
		if (isLeaf(n))
			return transformLeafNode(n);
		else
			return transformForkNode(n);
	};

	// in-place mutations
	let tree = _.assign({}, raw);
	tree = flattenTree(tree);		// make list, always first step
	tree = tree.map(addType);
	tree = tree.map(transformNode);
	tree = tree.map(normalizeNode); // normalize, always last step
	return _.keyBy(tree, 'id');
};




// methods for cleaned trees

export const isRoot    = (node) => _.isNull(node.parent);
export const isLeaf    = (node) => node.leaf;
export const getRoot   = (nodes) => _.head(_.values(_.pickBy(nodes, isRoot)));
export const getLeaves = (nodes) => _.pickBy(nodes, isLeaf);
export const getPaths  = (nodes) => _.mapValues(getLeaves(nodes),
                                                _.curry(treeLineage)(nodes));

const toId           = (a) => a.id;
const mapToId        = (nodes) => _.map(nodes, toId);
const splitOnTarget  = (nodes) => _.partition(nodes, (n) => n.target);

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
	if (root == null)
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
	return [ap_samples, classified];
}

/** return list of node ids giving path from root to given node */
export function treeLineage(nodes, node) {
	if (node.parent == null) return [node.id];
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

// sample.leaf_id
// sample.class
// sample.
