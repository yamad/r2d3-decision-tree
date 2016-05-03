import _ from 'lodash';

// return list of all child objects of root
export const flattenObjectHierarchy = (root) => {
	if (root === undefined) return [];

	// replace direct references with ids
	const new_root =
		      Object.assign({}, root,
		                    { children: _.map(root.children, (o) => o.id),
		                      keey: root.key,
		                      val: root.value
		                    });
	return [new_root].concat(
		_.flatMap(root.children, flattenObjectHierarchy));
};

// return SVG linear path from a list of {x, y} points
//
// see section 8 of SVG spec
export const pointsToSVGLinePath = (points) => {
	const size = _.size(points);
	if (size < 1) return '';

	// 'M' followed by >1 points have implicit 'L' commands between points
	const pathSegment = (p) => ' ' + p.x + ' ' + p.y;
	return _.reduce(_.map(points, pathSegment), (a,b) => (a + b), 'M');
};


//  split `array` into chunks of size `n`, skipping `k` elements
//  before starting the next chunk. If `array` can't be split evenly,
//  final chunk is remaining elements.
//
//  like lodash's `chunk` but allows for overlapping groups for,
//  say, moving window averaging.
export const chunkBy = (n, k, array) => {
	if (k <= 0)             return [];
	if (array.length === 0) return array;
	if (array.length < n)   return [array];
	return [_.take(array, n)].concat(chunkBy(n, k, _.drop(array, k)));
};

/** map over array with function `f` of `n` args, skipping `k`
 *  elements each iteration
 *
 *  the last iteration is skipped if there are not enough elements
 *  left.
 *
 *  e.g.
 *   mapBy(2, 2, [1,2,3,4], (a, b) => a + b)  --> [3,7]
 *   mapBy(2, 1, [1,2,3,4], (a, b) => a + b)  --> [3,5,7]
 */
export const mapBy = (n, k, array, f) => {
	if (array.length < n) return [];
	const chunks = chunkBy(n, k, array);
	return _.map(_.filter(chunks, (c) => c.length === n),
	             (c) => f.apply(null, c));
};

/** interleave elements of two arrays */
export const interleave = (a, b) => {
	if (a.length === 0) return b;
	if (b.length === 0) return a;
	return [_.head(a), _.head(b)].concat(interleave(_.tail(a), _.tail(b)));
};
