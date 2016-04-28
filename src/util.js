import _ from 'lodash';

export function flattenObjectHierarchy(root) {
	if (root === undefined) return [];
	return [root].concat(
		_.flatMap(root.children, flattenObjectHierarchy));
}
