import React from 'react';
import _ from 'lodash';

import { progressArray, make_hex_lattice_rhombus, treePathPixels } from '../util.js';
import { makeState, makeSelector } from '../state.js';

import SampleSet from './SampleSet.jsx';
import { TreePathList } from './TreePath.jsx';
import { TreeLinkList } from './TreeLink.jsx';
import { TreeLeafList } from './TreeLeaf.jsx';
import ClassifierResults from './ClassifierResults.jsx';

const FPS = 20;


/** A DecisionTree draws a binary classification decision tree */
class DecisionTree extends React.Component {
	constructor(props) {
		super(props);
		this.state = this.inital_state();

		this.tick = this.tick.bind(this);
		this.startstop = this.startstop.bind(this);
		this.reset = this.reset.bind(this);
	}

	inital_state() {
		return { progress: 0,
			     interval: null,
			     animating: false };
	}

	render() {
		const tree = this.props.tree;
		const samples = this.props.samples;
		const state = makeState();
		const selector = makeSelector();

		const x_scale = selector.xScale(state),
		      y_scale = selector.yScale(state),
		      tree_scale = selector.yTreeScale(state);
		const { width, height } = selector.canvasSize(state);

		// add pixel point to each node
		const attachPoint = (node) => {
			const p = tree.points[node.id];
			return { x : x_scale(p.x),
			         y : tree_scale(p.y) };
		};
		const nodesToPoints = (nids) => nids.map(nid => attachPoint(tree.nodes[nid]));
		const treePathsPoints = _.mapValues(tree.paths, nodesToPoints);
		const treePathsPixels = _.mapValues(treePathsPoints,
		                                    (path, id) => treePathPixels(path, tree.nodes[id].target, x_scale, y_scale, state));

		// sample preparation
		let treeProgress = progressArray(this.state.progress, samples.samples.length, 0.2);

		const placeTargets = make_hex_lattice_rhombus(4, 4, 2, x_scale(0),
		                                              y_scale(state.ui.extent.results_training.max)-5,
		                                              "BOTTOM_LEFT",
		                                              "SKEW_LEFT");
		const placeNonTargets = make_hex_lattice_rhombus(4, 4, 2, x_scale(1),
		                                                 y_scale(state.ui.extent.results_training.max)-5,
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
			<div>
			  <div id="fullsvg">
				<svg width={width} height={height}>
				  <g className="decision-tree">
					<TreeLinkList links={_.values(tree.links)} tree={tree}
								  state={state} selector={selector} />
					<TreeLeafList leaves={_.values(tree.leaves)} tree={tree}
								  state={state} selector={selector} />
					<TreePathList paths={treePathsPixels}
								  state={state} />
				  </g>
				  <g className="tree-results">
					<ClassifierResults
					  width={width}
					  x="0"
					  y={y_scale(state.ui.extent.results_training.max)}
					  samples={samples.samples}
					  progress={treeProgress} />
				  </g>
				  <g> className="sample-sets">
					<SampleSet samples={samples.samples} progresses={treeProgress} name="training" />
				  </g>
				</svg>
				</div>
				<div>
				  <button id="go">
					{!this.state.animating ? 'Start' : 'Stop'}
				  </button>
				  <button id="reset">Reset</button>
				</div>
			  </div>
		);
	}

	tick() {
		if (this.state.animating)
			this.setState((prev) => this._tick(prev));
	}

	_tick(prev) {
		let fps = 1000 / (FPS || 60);
		return { progress: prev.progress + 0.004,
				 interval: setTimeout(() => requestAnimationFrame(this.tick), fps)
			   };
	}

	startstop() {
		if (this.state.animating)
			this.setState({ animating: false,
						    interval: null });
		else {
			this.setState(
				(prev) => Object.assign({ animating: true }, this._tick(prev)));
		}
	}

	reset() {
		this.setState(this.inital_state());
	}

	componentDidMount() {
		window.addEventListener('keydown', (evt) => this.onKeyDown(evt));
		document.getElementById('go')
			.addEventListener('click', this.startstop);
		document.getElementById('reset')
			.addEventListener('mousedown', this.reset);
		document.getElementById('fullsvg')
			.addEventListener('mousedown', this.startstop);
	}

	onKeyDown(evt) {
		evt.keyCode === 32 && this.startstop(); // spacebar
		evt.keyCode === 13 && this.reset();     // return
	}
}

export default DecisionTree;
