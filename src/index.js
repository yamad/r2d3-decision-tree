import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import DecisionTree from './components/DecisionTree.jsx';

import { tree_data, tree_training_set } from './tree-training-set-98.js';
import { makeDecisionTree, classifySampleSet } from './tree.js';

const tree = makeDecisionTree(tree_data);
let train_set = classifySampleSet(tree.nodes, tree_training_set);

_.forOwn(train_set.byPath, (samples, path_id) => {
	samples.forEach(s => _.set(s, "pathID", parseInt(path_id))); });
_.forEach(train_set.byTarget['target'], s => s.isTarget = true);
_.forEach(train_set.byTarget['nontarget'], s => s.isTarget = false);

train_set.samples = _.shuffle(_.flatten(_.values(train_set.byTarget)));
train_set.byTarget['target'] = _.filter(train_set.samples, s => s.isTarget);
train_set.byTarget['nontarget'] = _.filter(train_set.samples, s => !s.isTarget);

ReactDOM.render(<DecisionTree tree={tree} samples={train_set} />,
                document.getElementById('main'));
