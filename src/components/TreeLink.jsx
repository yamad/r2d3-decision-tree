import React from 'react';
import { linkAngledPath } from '../util.js';

export function TreeLink({ src, dst, state, selector }) {
	var d1 = linkAngledPath(src, dst,
							  selector.xScale(state),
							  selector.yTreeScale(state),
							  state.ui.tree_offset);
	return (
		<g>
		  <path d={d1} className="tree-link" />
		</g>
	);
}

export function TreeLinkList({ links, tree, state, selector }) {
	return (
		<g className="links">
		  { links.map(l => <TreeLink key={l.source+"-"+l.target}
										 src={tree.points[l.source]}
										 dst={tree.points[l.target]}
										 state={state}
										 selector={selector} />)
		  }
	    </g>
	);
}
