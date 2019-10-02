/**
 * 	Arakny Interface - Dropdown Component
 */

import { AIEvent } from '../../utils/utils.js';
import dom from '../../utils/dom';
import "./types";

function AIDropdowns(selector, options) {
	let elements = selector;
	if (typeof selector === 'string') elements = document.querySelectorAll(selector);

	elements.forEach((el, i) => {
		let obj = AIDropdown.init(el, options);
	});
}

function AIDropdown(selector, options) {
	let config = {
		transition: 'slide',
		duration: 200,

		isSearchType: false,
		isSelectable: true,

		classArrowIcon: 'fas fa-chevron-down',

		onChange: null,
	};
	$.extend(config, options);

	const obj = this;
	const el = typeof selector === 'string' ? document.querySelector(selector) : selector;

	let menu = dom.firstChildMatches(el, '.menu');
	if (! menu) {
		menu = document.createElement('nav');
		menu.className = 'menu';
		el.insertAdjacentElement('beforeend', menu);
	}

	let items, visibleItems;
	let itemCount = 0, visibleItemCount = 0;
	let selectedItem = null;
	let curText = null, curValue = null;
	let isMenuVisible = false;
	let isMenuFlex = false;
	let menuDirection = 'down';

	const isControl = el.classList.contains('control');
	let isFocused = false;

	const isSearchType = el.classList.contains('search');

	let elInput, elPlaceholder;
	let elText;

	// 개별적 옵션
	let isSelectable = config.isSelectable;
	if (typeof el.dataset.notSelectable !== 'undefined') isSelectable = false;
	let transition = config.transition;
	if (el.dataset.transition) transition = el.dataset.transition;
	let duration = config.duration;
	if (el.dataset.duration) duration = el.dataset.duration;

	let menuDataType = null;

	// 기타 내부 변수
	
	// 메뉴 트랜지션 관련
	let transitionState = '';
	let queueTransition = [];

	/**
	 *	Private Methods
	 */

	// 초기화
	const _init = () => {
		// 목록에 추가
		window.ai._vars.dropdowns.push({
			object: this,
			element: el
		});

		// 포커스 받게 하기
		el.tabIndex = 0;

		// 텍스트 요소
		// 있으면 사용하고, 없다면 컨트롤일 경우만 생성.
		elText = dom.firstChildMatches(el, '.text');
		if (elText === null && isControl) {
			elText = document.createElement(isSearchType ? 'input' : 'div');
			elText.className = 'text';
			if (isSearchType) elText.type = 'text';
			menu.insertAdjacentElement('beforebegin', elText);
		}

		if (isControl) {
			// 화살표 아이콘 - 없다면 삽입
			if (! dom.firstChildMatches(el, '.arrow-icon')) {
				el.insertAdjacentHTML('afterbegin', `<i class="${config.classArrowIcon} arrow-icon"></i>`);
			}

			elInput = dom.firstChildMatches(el, 'input');
			// input 이 없다면 - 오류
			if (! elInput) {
				throw new Error('Require input element.');
			}

			// 설명텍스트
			const placeholder = elInput.placeholder ? elInput.placeholder : '';
			elPlaceholder = document.createElement('div');
			elPlaceholder.className = 'placeholder';
			elPlaceholder.textContent = placeholder;
			el.insertAdjacentElement('afterbegin', elPlaceholder);
			if (isSearchType) elText.placeholder = placeholder;

			obj.value = elInput.value;
		}

		// 메뉴 Flex 여부 결정
		if (menu.classList.contains('s-icon')) {
			isMenuFlex = true;
		}

		if (el.dataset.type) setMenuDataType(el.dataset.type);

		refreshItems();

		/**
		 * 	Events
		 */

		el.addEventListener('click', function(e) {
			toggleMenuVisibility();
		});

		el.addEventListener('focusin', function(e) {
			isFocused = true;
			dom.addClass(el, 'focused');

			if (isSearchType) {
				elText.focus();
			}
		});

		el.addEventListener('focusout', function(e) {
			setTimeout(function() {
				// IE Bug :: 자식이 div, span 태그일 경우 자식에게 focus 가 넘어감.
				// 따라서 focus를 다시 되찾아와야 함.
				for (let item of el.querySelectorAll('div, span')) {
					if (document.activeElement === item) {
						el.focus(); return;
					}
				}
				if (document.activeElement === el) return;
				if (document.activeElement === elText) return;

				if (isMenuVisible) setMenuVisibility(false);

				isFocused = false;
				dom.removeClass(el, 'focused');
			}, 0);

			//setTimeout(() => { hideMenu() }, 50);
		});

		el.addEventListener('keydown', function (e) {
			if (isMenuVisible) {
				switch (e.key) {
					case "Enter":
					case "Escape":
					case "Esc":
						e.preventDefault();
						setMenuVisibility(false);
						break;
					case "ArrowUp":
					case "Up":
						e.preventDefault();
						if (obj.selectedItem === null) {
							if (visibleItems.length === 0) break;
							obj.selectedItem = visibleItems[0];
						} else {
							if (typeof dom.prev(obj.selectedItem, '.item:not(.hidden)') !== "undefined") {
								obj.selectedItem = dom.prev(obj.selectedItem, '.item:not(.hidden)');
							}
						}
						break;
					case "ArrowDown":
					case "Down":
						e.preventDefault();
						if (obj.selectedItem === null) {
							if (visibleItems.length === 0) break;
							obj.selectedItem = visibleItems[0];
						} else {
							if (typeof dom.next(obj.selectedItem, '.item:not(.hidden)') !== "undefined") {
								obj.selectedItem = dom.next(obj.selectedItem, '.item:not(.hidden)');
							}
						}
						break;
				}
			} else {
				switch (e.key) {
					case "ArrowUp":
					case "Up":
					case "ArrowDown":
					case "Down":
						e.preventDefault();
						setMenuVisibility(true);
						break;
				}
			}

			if (e.shiftKey && e.key === "Tab") {
				el.tabIndex = -1;
				setTimeout(() => { el.tabIndex = 0 }, 0);
			}
		});

		if (isSearchType) {
			elText.addEventListener('input', function (e) {
				//if (! isMenuVisible) setMenuVisibility();
				
				// IE Input Event Placeholder Bug Fix
				if (ai.UserAgent.isIE()) {
					let t = e.target,
						active = (t == document.activeElement);
					if (!active || (t.placeholder && t.composition_started !== true)) {
						t.composition_started = active;
						if (t.tagName == 'TEXTAREA' || t.tagName == 'INPUT') {
							e.stopPropagation();
							e.preventDefault();
							return false;
						}
					}
				}

				filterMenuItems();

				if (visibleItemCount) {
					setForceMenuVisibility(true);
				} else {
					setForceMenuVisibility(false);
				}

				obj.text = e.target.value;
			});
		}

		items.forEach(item => {
			item.addEventListener('click', function (e) {
				obj.selectedItem = this;
			});
		});

		// 감시

		// 메뉴 노드 감시
		const cbMutationMenu = function(mutationList, observer) {
			for (let mutation of mutationList) {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach(item => {
						item.addEventListener('click', function (e) {
							obj.selectedItem = this;
						});
					});
				}
			}
		};
		const observerMenu = new MutationObserver(cbMutationMenu);
		const observerMenuConfig = { attributes: false, childList: true };
		observerMenu.observe(menu, observerMenuConfig);

		if (isControl) {
			// Input 감시
			const cbMutationInput = function(mutationList, observer) {
				for (let mutation of mutationList) {
					if (mutation.type === 'attributes') {
						if (mutation.attributeName === 'value') {
							//console.log(mutation.oldValue);
						}
					}
				}
			};
			const observerInput = new MutationObserver(cbMutationInput);
			const observerInputConfig = { attributes: true, childList: false };
			observerInput.observe(elInput, observerInputConfig);
		}
	};

	/**
	 * Private Functions and Methods
	 */

	// 메뉴 방향 결정
	const determineMenuDirection = () => {
		const menuHeight = menu.getBoundingClientRect().height;
		const r = el.getBoundingClientRect();
		let downside = window.innerHeight - r.bottom;

		menuDirection = (downside > menuHeight) ? 'down' : 'up';

		if (menuDirection === 'down') {
			dom.removeClass(el, 'upside');
			dom.removeClass(menu, 'direction-up');
		} else {
			dom.addClass(el, 'upside');
			dom.addClass(menu, 'direction-up');
		}
	};

	const filterMenuItems = function () {
		if (elText.value === '') {
			items.forEach(e => {
				dom.removeClass(e, 'hidden');
			});

		} else {
			items.forEach(e => {
				if (window.ai.Hangul.indexOf(e.textContent, elText.value) >= 0) {
					dom.removeClass(e, 'hidden');
				} else {
					dom.addClass(e, 'hidden');
				}
			});
		}
		refreshItems();
	};

	// 메뉴 아이템 목록 새로고침
	const refreshItems = () => {
		items = el.querySelectorAll('.menu > .item');
		visibleItems = el.querySelectorAll('.menu > .item:not(.hidden)');

		itemCount = items.length;
		visibleItemCount = visibleItems.length;
	};

	// 메뉴 표시 상태 변경 (트랜지션)
	const setMenuVisibility = function(bShow = true) {
		refreshItems();
		if (! visibleItemCount) return;

		if (transitionState) {
			queueTransition.push(bShow);
			return;
		}

		transitionState = bShow ? 'in' : 'out';

		if (bShow) {
			menu.style.display = isMenuFlex ? 'flex' : 'block';

			if (isSearchType) {
				filterMenuItems();
			}

			determineMenuDirection();
			scrollMenu();
		}

		menu.style.animationDuration = duration + 'ms';
		dom.addClass(menu, `transition ${transition}-${menuDirection} ${transitionState}`);

		if (bShow) dom.addClass(el, 'menu-on');
		else dom.removeClass(el, 'menu-on');

		setTimeout(function() {
			isMenuVisible = bShow;

			dom.removeClass(menu, `transition ${transition}-${menuDirection} ${transitionState}`);
			transitionState = '';

			if (! bShow) {
				menu.style.display = 'none';
			}

			const b1 = queueTransition.shift();
			if (typeof b1 !== "undefined") setMenuVisibility.call(obj, b1);
		}, duration);
	};

	// 메뉴 표시 상태 변경 (트랜지션 없이 강제로 바로!)
	const setForceMenuVisibility = function(bShow) {
		if (bShow) {
			menu.style.display = isMenuFlex ? 'flex' : 'block';

			determineMenuDirection();
			scrollMenu();

			dom.addClass(el, 'menu-on');
		} else {
			menu.style.display = 'none';

			dom.removeClass(el, 'menu-on');
		}
		isMenuVisible = bShow;
	};

	// 메뉴 보이기 토글
	const toggleMenuVisibility = function () {
		if (queueTransition.length) {
			const bShow = queueTransition[queueTransition.length - 1];
			setMenuVisibility(!bShow);
		} else if (transitionState) {
			setMenuVisibility(transitionState == 'out');
		} else {
			setMenuVisibility(!isMenuVisible);
		}
	};

	// 컨트롤 - 메뉴 영역에 표현되지 않으면 보여주기
	const scrollMenu = function() {
		if (! isControl) return;

		if (selectedItem) {
			const menuHeight = menu.getBoundingClientRect().height;
			const selectedItemHeight = selectedItem.getBoundingClientRect().height;

			let nTop = selectedItem.offsetTop - menu.scrollTop;
			let nBottom = nTop + selectedItemHeight;

			if (nBottom > menuHeight) menu.scrollTop = selectedItem.offsetTop;
			else if (Math.round(nTop) <= 0) menu.scrollTop = selectedItem.offsetTop;
		} else {
			menu.scrollTop = 0;
		}
	};

	// 메뉴 데이터 형식 지정
	const setMenuDataType = function (type) {
		if (type in window.ai._vars.dropdown_menutypes) {
			if (typeof window.ai._vars.dropdown_menutypes[type] === 'function') {
				const code = window.ai._vars.dropdown_menutypes[type].call(obj);
				menu.innerHTML = code;

				refreshItems();
			}
		}
	};


	// Text, Value 저장
	const setTextAndValue = function() {
		if (elText) {
			if (elText.tagName.toLowerCase() === 'input') {
				elText.value = curText;
			} else {
				elText.innerHTML = curText;
			}
		}

		if (isControl) {
			elPlaceholder.style.display = curText ? 'none' : 'block';
			elInput.value = curValue;
		}

		el.dispatchEvent(new CustomEvent('change'));
	};

	/**
	 * 	Methods
	 */

	this.on = function (eventName, callback) {
		if (typeof callback !== 'function') return obj;
		switch (eventName) {
			case 'change':
				el.addEventListener(eventName, callback);
				break;
			default:
				break;
		}
		return obj;
	};

	this.refresh = function() {
		obj.value = elInput.value;
	};

	// Initialize Items
	refreshItems();

	/**
	 * 	Properties
	 */
	Object.defineProperty(this, 'input', {
		get() { return elInput }
	});

	Object.defineProperty(this, 'selectedItem', {
		get() {
			return selectedItem;
		},
		set(v) {
			if (! isSelectable) return;

			selectedItem = v;

			items.forEach(ele => { dom.removeClass(ele, 'on') });
			dom.addClass(selectedItem, 'on');

			curText = v.innerHTML;
			if (isControl) curValue = (v.dataset.value) ? v.dataset.value : null;
			else curValue = v.innerText;

			setTextAndValue();
			scrollMenu();
		}
	});

	Object.defineProperty(this, 'text', {
		get() {
			return curText;
		},
		set(v) {
			selectedItem = null;
			curText = v;
			curValue = elInput.value = isSearchType ? v : '';

			items.forEach(ele => { dom.removeClass(ele, 'on') });

			for (let item of items) {
				if ((typeof item.dataset.text !== 'undefined' && item.dataset.text == v)
					|| item.textContent == v) {
					selectedItem = item;
					dom.addClass(selectedItem, 'on');

					curValue = typeof item.dataset.value !== 'undefined'
						? item.dataset.value : item.textContent;

					setTextAndValue();

					return;
				}
			}
		}
	});

	Object.defineProperty(this, 'value', {
		get() {
			return curValue;
		},
		set(v) {
			selectedItem = null;
			curText = '';
			curValue = elInput.value = v;

			items.forEach(ele => { dom.removeClass(ele, 'on') });

			for (let item of items) {
				if (item.dataset.value == v) {
					selectedItem = item;
					dom.addClass(selectedItem, 'on');

					curText = typeof item.dataset.text !== 'undefined'
						? item.dataset.text : item.textContent;

					setTextAndValue();

					return;
				}
			}
		}
	});


	// 초기화
	_init();
}

/**
 * 새 드롭다운을 생성하거나 이미 있으면 기존 것을 반환.
 * @param selector
 * @param options
 */
AIDropdown.init = function(selector, options) {
	const el = typeof selector === 'string' ? document.querySelector(selector) : selector;

	for (let obj of window.ai._vars.dropdowns) {
		if (obj.element === el) return obj.object;
	}

	return new AIDropdown(selector, options);
};

// 초기화

window.ai._vars.dropdowns = [];
window.ai.Dropdowns = AIDropdowns;
window.ai.Dropdown = AIDropdown;

$(() => {
	new AIDropdowns('.ai-b.dropdown');
	new AIDropdowns('.control.dropdown');
});