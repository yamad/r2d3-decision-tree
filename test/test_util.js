import test from 'tape';
import { pointsToSVGLinePath, mapBy, chunkBy, interleave,
         progressArray, progressDomain } from '../src/util.js';

function approx(t, a, b, msg) {
	return t.ok(b - 1e-6 < a && a < b + 1e-6, msg);
}

function arraysApproxEqual(t, a, b, msg) {
	msg = msg || "arrays should be equal";
	const alen = a.length;
	const blen = b.length;
	t.equal(alen, blen);
	a.forEach((v, k) => {
		approx(t, v, b[k], msg);
	}, this);
}

test('pointsToSVGLinePath', (t) => {
	t.equal("",
	        pointsToSVGLinePath([]),
	        "Given empty list, produce empty list");

	const one_pt = [{x:1, y:2}];
	t.equal("M 1 2",
	        pointsToSVGLinePath(one_pt),
	        "Given 1-elem list, produce 1 move command");

	const many_pts = [{x:1,y:2}, {x:2, y:2}, {x:3, y:4}];
	t.equal("M 1 2 2 2 3 4",
	        pointsToSVGLinePath(many_pts),
	        'Given many points, produce a line');

	t.end();
});

test('mapBy', (t) => {
	t.deepEqual([],
	            mapBy(1, 1, [], a => 1),
	            "Given empty array, produce empty array");

	t.deepEqual([1, 2, 3, 4],
	            mapBy(1, 1, [1,2,3,4], (a) => a),
	            "Given identity function, produce original input");

	t.deepEqual([1+2, 3+4],
	            mapBy(2, 2, [1,2,3,4], (a, b) => a + b),
	            "Non-overlapping groupings (k = n) produce length/n results");

	t.deepEqual([1+2, 2+3, 3+4],
	            mapBy(2, 1, [1,2,3,4], (a, b) => a + b),
	            "Overlapping groups (k < n) overlap by n-k elements");

	t.deepEqual([1+2, 4+5],
	            mapBy(2, 3, [1,2,3,4,5], (a, b) => a + b),
	            "Skipping groups (k > n) gives k elements start-to-start between groups");


	t.end();
});


test('chunkBy', (t) => {
	t.deepEqual([],
	            chunkBy(1, 1, []),
	            "Given empty array, produce empty array");

	const testArray = ['a', 'b', 'c', 'd'];
	t.deepEqual([['a'], ['b'], ['c'], ['d']],
	            chunkBy(1, 1, testArray));

	t.deepEqual([['a', 'b'], ['c', 'd']],
	            chunkBy(2, 2, testArray),
	            "If n and k are equal, work like normal `chunk` (n=2)");

	t.deepEqual([['a', 'b', 'c'], ['d']],
	            chunkBy(3, 3, testArray),
	            "If n and k are equal, work like normal `chunk` (n=3)");

	t.deepEqual([['a', 'b'], ['b', 'c'], ['c', 'd'], ['d']],
	            chunkBy(2, 1, testArray),
	            "Given k < n, overlap elements by n-k (n=2, k=1)");

	t.deepEqual([['a', 'b', 'c'], ['b', 'c', 'd'], ['c', 'd']],
	            chunkBy(3, 1, testArray),
	            "Given k < n, overlap elements by n-k, (n=3, k=1)");

	t.deepEqual([],
	            chunkBy(1, 0, testArray),
	            "Given k == 0 (no progress), produce empty list");

	t.deepEqual([],
	            chunkBy(1, -1, testArray),
	            "Given k < 0 (no progress), produce empty list");

	t.deepEqual([[], [], [], []],
	            chunkBy(0, 1, testArray),
	            "Given n == 0, produce empty chunks, count depends on k");

	t.deepEqual([[], [], [], []],
	            chunkBy(-1, 1, testArray),
	            "Given n < 0, produce empty chunks, count depends on k");

	t.end();
});


test("interleave", (t) => {
	t.deepEqual([], interleave([], []),
	            "Given two empty arrays, return 1 array");

	t.deepEqual([1,5,2,6,3,7,4,8],
	            interleave([1,2,3,4], [5,6,7,8]),
	            "Given two even length arrays, alternate elements from each array");

	t.deepEqual([1,5,2,6,3,4],
	            interleave([1,2,3,4], [5,6]),
	            "Given array A longer than array B, attach extra elements to tail");

	t.deepEqual([1,5,2,6,7,8],
	            interleave([1,2], [5,6,7,8]),
	            "Given array B longer than array A, attach extra elements to tail");

	t.deepEqual([1,2,3,4],
	            interleave([1,2,3,4], []),
	            "Given empty array B, return array A");

	t.deepEqual([5,6,7,8],
	            interleave([], [5,6,7,8]),
	            "Given empty array A, return array B");

	t.end();
});

test("progressDomain", (t) => {
	t.throws(() => progressDomain(0, 0));
	t.throws(() => progressDomain(0, -1));

	t.deepEqual([0, 1], progressDomain(0, 1));

	// 2 elements are evenly split
	t.deepEqual([0, 0.5], progressDomain(0, 2));
	t.deepEqual([0.5, 1], progressDomain(1, 2));

	// 3 elements
	arraysApproxEqual(t,
	                  [0,     2/3],
	                  progressDomain(0, 3));
	arraysApproxEqual(t,
	                  [(1/6), (1/6)+(2/3)],
	                  progressDomain(1, 3));
	arraysApproxEqual(t,
	                  [(2/6), 1],
	                  progressDomain(2, 3));

	// 4 elements
	arraysApproxEqual(t, [0, (3/4)],
	                  progressDomain(0, 4));
	arraysApproxEqual(t,
	                  [(1/12), (1/12)+(3/4)],
	                  progressDomain(1, 4));
	arraysApproxEqual(t,
	                  [(2/12), (2/12)+(3/4)],
	                  progressDomain(2, 4));
	arraysApproxEqual(t,
	                  [(3/12), (3/12)+(3/4)],
	                  progressDomain(3, 4));

	t.end();
});

test("progressArray", (t) => {
	t.deepEqual([], progressArray(0, 0),
	            "Given zero elements, returns empty array");
	t.deepEqual([], progressArray(0, -1),
	            "Given invalid n, return empty array");
	t.deepEqual([0], progressArray(0, 1),
	            "Given 1 element and no progress, return zero progress");
	t.deepEqual([1], progressArray(1, 1),
	            "Given 1 element and complete progress, all elements complete");

	t.deepEqual([0.5], progressArray(0.5, 1),
	            "One element follows global progress");


	t.deepEqual([0, 0], progressArray(0, 2),
	            "Given >1 element and no progress, return zero progress");
	t.deepEqual([1, 0], progressArray(0.5, 2),
	            ">1 elements split progress evenly");
	t.deepEqual([1, 1], progressArray(1, 2),
	            "Given >1 element and complete progress, all elements complete");

	arraysApproxEqual(t, [0.75, 0.5, 0.25], progressArray(0.5, 3));

	t.end();
});
