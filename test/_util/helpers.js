import { createElement as h, Component, options } from '../../src';
import { assign } from '../../src/util';
import { clearLog, getLog } from './logCall';

/** @jsx h */

/**
 * Setup the test environment
 * @returns {HTMLDivElement}
 */
export function setupScratch() {
	const scratch = document.createElement('div');
	scratch.id = 'scratch';
	(document.body || document.documentElement).appendChild(scratch);
	return scratch;
}

/**
 * Setup a rerender function that will drain the queue of pending renders
 * @returns {() => void}
 */
export function setupRerender() {
	Component.__test__previousDebounce = Component.debounce;
	Component.debounce = cb => Component.__test__drainQueue = cb;

	return () => Component.__test__drainQueue && Component.__test__drainQueue();
}

let oldOptions = null;
export function clearOptions() {
	oldOptions = assign({}, options);
	delete options.vnode;
	delete options.beforeDiff;
	delete options.afterDiff;
	delete options.commitRoot;
	delete options.beforeUnmount;
}

/**
 * Teardown test environment and reset preact's internal state
 * @param {HTMLDivElement} scratch
 */
export function teardown(scratch) {
	scratch.parentNode.removeChild(scratch);

	if (oldOptions != null) {
		assign(options, oldOptions);
		oldOptions = null;
	}

	if (Component.__test__drainQueue) {
		// Flush any pending updates leftover by test
		Component.__test__drainQueue();
		delete Component.__test__drainQueue;
	}

	if (typeof Component.__test__previousDebounce !== 'undefined') {
		Component.debounce = Component.__test__previousDebounce;
		delete Component.__test__previousDebounce;
	}

	if (getLog().length > 0) {
		clearLog();
	}
}

const Foo = () => 'd';
export const getMixedArray = () => (
	// Make it a function so each test gets a new copy of the array
	[0, 'a', 'b', <span>c</span>, <Foo />, null, undefined, false, ['e', 'f'], 1]
);
export const mixedArrayHTML = '0ab<span>c</span>def1';

/**
 * Reset obj to empty to keep reference
 * @param {object} obj
 */
export function clear(obj) {
	Object.keys(obj).forEach(key => delete obj[key]);
}

/**
 * Hacky normalization of attribute order across browsers.
 * @param {string} html
 */
export function sortAttributes(html) {
	return html.replace(/<([a-z0-9-]+)((?:\s[a-z0-9:_.-]+=".*?")+)((?:\s*\/)?>)/gi, (s, pre, attrs, after) => {
		let list = attrs.match(/\s[a-z0-9:_.-]+=".*?"/gi).sort( (a, b) => a>b ? 1 : -1 );
		if (~after.indexOf('/')) after = '></'+pre+'>';
		return '<' + pre + list.join('') + after;
	});
}
