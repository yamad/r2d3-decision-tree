import React from 'react';
import _ from 'lodash';

import { link_angled_path, progressArray } from '../util.js';
import { makeState, makeSelector } from '../state.js';

import SampleSet from './SampleSet.jsx';
import TreePath from './TreePath.jsx';
import ClassifierResults from './ClassifierResults.jsx';

/* A DecisionTree draws a binary classification decision tree */
class DecisionTree extends React.Component {
	constructor(props) {
		super(props);
		this.state = { progress: 0,
		               interval: null };
		this.tick = this.tick.bind(this);
	}

	render() {
		const tree = this.props.tree;
		const state = makeState();
		const selector = makeSelector();

		const x_scale = selector.x_scaler(state),
		      y_scale = selector.y_scaler(state),
		      tree_scale = selector.y_tree_scaler(state);
		const { width, height } = selector.canvasSize(state);

		// add calculated point to each node
		const nodeToPoint = (node) => {
			const p = tree.points[node.id];
			return { x : x_scale(p.x),
			         y : tree_scale(p.y) };
		};
		const nodesToPoints = (nids) => nids.map(nid => nodeToPoint(tree_nodes[nid]));
		const treePathsPoints = _.mapValues(tree_paths, nodesToPoints);


		const TreeNode = ({ node }) => <circle cx={x_scale(node.x)} cy={y_scale(node.y)} r={state.ui.sample_radius} />;

		const TreeLeaf = ({ leaf }) => {
			let x = x_scale(tree.points[leaf.id].x);
			let y = tree_scale(tree.points[leaf.id].y) - 14;

			if (leaf.type === 'LEFT')  x += state.ui.tree_offset-1;
			if (leaf.type === 'RIGHT') x -= state.ui.tree_offset+1;
			const tclass = leaf.target ? "target" : "nontarget";

			return (<rect x={x} y={y}
			        className={"leaf "+ tclass}
			        width="2" height="14" /> );
		};
		const TreeLink = ({ src, dst }) => {
			var d1 = link_angled_path(src, dst, x_scale, tree_scale, state.ui.tree_offset);
			return (
				<g>
				  <path d={d1} stroke-width="1" stroke="gray" fill="none"/>
				</g>
			);
		};

		const TreePathList = ({ paths }) => {
			return <g className="paths">
				{_.map(paths, (p, id) => <TreePath key={"path-"+id} id={id} path={p} isTarget={tree_nodes[id].target} xscale={x_scale} yscale={y_scale} /> )}
			</g>;
		}

		const TreeLinkList = ({ links }) =>
			      <g className="links">
			      {links.map(l => <TreeLink key={l.source+"-"+l.target}
			                 src={tree.points[l.source]}
			                 dst={tree.points[l.target]} />)}
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


		// test
		const sampleProgress = progressArray(this.state.progress, 5, 0.3);
		const samples  = _.map(sampleProgress, (p) => { return { progress : p } });

		return (
			<svg width={width} height={height}>
			  <g className="decision-tree">
				<TreeLinkList links={_.values(tree.links)} />
				<TreeLeafList leaves={_.values(tree.leaves)} />
				<TreePathList paths={treePathsPoints} />
				<SampleSet samples={samples} name="test" />
				<ClassifierResults width={width} x="10" y="600" sideA={sideA} sideB={sideB} />
			  </g>
			</svg>
		);
	}

	tick() {
		this.setState({
			progress: this.state.progress + 0.01,
			interval: this.state.progress < 1 ? requestAnimationFrame(this.tick) : null
		});
	}

	componentDidMount() {
		window.addEventListener('keydown', (evt) => this.onKeyDown(evt));
	}

	onKeyDown(evt) {
		evt.keyCode === 32 && this.tick();
	}
}

export default DecisionTree;
