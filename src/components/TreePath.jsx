import React from 'react';
import { angled_path_midpoint, pointsToSVGLinePath, interleave, mapBy } from '../util.js';
import _ from 'lodash';

const TreePath = ( { id, path, isTarget, xscale, yscale } ) => {
	const tree_src = { 'x': path[0].x,
	                   'y': path[0].y - 10 };
	const tree_dst = { 'x': _.last(path).x,
	                   'y': yscale(0.97) };

	let result_src = { 'x': null,
	                   'y': yscale(1) };
	if (isTarget)
		result_src.x = xscale(0.25);
	else
		result_src.x = xscale(0.75);

	// add midpoints
	const midpts = mapBy(2, 1, path, (a, b) => angled_path_midpoint(a, b));
	const tree_path = interleave(path, midpts);

	// construct entire path
	const full_path = [tree_src].concat(tree_path)
		      .concat([tree_dst, result_src]);
	const svg_path = pointsToSVGLinePath(full_path);

	return <path d={svg_path} stroke="blue" fill="none" id={"path-"+id} />;
};

export default TreePath;
