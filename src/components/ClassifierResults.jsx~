import React from 'react';

const ClassifierResults = ({ width, sideA, sideB }) => {
    const accuracy = (sideA.correct + sideB.correct) / (sideA.total + sideB.total);
    return (<g className="classifier-results">
        <text x="300" font-size="9" text-anchor="middle">Training Accuracy</text>
        <text text-anchor="middle">{accuracy}%</text>
        <rect width={width} height="1" fill="#aaaaaa" />
        <ClassifierSide {...sideA} />
        <ClassifierSide {...sideB} />
    </g>);
};

const ClassifierSide = ({ correct, total, samples }) =>
    <g>
        <ClassifierFraction correct={correct} total={total} />
    </g>;

const ClassifierFraction = ({ correct, total }) =>
    <g className="classifier-fraction">
        <text font-size="22" fill="blue" text-anchor="end"  >{correct}</text>
        <text font-size="22" text-anchor="middle">/</text>
        <text font-size="22" fill="blue" text-anchor="start">{total}</text>
    </g>;

export default ClassifierResults;
