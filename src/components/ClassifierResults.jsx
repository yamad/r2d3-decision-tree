import React from 'react';

const ClassifierResults = ({ width, x, y, sideA, sideB }) => {
    const accuracy = Math.round((sideA.correct + sideB.correct) / (sideA.total + sideB.total) * 1000) / 10;
    const left_anchor  = width * 0.37;
    const right_anchor = width * 0.63;

    return (
        <g className="classifier-results" transform={"translate("+x+","+y+")"}>
            <text x={width * 0.5} y="-28" fontSize="9"  textAnchor="middle">Training Accuracy</text>
            <text x={width * 0.5} y="-8"  fontSize="18" textAnchor="middle">{accuracy}%</text>
            <rect width={width} height="1" fill="#aaaaaa" />
            <ClassifierSide x={left_anchor}  {...sideA} />
            <ClassifierSide x={right_anchor} {...sideB} />
        </g>);
};

const ClassifierSide = ({ x, correct, total, samples }) =>
    <g>
        <ClassifierFraction x={x} correct={correct} total={total} />
    </g>;

const ClassifierFraction = ({ x, correct, total }) =>
    <g className="classifier-fraction">
        <text x={x-3} y="-8" fontSize="16" fill="blue" textAnchor="end"  >{correct}</text>
        <text x={x}   y="-8" fontSize="16" textAnchor="middle">/</text>
        <text x={x+3} y="-8" fontSize="16" fill="blue" textAnchor="start">{total}</text>
    </g>;

export default ClassifierResults;
