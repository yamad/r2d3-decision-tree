import React from 'react';

export function TreeLeaf({ leaf, tree, state, selector }) {
	let x = selector.xScale(state)(tree.points[leaf.id].x),
		y = selector.yTreeScale(state)(tree.points[leaf.id].y) - 14;

	if (leaf.type === 'LEFT')
		x += state.ui.tree_offset-1;
	if (leaf.type === 'RIGHT')
		x -= state.ui.tree_offset+1;

	const tclass = leaf.target ? "target" : "nontarget";

	return (
		<rect x={x} y={y} className={"leaf "+ tclass} />
	);
}

export function TreeLeafList({ leaves, tree, state, selector }) {
	return (
		<g className="leaves">
		  { leaves.map(l => <TreeLeaf key={"leaf-"+l.id}
										  leaf={l}
										  tree={tree}
										  state={state}
										  selector={selector}
									  />) }
		</g>
	);
}
