import React from 'react';
import d3 from 'd3';

import ClassifierResults from './ClassifierResults.jsx';
import { flattenObjectHierarchy } from '../util.js';
import { makeState } from '../state.js';

/* A DecisionTree draws a binary classification decision tree */
const DecisionTree = ({ tree_data, width, height }) => {
    const OFFSET = 7;

    const state = makeState(tree_data);

    const tree = d3.layout.tree()
                   .separation(() => 1); /* equal spacing for all nodes */

    /* get relative (x,y) positions for each tree node */
    const tree_nodes = tree.nodes(tree_data);
    const tree_leafs = tree_nodes.filter(n => n.children === undefined);
    const tree_links = tree.links(tree_nodes);

    /* map relative positions [0,1] to svg positions [width, height] */
    const xmargin = 20,
          ymargin = 20;
    const x_scale = d3.scale.linear()
                      .domain([0, 1])
                      .range([xmargin, width-xmargin]);
    const y_scale = d3.scale.linear()
                      .domain([0, 1])
                      .range([ymargin, height-200-ymargin]);

    const TreeNode = ({ x, y }) => <circle cx={x} cy={y} r="1.8" />;
    const TreeLeaf = ({ x, y }) => <rect x={x+OFFSET-1} y={y-14} width="2" height="14" stroke="black" />;
    const TreeLink = ({ src, dst }) => {
        var d1 = link_angled_path(src, dst, x_scale, y_scale, OFFSET);
        return (
            <g>
                <path d={d1} stroke-width="1" stroke="black" fill="none"/>
            </g>
        );
    };

    const TreeLinkList = ({ links }) =>
        <g className="links">
            {links.map(l => <TreeLink key={l.source+"-"+l.target}
                                      src={state.tree.nodes[l.source]}
                                      dst={state.tree.nodes[l.target]} />)}
        </g>;

    const TreeLeafList = ({ nodes }) =>
        <g className="leaves">
            {nodes.map(n => <TreeLeaf key={"leaf-"+n.id} x={x_scale(n.x)} y={y_scale(n.y)} />)}
        </g>;

    const sideA = { 'correct': 10,
                    'total'  : 20,
                    'samples' : [] };
    const sideB = { 'correct': 192,
                    'total'  : 200,
                    'samples' : [] };

    return (
        <svg width={width} height={height}>
            <g className="decision-tree">
                <TreeLeafList nodes={tree_leafs} />
                <TreeLinkList links={state.tree.links} />
                <ClassifierResults width={width} x="10" y="600" sideA={sideA} sideB={sideB} />
            </g>
        </svg>
    );
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
function link_angled_path(src, dst, x_scaler, y_scaler, offset=0, split_frac=0.3) {
    /* original/unscaled points -- A, B and M */
    let pa = { 'x': x_scaler(src.x), 'y': y_scaler(src.y) },
        pb = { 'x': x_scaler(dst.x), 'y': y_scaler(dst.y) },
        pm = { 'x': pb.x,
               'y': pa.y + (pb.y - pa.y) * split_frac };

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

    return 'M' + pa.x + ' ' + pa.y + ' ' +
           'L' + pm.x + ' ' + pm.y + ' ' +
           'L' + pb.x + ' ' + pb.y + ' ';
}

function make_pack_array(unit_width, unit_height, x_spacing, y_spacing, base_x, base_y) {
    const center_space_x = unit_width + x_spacing;
    const center_space_y = unit_height + y_spacing;
    return (row, col) => {
        return { 'x' : base_x + row * center_space_x,
                 'y' : base_y + col * center_space_y };
    };
};

/** returns a function that takes a row and column and returns its
   position in a hexagonal lattice with given parameters

   see http://www.redblobgames.com/grids/hexagons/#coordinates for
math */
function make_hex_lattice_rhombus(unit_width, unit_height, spacing,
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

export default DecisionTree;
