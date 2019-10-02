/**
 * 	Arakny Interface - Polyfills
 */

/**
 * Polyfill for creating CustomEvents on IE9/10/11
 */
(function() {
	if (typeof window === 'undefined') return;

	try {
		var ce = new window.CustomEvent('test', { cancelable: true });
		ce.preventDefault();
		if (ce.defaultPrevented !== true) {
			// IE has problems with .preventDefault() on custom events
			// http://stackoverflow.com/questions/23349191
			throw new Error('Could not prevent default');
		}
	} catch (e) {
		var CustomEvent = function(event, params) {
			var evt, origPrevent;
			params = params || {};
			params.bubbles = !!params.bubbles;
			params.cancelable = !!params.cancelable;

			evt = document.createEvent('CustomEvent');
			evt.initCustomEvent(
				event,
				params.bubbles,
				params.cancelable,
				params.detail
			);
			origPrevent = evt.preventDefault;
			evt.preventDefault = function() {
				origPrevent.call(this);
				try {
					Object.defineProperty(this, 'defaultPrevented', {
						get: function() {
							return true;
						}
					});
				} catch (e) {
					this.defaultPrevented = true;
				}
			};
			return evt;
		};

		CustomEvent.prototype = window.Event.prototype;
		window.CustomEvent = CustomEvent; // expose definition to window
	}
})();

/**
 * Object - Polyfill
 */

if (typeof Object.assign !== 'function') {
	// Must be writable: true, enumerable: false, configurable: true
	Object.defineProperty(Object, "assign", {
		value: function assign(target, varArgs) { // .length of function is 2
			'use strict';
			if (target === null || target === undefined) {
				throw new TypeError('Cannot convert undefined or null to object');
			}

			var to = Object(target);

			for (var index = 1; index < arguments.length; index++) {
				var nextSource = arguments[index];

				if (nextSource !== null && nextSource !== undefined) {
					for (var nextKey in nextSource) {
						// Avoid bugs when hasOwnProperty is shadowed
						if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
							to[nextKey] = nextSource[nextKey];
						}
					}
				}
			}
			return to;
		},
		writable: true,
		configurable: true
	});
}