// assertion utility code from Eloquent Javascript
export function AssertionFailed(message) {
	this.message = message;
}
AssertionFailed.prototype = Object.create(Error.prototype);

function assert(test, message) {
	if (!test)
		throw new AssertionFailed(message);
}


/**
 * return SVG linear path from a list of {x, y} points
 *
 * see section 8 of SVG spec
 */
export const pointsToSVGLinePath = (points) => {
	if (points.length < 1)
		return '';

	// 'M' followed by >1 points have implicit 'L' commands between points
	const pathSegment = (p) => ' ' + p.x + ' ' + p.y;
	return ["M", ...points.map(pathSegment)].join("");
};


/**
 * split `array` into chunks of size `n`, skipping `k` elements before
 * starting the next chunk. If `array` can't be split evenly, final
 * chunk is remaining elements.
 *
 * like lodash's `chunk` but allows for overlapping groups for, say,
 * moving window averaging.
 */
export const chunkBy = (n, k, array) => {
	if (k <= 0)             return [];
	if (array.length === 0) return [];
	if (array.length < n)   return [array];
	if (n < 1)
		n = 0;
	return [array.slice(0, n), ...chunkBy(n, k, array.slice(k))];
};


/**
 * map over array with function `f` of `n` args, skipping `k`
 * elements each iteration
 *
 * the last iteration is skipped if there are not enough elements
 * left.
 *
 * e.g.
 *  mapBy(2, 2, [1,2,3,4], (a, b) => a + b)  --> [3,7]
 *  mapBy(2, 1, [1,2,3,4], (a, b) => a + b)  --> [3,5,7]
 */
export const mapBy = (n, k, array, f) => {
	if (array.length < n)
		return [];
	const chunks = chunkBy(n, k, array).filter(c => c.length === n);
	return chunks.map(c => f(...c));
};


/** interleave elements of two arrays */
export const interleave = (a, b) => {
	if (a.length === 0)
		return b;
	if (b.length === 0)
		return a;
	return [a[0], b[0], ...interleave(a.slice(1), b.slice(1))];
};


/** returns pixel coordinates for every point in a (normalized) path */
export function treePathPixels(path, isTarget, xScale, yScale, state) {
	const treeSrc = { 'x': path[0].x,
	                  'y': path[0].y - 10 };
	const treeDst = { 'x': path[path.length-1].x,
	                  'y': yScale(state.ui.points.end_path.y) };

	let resultPoint = state.ui.points[isTarget ? "end_target" : "end_nontarget"],
	    resultSrc = { x: xScale(resultPoint.x),
	                   y: yScale(resultPoint.y) };

	// add midpoints
	const midpts = mapBy(2, 1, path, (a, b) => angledPathMidpoint(a, b));
	const treePath = interleave(path, midpts);

	// return entire path
	return [treeSrc, ...treePath, treeDst, resultSrc];
}


/** Generates svg path from source to destination,
 *  using two line segments, a diagonal line then vertical line.
 *
 * @param src         source point      (needs x, y attributes)
 * @param dst         destination point (needs x, y attributes)
 * @param xScale      conversion function for x scale, usually from d3.scale
 * @param yScale      conversion function for y scale, usually from d3.scale
 * @param offset      optional offset (in scaled units), positive is 'smaller'
 * @param splitFrac   where to split vertical length for diag/vert parts
 *
 *  e.g.,            (internally)
 *       src              A
 *       /               /
 *      /               /
 *     |               M
 *     |               |
 *     |               |
 *    dst              B
 *
 * Implementation note: With no offset, this function does very little
 * other than calculate the intermediate point M and format the
 * path. With an offset, things are little trickier.
 *
 * The goal is to get an even offset along the entire path. The
 * calculations for horizontal and vertical offsets are obvious, but
 * keeping the angled portion of the path parallel to the non-offset
 * version is harder. Recalcuating or scaling creates an angle that is
 * too steep. The original R2D3 code uses a strategy that seems
 * convoluted. There must be an easier way.
 *
 * And there is, but it took a bit of thought. To make parallel lines,
 * we have to make two lines with the same angle. So to make an offset
 * line, we calculate the angle of the non-offset line and then make
 * another line with the same angle. But how long do we make the line?
 * We know one endpoint---it is the offset point A'. We also know the
 * x position of the other endpoint---we go vertically down to offset
 * point B' so B' and the second endpoint share their x value. What's
 * left is the y position, which turns out to correspond to the length
 * of one leg of a right triangle for which we know an angle and the
 * length of its opposite leg.
 */
export function linkAngledPath(src, dst, xScale, yScale, offset=0, splitFrac=0.3) {
	// original/unscaled points -- A, B and M
	let pa = { 'x': xScale(src.x), 'y': yScale(src.y) },
	    pb = { 'x': xScale(dst.x), 'y': yScale(dst.y) },
	    pm = angledPathMidpoint(pa, pb, splitFrac);

	if (offset != 0) {
		// correct signs
		const xoff = (pb.x - pa.x) > 0 ? -offset : +offset,
		      yoff = (pa.y - pb.y) > 0 ? -offset : +offset;

		// triangle with hypoteneuse A-M
		const pmDx = pm.x - pa.x,
		      pmDy = pm.y - pa.y,
		      theta = Math.atan(pmDx/pmDy); // angle wrt center

		// calculate offset points
		pa.y += yoff;
		pb.x += xoff;
		pm.x = pb.x;
		// find y in offset traingle to maintain angle theta */
		pm.y = pa.y + ((pb.x - pa.x) / Math.tan(theta));
	}

	return pointsToSVGLinePath([pa, pm, pb]);
}

// return intermediate point between src and dst
export function angledPathMidpoint(src, dst, splitFrac = 0.3) {
	return { 'x': dst.x,
	         'y': src.y + (dst.y - src.y) * splitFrac };
}


/**
 * Returns a function that takes a row and column and returns its
 * position in a hexagonal lattice with given parameters
 *
 * see http://www.redblobgames.com/grids/hexagons/#coordinates for
 * math
 */
export function makeHexLatticeRhombus(unitWidth, unitHeight, spacing,
                                      baseX, baseY, origin="BOTTOM_LEFT",
                                      orientation="SKEW_LEFT") {
	const sizeX = (unitWidth  + spacing) / 2;
	const sizeY = (unitHeight + spacing) / 2;

	/* function returns pixel location from axial coordinates
	 * is 'q' axis skewed left or right?
	 */
	let hexToPixel;
	switch (orientation) {
	case "SKEW_RIGHT":
		hexToPixel = (r, q) => {
			return { 'x' : sizeX * Math.sqrt(3) * (q + r/2),
			         'y' : sizeY * 3/2 * r }; };
		break;
	case "SKEW_LEFT":
	default:
		hexToPixel = (r, q) => {
			return { 'x' : sizeX * Math.sqrt(3) * (q + -r/2),
			         'y' : sizeY * 3/2 * r }; };
		break;
	}

	/* change r and q axes origin */
	let toPixel;
	switch (origin) {
	case "TOP_RIGHT":
		toPixel = (r, q) => hexToPixel( r, -q);
		break;
	case "BOTTOM_LEFT":
		toPixel = (r, q) => hexToPixel(-r,  q);
		break;
	case "BOTTOM_RIGHT":
		toPixel = (r, q) => hexToPixel(-r, -q);
		break;
	case "TOP_LEFT":
	default:
		toPixel = (r, q) => hexToPixel( r,  q);
		break;
	}

	return (row, col) => {
		const p = toPixel(row, col);
		return { 'x' : baseX + p.x,
		         'y' : baseY + p.y };
	};
}


/** return list of `n` progress markers for master progress value `progress` */
// TODO: there is probably a shortcut more efficient way to map
// between parent progress and child progress
export function progressArray(progress, n, nspan) {
	function normalize(x, lo, hi) {
		var normed = (x - lo) / (hi - lo);
		// clamp between 0 and 1
		return Math.max(0, Math.min(1, normed));
	}

	nspan = nspan || undefined;
	if (n < 1) return [];
	return Array(n).fill(undefined).map((_, i) => {
		let [ lo, hi ] = progressDomain(i, n, nspan);
		return normalize(progress, lo, hi);
	});
}


/**
 * create domain for function mapping a portion of a parent progress
 * to local progress [0, 1]
 *
 * creates even spacing for `n` elements, returning the domain for the
 * `kth` element (0-indexed).
 *
 * e.g. given an animation of 2 elements, the global progress runs from 0
 * to 1 and each element's animation runs for a portion of that. this
 * function determines the portion during which the sub-element runs.
 */
export function progressDomain(k, n, distance) {
	assert(k < n, "element k must be from 0 to n-1");

	// guard divide-by-zero errors
	if (n < 1)  return [0, 0];
	if (n == 1) return [0, 1];

	let interval = 1 / n;
	distance = distance || (1 - interval);
	interval = 1 - distance;

	const s = k * (interval / (n-1));
	return [ s, s + distance ];
}
