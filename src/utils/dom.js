/**
 * 	Arakny Interface - Utils - DOM Helper
 */

function AIDom() { }

/**
 * jQuery - addClass / removeClass 기능
 */
AIDom.addClass = function(el, classes) {
	if (arguments.length <= 1) return;
	classes = Array.prototype.slice.call(arguments, 1);
	if (classes.length === 1) classes = classes[0].split(' ');
	for (let i = 0; i < classes.length; i++)
		el.classList.add(classes[i]);
};
AIDom.removeClass = function(el, classes) {
	if (arguments.length <= 1) return;
	classes = Array.prototype.slice.call(arguments, 1);
	if (classes.length === 1) classes = classes[0].split(' ');
	for (let i = 0; i < classes.length; i++)
		el.classList.remove(classes[i]);
};

/**
 * jQuery - prev / next 기능
 */
AIDom.next = function(el, selector) {
	let sibling = el.nextElementSibling;
	if (!selector) return sibling;
	while (sibling) {
		if (sibling.matches(selector)) return sibling;
		sibling = sibling.nextElementSibling;
	}
};
AIDom.prev = function(el, selector) {
	let sibling = el.previousElementSibling;
	if (!selector) return sibling;
	while (sibling) {
		if (sibling.matches(selector)) return sibling;
		sibling = sibling.previousElementSibling;
	}
};

/**
 * Get all direct descendant elements that match a selector
 */
AIDom.childrenMatches = function(el, selector) {
	return Array.prototype.filter.call(el.children, function (child) {
		return child.matches(selector);
	});
};
/**
 * Get all direct descendant elements that match a selector
 */
AIDom.firstChildMatches = function(el, selector) {
	for (let i = 0; i < el.children.length; i++) {
		if (el.children[i].matches(selector)) return el.children[i];
	}
	return null;
};

// ai 초기화
if (typeof window.ai === 'undefined') window.ai = {};
window.ai.dom = AIDom;

export default AIDom;