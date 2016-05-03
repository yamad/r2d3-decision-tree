import test from 'tape';

import { makeDecisionTree } from '../src/tree.js';
import { tree_data, tree_training_set } from '../src/tree-training-set-98.js';

test('A decision tree', (t) => {
	t.ok(makeDecisionTree(tree_data),
	     "should construct successfully");

	const dt = makeDecisionTree(tree_data);
	const splits = dt.applySampleSet(tree_training_set);
	t.ok(dt.applySampleSet(tree_training_set),
	    "should classify sample sets correctly");

	t.end();
});
