/** Clean/prepare/transform raw input tree data */
import _ from 'lodash';

const make_r2d3_fork_node = () => ({
	id:       undefined,	  // unique node id
	samples:  0,              // sample count
	key:     "",              // factor name
	value:    0,              // factor split point
	gini:	  0,              // gini index for calculating split
	children: []              // descendant tree nodes, direct refs
});

const make_r2d3_leaf_node = () => ({
	id:        undefined,	  // unique node id
	samples:   1,             // sample count
	value:     [0, 0],        // sample counts per class
	impurity:  0,             // *not used
	criterion: "gini"         // *not used
});

const makeForkNode = () => ({
	id:          undefined,	  // unique node id
	type:        "",          // type, ROOT/LEFT/RIGHT
	leaf:        false,       // true if a leaf node
	samples:     0,           // sample count
	split_key:   "",          // split factor name
	split_point: 0,           // split factor value
	parent:      undefined,   // parent node id
	children:    []           // descendant tree nodes, ids
});

const makeLeafNode = () => ({
	id:            undefined, // unique node id
	type:          "",        // type, ROOT/LEFT/RIGHT
	leaf:          true,      // true if a leaf node
	samples:       0,         // sample count
	sample_counts: [0, 0],    // # classified target/non-target samples
	target:		   false,     // clasifies target or non-target samples?
	parent:        undefined, // parent node id
	children:      undefined  // descendant tree nodes, ids
});

/**
 * assign values from source object to destination object, for all
 * (shallow) properties that exist in both.
 *
 * Compare to the builtin Object.assign(dst, src), which copies over
 * all properties on src into dst. By contrast, `deriveObject` does
 * not add any new properties to dst. It just assigns the value from
 * src to dst, when a property in dst also exists in src.
 *
 * The idea is to create a clean object from a more complicated one by
 * just asking for the properties you care about.
 */
const deriveObject = (dst, src) => {
	for (var key in dst) {
		if (dst.hasOwnProperty(key) && src.hasOwnProperty(key))
			dst[key] = src[key];
	}
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
export function cleanRawR2D3Tree(raw) {
	const isLeaf = (n) => n.children == undefined;
	const isRoot = (n) => n.parent == undefined;

	// flatten embedded child nodes into a list
	const flattenTree = (root) => {
		if (isLeaf(root)) return [root];

		// more to do. recurse through children
		const assignParent = (n) => Object.assign({ parent : root}, n);
		root.children = root.children.map(assignParent);
		return [root, ..._.flatMap(root.children, flattenTree)];
	};

	// replace direct references with ids. works on single node
	const normalizeNode = (node) => {
		if (node.children)
			node.children = node.children.map(c => Number(c.id));
		if (node.parent)
			node.parent = parseInt(node.parent.id);
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
		if (n.value == undefined)
			throw new Error("Invalid tree input: no value on node");
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
	let tree = Object.assign({}, raw);
	tree = flattenTree(tree);		// make list, always first step
	tree = tree.map(addType);
	tree = tree.map(transformNode);
	tree = tree.map(normalizeNode); // normalize, always last step
	// return object: id -> node
	return tree.reduce((obj, node) => {
		obj[node.id] = node;
		return obj;
	}, {});
};
