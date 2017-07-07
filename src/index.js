import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import DecisionTree from './components/DecisionTree.jsx';

import { treeData, treeTrainingSet } from './tree-training-set-98.js';
import { makeDecisionTree } from './tree.js';

let tree = makeDecisionTree(treeData),
    trainSet = tree.classifySamples(treeTrainingSet);

// decorate samples (the tree does not mutate the samples at all)
_.forOwn(trainSet.byPath, (samples, path_id) =>
         samples.forEach(s => s["pathID"] = Number(path_id)));
trainSet.byTarget['target'].forEach(s => s.isTarget = true);
trainSet.byTarget['nontarget'].forEach(s => s.isTarget = false);

// random shuffle and resort, for aesthetics
trainSet.samples = _.shuffle(_.flatten(_.values(trainSet.byTarget)));
trainSet.byTarget['target'] = trainSet.samples.filter(s => s.isTarget);
trainSet.byTarget['nontarget'] = trainSet.samples.filter(s => !s.isTarget);

ReactDOM.render(<DecisionTree tree={tree} samples={trainSet} />,
                document.getElementById('main'));
