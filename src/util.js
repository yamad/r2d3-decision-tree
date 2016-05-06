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


/** Generates svg path from source to destination,
 *  using two line segments, a diagonal line then vertical line.
 *
 * @param src         source point      (needs x, y attributes)
 * @param dst         destination point (needs x, y attributes)
 * @param x_scaler    conversion function for x scale, usually from d3.scale
 * @param y_scaler    conversion function for y scale, usually from d3.scale
 * @param offset      optional offset (in scaled units), positive is 'smaller'
 * @param split_frac  where to split vertical length for diag/vert parts
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
export function link_angled_path(src, dst, x_scaler, y_scaler, offset=0, split_frac=0.3) {
    /* original/unscaled points -- A, B and M */
    let pa = { 'x': x_scaler(src.x), 'y': y_scaler(src.y) },
        pb = { 'x': x_scaler(dst.x), 'y': y_scaler(dst.y) },
        pm = angled_path_midpoint(pa, pb, split_frac);

    if (offset != 0) {
        /* correct signs */
        const xoff = (pb.x - pa.x) > 0 ? -offset : +offset,
              yoff = (pa.y - pb.y) > 0 ? -offset : +offset;

        /* triangle with hypoteneuse A-M */
        const pm_dx = pm.x - pa.x,
              pm_dy = pm.y - pa.y,
              theta = Math.atan(pm_dx/pm_dy); /* angle wrt center */

        /* calculate offset points */
        pa.y += yoff;
        pb.x += xoff;
        pm.x = pb.x;
        /* find y in offset traingle to maintain angle theta */
        pm.y = pa.y + ((pb.x - pa.x) / Math.tan(theta));
    }

	return pointsToSVGLinePath([pa, pm, pb]);
}

// return intermediate point between src and dst
export function angled_path_midpoint(src, dst, split_frac = 0.3) {
	return { 'x': dst.x,
	         'y': src.y + (dst.y - src.y) * split_frac };
}


/** returns a function that takes a row and column and returns its
   position in a hexagonal lattice with given parameters

   see http://www.redblobgames.com/grids/hexagons/#coordinates for
math */
export function make_hex_lattice_rhombus(unit_width, unit_height, spacing,
                                  base_x, base_y, origin="BOTTOM_LEFT",
                                  orientation="SKEW_LEFT") {
    const size_x = (unit_width  + spacing) / 2;
    const size_y = (unit_height + spacing) / 2;

    /* function returns pixel location from axial coordinates
     * is 'q' axis skewed left or right?
     */
    let hex_to_pixel;
    switch (orientation) {
        case "SKEW_RIGHT":
            hex_to_pixel = (r, q) => {
                return { 'x' : size_x * Math.sqrt(3) * (q + r/2),
                         'y' : size_y * 3/2 * r }; };
            break;
        case "SKEW_LEFT":
        default:
            hex_to_pixel = (r, q) => {
                return { 'x' : size_x * Math.sqrt(3) * (q + -r/2),
                         'y' : size_y * 3/2 * r }; };
            break;
    }

    /* change r and q axes origin */
    let to_pixel;
    switch (origin) {
        case "TOP_RIGHT":
            to_pixel = (r, q) => hex_to_pixel( r, -q);
            break;
        case "BOTTOM_LEFT":
            to_pixel = (r, q) => hex_to_pixel(-r,  q);
            break;
        case "BOTTOM_RIGHT":
            to_pixel = (r, q) => hex_to_pixel(-r, -q);
            break;
        case "TOP_LEFT":
        default:
            to_pixel = (r, q) => hex_to_pixel( r,  q);
            break;
    }

    return (row, col) => {
        const p = to_pixel(row, col);
        return { 'x' : base_x + p.x,
                 'y' : base_y + p.y };
    };
};
