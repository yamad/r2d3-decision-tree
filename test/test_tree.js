
import test from 'tape';

import _ from 'lodash';
import { makeDecisionTree } from '../src/tree.js';
import { treeData, treeTrainingSet } from '../src/tree-training-set-98.js';

test('A decision tree', (t) => {
	t.ok(makeDecisionTree(treeData),
	     "should construct successfully");

	const dt = makeDecisionTree(treeData);
	const splits = dt.applySamples(treeTrainingSet);
	t.ok(dt.applySamples(treeTrainingSet),
	    "should classify sample sets correctly");

	t.end();
});


test("Decorating samples spike", (t) => {
	const tree = makeDecisionTree(treeData);
	let train_set = tree.classifySamples(treeTrainingSet);

	_.forOwn(train_set.byPath, (samples, path_id) => {
		samples.forEach(s => _.set(s, "path", parseInt(path_id))); });
	_.forEach(train_set.byTarget['target'], s => s.isTarget = true);
	_.forEach(train_set.byTarget['non-target'], s => s.isTarget = false);

	train_set.samples = _.flatten(_.values(train_set.byTarget));

	//t.equal(train_set.samples[0].path, 0);
	//t.equal(train_set.samples[0].isTarget, 0);

	t.end();
});
