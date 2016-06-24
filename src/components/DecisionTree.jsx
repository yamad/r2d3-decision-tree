import React from 'react';
import d3 from 'd3';
import _ from 'lodash';
import deepFreeze from 'deep-freeze';

import ClassifierResults from './ClassifierResults.jsx';
import { pointsToSVGLinePath, mapBy, interleave, link_angled_path, angled_path_midpoint, progressArray, progressDomain } from '../util.js';
import { makeState, makeSelector } from '../state.js';
import { getRoot, getLeaves, getPaths, clean_r2d3_tree_data } from '../tree.js';

import SampleSet from './SampleSet.jsx';
import TreePath from './TreePath.jsx';

/* A DecisionTree draws a binary classification decision tree */
class DecisionTree extends React.Component {
	constructor(props) {
		super(props);
		this.state = { progress: 0,
		               interval: null };
		this.tick = this.tick.bind(this);
	}

	render() {
		const tree_data = this.props.tree_data;
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

		const TreePathList = ({ paths }) => {
			return <g className="paths">
				{_.map(paths, (p, id) => <TreePath key={"path-"+id} id={id} path={p} isTarget={tree_nodes[id].target} xscale={x_scale} yscale={y_scale} /> )}
			</g>;
		}

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


		// test
		const sampleProgress = progressArray(this.state.progress, 5, 0.3);
		const samples  = _.map(sampleProgress, (p) => { return { progress : p } });

		return (
			<svg width={width} height={height}>
			  <g className="decision-tree">
				<TreeLinkList links={_.values(tree_links)} />
				<TreeLeafList leaves={_.values(tree_leaves)} />
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
