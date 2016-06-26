import test from 'tape';

import _ from 'lodash';
import { clean_r2d3_tree_data } from '../src/tree.js';

test("cleaning data returns flattened dictionary keyed by id", (t) => {
	const input = { id: 0,
	                value: 10,
	                children: [ { id: 1, value: 20 } ] };

	const expected = { 0 : { id: 0, children: [ 1 ] },
	                   1 : { id: 1, children: []    }};

 	const actual   = clean_r2d3_tree_data(input);

	_.forIn(actual, (v, id) => {
		t.equal(v['id'], expected[id]['id']);
		t.deepEqual(v['children'], expected[id]['children']);
	});

	t.end();
});

test("cleaning data returns proper type for each node", (t) => {
	const input = { id: 0,
	                value: 10,
	                children: [ { id: 1, value: 20 },
	                            { id: 2, value: 30 } ]};

	const expected = { 0: { type: 'ROOT' },
	                   1: { type: 'LEFT' },
	                   2: { type: 'RIGHT' } };

	const actual = clean_r2d3_tree_data(input);
	_.forIn(actual, (v, id) => {
		t.equal(expected[id].type, v.type,
		        "Node types should be equal");
	});

	t.end();
});
