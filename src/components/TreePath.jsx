import React from 'react';
import { pointsToSVGLinePath } from '../util.js';

const TreePath = ( { id, path } ) => {
	const svg_path = pointsToSVGLinePath(path);
	return <path d={svg_path} id={"path-"+id} className="tree-path" />;
};

export default TreePath;
