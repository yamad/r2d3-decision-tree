import React from 'react';
import _ from 'lodash';

import { link_angled_path, progressArray, mapBy, interleave, angled_path_midpoint, make_hex_lattice_rhombus } from '../util.js';
import { makeState, makeSelector } from '../state.js';

import SampleSet from './SampleSet.jsx';
import TreePath from './TreePath.jsx';
import ClassifierResults from './ClassifierResults.jsx';

function treePathPixels(path, isTarget, xscale, yscale, state) {
	const tree_src = { 'x': path[0].x,
	                   'y': path[0].y - 10 };
	const tree_dst = { 'x': _.last(path).x,
	                   'y': yscale(state.ui.points.end_path.y) };

	let result_point;
	if (isTarget) result_point = state.ui.points.end_target;
	else          result_point = state.ui.points.end_nontarget;

	const result_src = { x: xscale(result_point.x),
	                     y: yscale(result_point.y) };

	// add midpoints
	const midpts = mapBy(2, 1, path, (a, b) => angled_path_midpoint(a, b));
	const tree_path = interleave(path, midpts);

	// construct entire path
	const full_path = [tree_src].concat(tree_path)
		      .concat([tree_dst, result_src]);
	return full_path;
}

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
		const samples = this.props.samples;
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
		const nodesToPoints = (nids) => nids.map(nid => nodeToPoint(tree.nodes[nid]));
		const treePathsPoints = _.mapValues(tree.paths, nodesToPoints);
		const treePathsPixels = _.mapValues(treePathsPoints,
		                              (path, id) => treePathPixels(path, tree.nodes[id].target, x_scale, y_scale, state));

		const TreeLeaf = ({ leaf }) => {
			let x = x_scale(tree.points[leaf.id].x);
			let y = tree_scale(tree.points[leaf.id].y) - 14;

			if (leaf.type === 'LEFT')  x += state.ui.tree_offset-1;
			if (leaf.type === 'RIGHT') x -= state.ui.tree_offset+1;
			const tclass = leaf.target ? "target" : "nontarget";

			return (<rect x={x} y={y}
			        className={"leaf "+ tclass} /> );
		};

		const TreeLink = ({ src, dst }) => {
			var d1 = link_angled_path(src, dst, x_scale, tree_scale, state.ui.tree_offset);
			return (
				<g>
				  <path d={d1} className="tree-link" />
				</g>
			);
		};

		const TreePathList = ({ paths }) =>
			<g className="paths">
				{_.map(paths, (p, id) => <TreePath key={"path-"+id} id={id} path={p} /> )}
			</g>;

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
		// sample preparation
		const treeProgress = progressArray(this.state.progress, samples.samples.length, 0.2);

		const placementOrigin = "BOTTOM_LEFT";
		const placementOrient = "SKEW_LEFT";
		const placeTargets = make_hex_lattice_rhombus(4, 4, 2, x_scale(0),
		                                              y_scale(state.ui.extent.results_training.max) - 5,
		                                              placementOrigin,
		                                              placementOrient);
		const placeNonTargets = make_hex_lattice_rhombus(4, 4, 2, x_scale(1),
		                                                 y_scale(state.ui.extent.results_training.max) - 5,
		                                                 "BOTTOM_RIGHT",
		                                                 "SKEW_RIGHT");
		samples.byTarget['target'].forEach((s, i) => {
			const row = i % 5;
			const col = i / 5;
			const result_p = placeTargets(row, col);
			s.path = treePathsPixels[s.pathID].concat(result_p);
		});
		samples.byTarget['nontarget'].forEach((s, i) => {
			const row = i % 5;
			const col = i / 5;
			const result_p = placeNonTargets(row, col);
			s.path = treePathsPixels[s.pathID].concat(result_p);
		});

		return (
			<svg width={width} height={height}>
			  <g className="decision-tree">
				<TreeLinkList links={_.values(tree.links)} />
				<TreeLeafList leaves={_.values(tree.leaves)} />
				<TreePathList paths={treePathsPixels} />
			  </g>
			  <g className="tree-results">
				<ClassifierResults width={width} x="0" y={y_scale(state.ui.extent.results_training.max)} samples={samples.samples} progress={treeProgress} />
			  </g>
			  <g> className="sample-sets">
				<SampleSet samples={samples.samples} progresses={treeProgress} name="training" />
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
