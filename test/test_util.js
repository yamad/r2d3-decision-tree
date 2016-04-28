//import expect from 'chai';
import {flattenObjectHierarchy} from '../src/util.js';
const expect = require('chai').expect;

describe('flatten', function() {
	it('should return singleton list from an empty object', function() {
		expect( flattenObjectHierarchy({}) ).to.deep.equal( [{}] );
	}),
	it('should return 1-elem list if missing children', function() {
		const a = { id: 1 };
		expect( flattenObjectHierarchy(a) ).to.deep.equal( [a] );
	}),
	it('should return 1-elem list if no children', function() {
		const a = { id: 1, children: [] };
		expect( flattenObjectHierarchy(a) ).to.deep.equal( [a] );
	}),
	it('should flatten deeply', function() {
		const c = { id: 3 },
		      b = { id: 2 },
		      a = { id: 1, children: [b, c] },
		      actual = [a, b, c];
		expect( flattenObjectHierarchy(a) ).to.deep.equal( actual );
	});
});
