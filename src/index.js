var React = require('react');
import ReactDOM from 'react-dom';
import DecisionTree from './components/DecisionTree.jsx';

import { makeState, makeSelector } from './state.js';
import { tree_data } from './tree-training-set-98.js';

import { makeDecisionTree } from './tree.js';

const tree = makeDecisionTree(tree_data);

ReactDOM.render(<DecisionTree tree={tree} />,
                document.getElementById('main'));
