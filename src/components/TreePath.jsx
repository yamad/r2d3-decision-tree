import React from 'react';
import _ from 'lodash';
import { pointsToSVGLinePath } from '../util.js';

export function TreePath( { id, path } ) {
	var svg_path = pointsToSVGLinePath(path);
	return (
		<path d={svg_path} id={"path-"+id} className="tree-path" />
	);
};

export function TreePathList({ paths }) {
	return (
		<g className="paths">
		  { _.map(paths, (p, id) => <TreePath key={"path-"+id} id={id} path={p} />) }
		</g>
	);
}
