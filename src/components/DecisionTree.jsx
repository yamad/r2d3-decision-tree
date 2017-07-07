import React from 'react';
import _ from 'lodash';

import { progressArray, makeHexLatticeRhombus, treePathPixels } from '../util.js';
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

		const xScale = selector.xScale(state),
		      yScale = selector.yScale(state),
		      yTreeScale = selector.yTreeScale(state);
		const { width, height } = selector.canvasSize(state);

		const sampleProgress = progressArray(this.state.progress,
										   samples.samples.length, 0.2);

		// return the path in pixels to visit a list of nodes
		function nodesToPixels(nodePath, isTarget) {
			// return pixel point for a node
			function nodeToPoint(nodeId) {
				var p = tree.points[nodeId];
				return { x : xScale(p.x),
						 y : yTreeScale(p.y) };
			};

			let points = nodePath.map(nid => nodeToPoint(nid));
			return treePathPixels(points, isTarget,
								  xScale, yScale, state);
		}

		// paths in screen coordinates for all paths/routes through tree
		const pixelPaths = _.mapValues(tree.paths,
									   (path, id) => nodesToPixels(path, tree.nodes[id].target));

		// functions that give final pixel location in result set
		const placeTargets = makeHexLatticeRhombus(
			4, 4, 2, xScale(0),
		    yScale(state.ui.extent.results_training.max)-5,
		    "BOTTOM_LEFT",
		    "SKEW_LEFT");
		const placeNonTargets = makeHexLatticeRhombus(
			4, 4, 2, xScale(1),
		    yScale(state.ui.extent.results_training.max)-5,
		    "BOTTOM_RIGHT",
		    "SKEW_RIGHT");

		// calculate full path for each sample
		samples.byTarget['target'].forEach((s, i) => {
			var row = i % 5;  // 5 rows
			var col = i / 5;
			var result_p = placeTargets(row, col);
			s.path = [...pixelPaths[s.pathID], result_p];
		});
		samples.byTarget['nontarget'].forEach((s, i) => {
			var row = i % 5;  // 5 rows
			var col = i / 5;
			var result_p = placeNonTargets(row, col);
			s.path = [...pixelPaths[s.pathID], result_p];
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
					<TreePathList paths={pixelPaths}
								  state={state} />
				  </g>
				  <g className="tree-results">
					<ClassifierResults
					  width={width}
					  x="0"
					  y={yScale(state.ui.extent.results_training.max)}
					  samples={samples.samples}
					  progress={sampleProgress} />
				  </g>
				  <g> className="sample-sets">
					<SampleSet samples={samples.samples}
							   progresses={sampleProgress}
							   name="training" />
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
		var fps = 1000 / (FPS || 60);
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
