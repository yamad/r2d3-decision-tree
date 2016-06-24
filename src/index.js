var React = require('react');
import ReactDOM from 'react-dom';
import DecisionTree from './components/DecisionTree.jsx';
import { tree_data, tree_training_set, tree_stats, tree_test_set, test_stats } from './tree-training-set-98.js';

ReactDOM.render(
	<DecisionTree tree_data={tree_data} />,
	document.getElementById('main'));
