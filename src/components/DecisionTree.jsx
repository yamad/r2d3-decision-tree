import React from 'react';
import d3 from 'd3';
import _ from 'lodash';
import deepFreeze from 'deep-freeze';

import ClassifierResults from './ClassifierResults.jsx';
import { pointsToSVGLinePath, mapBy, interleave, link_angled_path, angled_path_midpoint } from '../util.js';
import { makeState, makeSelector } from '../state.js';
import { getRoot, getLeaves, getPaths, clean_r2d3_tree_data } from '../tree.js';

/* A DecisionTree draws a binary classification decision tree */
const DecisionTree = ({ tree_data }) => {
    const state = makeState(tree_data);
	const selector = makeSelector();
	let nodes = clean_r2d3_tree_data(tree_data);

    const x_scale = selector.x_scaler(state),
          y_scale = selector.y_scaler(state);
    const { width, height } = selector.canvasSize(state);

	// use d3 to calculate node positions.
	//
	// collect positions from d3.layout.tree().nodes() but avoid
	// mutations by copying the tree before d3 gets it.
	const findPoints = (nodes) => {
		const clone_nodes = _.cloneDeep(nodes);
		const layout = d3.layout.tree()
			      .separation(() => 1)
			      .children((d) => _.map(d.children, (a) => clone_nodes[a]));

		const tree_nodes = layout.nodes(getRoot(clone_nodes)); // destructive change!

		// node position points keyed by node id
		const points = _.keyBy(_.map(tree_nodes, n => _.pick(n, ['id', 'x', 'y'])), 'id');

		// all links for tree, ids instead of direct references
		const links  = _.map(layout.links(tree_nodes), l => _.mapValues(l, a => a.id));
		return [ points, links ];
	};

	const [ points, tree_links ] = findPoints(nodes);
	// add calculated point to each node
	const tree_nodes = _.mapValues(nodes, n => _.merge(n, points[n.id]));
	const tree_leaves = getLeaves(tree_nodes);
	const tree_paths  = getPaths(tree_nodes);

    const nodeToPoint   = (node) => ({ x : x_scale(node.x),
                                       y : y_scale(node.y) });
	const nodesToPoints = (nids) => nids.map(nid => nodeToPoint(tree_nodes[nid]));
	const treePathsPoints = _.mapValues(tree_paths, nodesToPoints);

	const TreePath = ({ id, path }) => {
		const tree_src = { 'x': path[0].x,
		                   'y': path[0].y - 10 };
		const tree_dst = { 'x': _.last(path).x,
		                   'y': y_scale(0.97) };

		let result_src = { 'x': null,
		                   'y': y_scale(1) };
		if (tree_nodes[id].target)
			result_src.x = x_scale(0.25);
		else
			result_src.x = x_scale(0.75);

		// add midpoints
		const midpts = mapBy(2, 1, path, (a, b) => angled_path_midpoint(a, b));
		const tree_path = interleave(path, midpts);

		// construct entire path
		const full_path = [tree_src].concat(tree_path)
			      .concat([tree_dst, result_src]);
		const svg_path = pointsToSVGLinePath(full_path);

		return <path d={svg_path} stroke="blue" fill="none" />;
	};

	const TreeNode = ({ node }) => <circle cx={x_scale(node.x)} cy={y_scale(node.y)} r={state.ui.sample_radius} />;

	const TreeLeaf = ({ leaf }) => {
		let x = x_scale(leaf.x);
		let y = y_scale(leaf.y) - 14;

		if (leaf.type === 'LEFT')  x += state.ui.tree_offset-1;
		if (leaf.type === 'RIGHT') x -= state.ui.tree_offset+1;
		const tclass = leaf.target ? "target" : "nontarget";

		return (<rect x={x} y={y}
		        className={"leaf "+ tclass}
		        width="2" height="14" /> );
	};
    const TreeLink = ({ src, dst }) => {
        var d1 = link_angled_path(src, dst, x_scale, y_scale, state.ui.tree_offset);
        return (
            <g>
                <path d={d1} stroke-width="1" stroke="gray" fill="none"/>
            </g>
        );
    };

	const TreePathList = ({ paths }) =>
		      <g className="paths">
		      {_.map(paths, (p, id) => <TreePath key={id} id={id} path={p} />)}
	</g>;

    const TreeLinkList = ({ state, links }) =>
        <g className="links">
            {links.map(l => <TreeLink key={l.source+"-"+l.target}
                                      src={nodes[l.source]}
                                      dst={nodes[l.target]} />)}
        </g>;

    const TreeLeafList = ({ leaves }) =>
	          <g className="leaves">
	          {leaves.map(l => <TreeLeaf key={"leaf-"+l.id} leaf={l} />)}
	</g>;

	const TreeNodeList = ({ nodes }) =>
		      <g classNames="nodes">
		      {nodes.map(n => <TreeNode key={"node-"+n.id} node={n} />)}
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
              <TreeNodeList nodes={_.values(nodes)} />
              <TreeLinkList links={_.values(tree_links)} />
              <TreeLeafList leaves={_.values(tree_leaves)} />
			  <TreePathList paths={treePathsPoints} />
              <ClassifierResults width={width} x="10" y="600" sideA={sideA} sideB={sideB} />
            </g>
        </svg>
    );
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
