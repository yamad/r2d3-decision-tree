import React from 'react';
import _ from 'lodash';

import { make_hex_lattice_rhombus } from '../util.js';

const ClassifierAccuracy = ({ width, accuracy }) =>
	<g className="classifer-accuracy">
	      <text x={width * 0.5} y="-28" className="accuracy-label">Training Accuracy</text>
	      <text x={width * 0.5} y="-8"  className="accuracy-value">{accuracy}%</text>
	 </g>;

const ClassifierFraction = ({ x, correct, total }) =>
    <g className="classifier-fraction">
        <text x={x-3} y="-8" fill="blue" textAnchor="end"  >{correct}</text>
        <text x={x}   y="-8" textAnchor="middle">/</text>
        <text x={x+3} y="-8" fill="blue" textAnchor="start">{total}</text>
	      </g>;

const ClassifierSamples = ({ width, side}) => {
	let placementOrigin;
	let placementOrient;
	let transformX;

	switch (side) {
	case "LEFT":
		placementOrigin = "BOTTOM_LEFT";
		placementOrient = "SKEW_LEFT";
		transformX = 10;
		break;
	case "RIGHT":
	default:
		placementOrigin = "BOTTOM_RIGHT";
		placementOrient = "SKEW_RIGHT";
		transformX = width - 10 - 10;
		break;
	}

	const samplePlacement = make_hex_lattice_rhombus(4, 4, 2, 0, 0,
	                                                 placementOrigin,
	                                                 placementOrient);
	const a = _.map(Array(125), (n, i) => {
		const row = i % 5;
		const col = i / 5;
		return Object.assign({ id: i }, samplePlacement(row, col));
	});

	return <g transform={"translate("+transformX+",-5)"}>
		{a.map(n => <circle cx={n.x} cy={n.y} fill="gray" r="2" key={n.id} />)}
	</g>;
};



const ClassifierResults = ({ width, x, y, samples, progress }) => {
	let target_total = 0;
	let target_correct = 0;
	let nontarget_total = 0;
	let nontarget_correct = 0;
	samples.forEach((s, i) => {
		if (progress[i] < 1) return; // only process finished samples
		if (s.isTarget) {
			target_total++;
			if (s.target == 0) target_correct++;
		} else {
			nontarget_total++;
			if (s.target == 1) nontarget_correct++;
		}
	});

	const correct = target_correct + nontarget_correct;
	const total = target_total + nontarget_total;
	const accuracy = total > 0 ? Math.round((correct/total) * 1000) / 10 : 100;
	const left_anchor  = width * 0.37;
	const right_anchor = width * 0.63;

	return (
		<g className="classifier-results" transform={"translate("+x+","+y+")"}>
		  <ClassifierAccuracy width={width} accuracy={accuracy} />
		  <ClassifierFraction x={left_anchor} correct={target_correct} total={target_total} />
		  <ClassifierFraction x={right_anchor} correct={nontarget_correct} total={nontarget_total} />
		  <rect className="classifier-base" />
		</g>);
};


export default ClassifierResults;
