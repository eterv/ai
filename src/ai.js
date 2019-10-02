/**
 * Arakny User Interface
 *
 * @author      Lucas Choi <eterv@naver.com>
 * @link        http://arakny.com
 * @package     Arakny
 */

/**
 * 	Arakny UI - Form
 */

import './utils/entry';
import './polyfills/polyfills';
import './utils/utils.js';
import './components/dropdown/dropdown';

(function () {
	window.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('.ai.icon.button').forEach(function (el) {
			var elIcon = el.querySelector('i');
			el.removeChild(elIcon);

			var elWrap = document.createElement('div');
			elWrap.className = 'wrap';
			elWrap.appendChild(elIcon);
			el.appendChild(elWrap);
		});

		document.querySelectorAll('.ai.form').forEach(function (el) {
			el.querySelectorAll('.field').forEach(function (elField) {
				var elLabel = elField.querySelector('label');
				if (typeof elLabel !== 'undefined' && elLabel !== null) {
					var elInput = elField.querySelector('input:not([type="hidden"]), select');
					if (elInput !== null) {
						if (elInput.placeholder === '') {
							elInput.placeholder = elLabel.innerText;
						}
						elInput.title = elLabel.innerText;

						if (elInput.tagName.toLowerCase() === 'select') {
							elInput.options[0].text = elLabel.innerText;
						}
					}

				}
			});
		});

		// Cleave Mask 적용
		document.querySelectorAll('input[data-mask]').forEach(function (el) {
			if (el.dataset.mask == '') return;

			var mask = el.dataset.mask.split(',');

			var cleaveOption;
			switch (mask[0]) {
				case 'date-Y-m-d':
					cleaveOption = {
						date: true,
						datePattern: ['Y', 'm', 'd'],
						delimiter: '-'
					};
					break;
				case 'date-d/m/Y':
					cleaveOption = {
						date: true,
						datePattern: ['d', 'm', 'Y'],
						delimiter: '/'
					};
					break;
				case 'phone':
					cleaveOption = {
						phone: true,
						phoneRegionCode: mask[1],
						delimiter: '-'
					};
					break;
				default:
					return;
			}

			var cleave = new Cleave(el, cleaveOption);
			$(el).data('cleave', cleave);
		});

		/**
		 * 	Arakny UI - input
		 */

		document.querySelectorAll('.control.checkbox.bool.toggle').forEach(function (el) {
			el.addEventListener('click', function (e) {
				this.querySelector('input').value = this.querySelector('input').value == 1 ? '0' : '1';
				e.preventDefault();
			});
		});
	});
})();

(function () {
	function AIValidator(options) {
		var obj = this;

		var _R = {
			required: 'required',

			exact_length: 'exact_length',
			max_length: 'max_length',
			min_length: 'min_length',
			length: 'length',

			matches: 'matches',
			differs: 'differs',

			regex_match: 'regex_match',

			valid_email: 'valid_email',
			valid_ip: 'valid_ip',
			valid_url: 'valid_url',

			unique: 'unique',
		};

		var errWrapperClass = 'ai-validator-error';

		// 옵션값 통합
		this.options = {
			// 폼
			form: null,

			// 유효성을 검사할 대상 필드 - 선택자
			fieldSelector: 'input:not([type=button]):not([type=submit]):not([type=reset]), textarea, select, datalist, progress',

			// 유효성 검사 이벤트 (blur, input, submit)
			trigger: 'blur input',

			// input 이벤트 발생시에 유효성 검사까지 걸리는 지연 시간 (밀리초 ms)
			debounce: 300,

			// 오류 메시지를 인라인으로 보여줄 것인지의 여부,
			inline: true,

			// 오류 메시지 요소의 컨테이너 요소
			errorsContainer: function (el) {
				return el.closest('.field');
			},

			// 오류 메시지를 보여줄 요소
			errorsWrapper: '<div class="ui pointing error label"></div>',

			// 데이터 통신 URL 주소
			urlAdd: '',
			urlEdit: '',
			urlDelete: '',
			urlGetData: '',

			// 이벤트

			canAdd: true,
			canEdit: true,
			canDelete: true,

			beforeSubmit: null,
			beforeSubmitInAddMode: null,
			beforeSubmitInEditMode: null,
			beforeSubmitInDeleteMode: null,

			addSuccess: null,
			editSuccess: null,
			deleteSuccess: null,

			openAdd: null,
			openEdit: null,
			openDelete: null,

			reset: null,
		};
		$.extend(this.options, options);

		const eventFormSubmit = new CustomEvent('form.submit', {
			bubbles: false, cancelable: true, detail: { msg: '' }
		});

		var form = obj.options.form;
		var fields = form.elements;

		var triggerEvents = obj.options.trigger.split(' ');
		var ruleList = {};

		var isFormValid = false;
		var waitingBlurEvent = false;

		// HTML 에서 자동적으로 유효성 검사 하는 것을 방지
		form.noValidate = true;

		fields = form.querySelectorAll(obj.options.fieldSelector);


		var arrayUnique = function (array) {
			return array.filter(function(item, index, arr) {
				return index == arr.indexOf(item);
			});
		};

		// Returns a function, that, as long as it continues to be invoked, will not
		// be triggered. The function will be called after it stops being called for
		// N milliseconds. If `immediate` is passed, trigger the function on the
		// leading edge, instead of the trailing.
		var debounce = function (func, wait, immediate) {
			var timeout;
			return function() {
				var context = this, args = arguments;
				var later = function() {
					timeout = null;
					if (!immediate) func.apply(context, args);
				};
				var callNow = immediate && !timeout;
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
				if (callNow) func.apply(context, args);
			};
		};

		var getLabel = function (el) {
			if (typeof el.title !== 'undefined' && el.title !== '') return el.title;
			if (typeof el.placeholder !== 'undefined' && el.placeholder !== '') return el.placeholder;
			if (typeof el.name !== 'undefined' && el.name !== '') return el.name;
			if (typeof el.id !== 'undefined' && el.id !== '') return el.id;
			return '[Field]';
		};

		var isNumeric = function (n) {
			return !isNaN(parseFloat(n)) && isFinite(n);
		};

		var ruleExist = function (rules, rule) {
			for (var i = 0; i < rules.length; i++) {
				if (rules[i].rule === rule) return true;
			}
			return false;
		};

		var ruleGet = function (rules, rule) {
			for (var i = 0; i < rules.length; i++) {
				if (rules[i].rule === rule) return rules[i];
			}
			return null;
		};

		var ruleMerge = function (rules, rule) {

		};

		var ruleRemove = function (rules, rule) {
			for (var i = 0; i < rules.length; i++) {
				if (rules[i].rule === rule) {
					rules.splice(i, 1);
					break;
				}
			}
			return rules;
		};

		var hideError = function (elErrContainer) {
			// 오류 메시지 초기화
			elErrContainer.querySelectorAll('.' + errWrapperClass).forEach(function (el) {
				el.parentNode.removeChild(el);
			});

			if (obj.options.inline) {
				elErrContainer.classList.add('success');
				elErrContainer.classList.remove('error');
			}
		};

		var showError = function (elErrContainer, error) {
			// 오류 메시지 초기화
			elErrContainer.querySelectorAll('.' + errWrapperClass).forEach(function (el) {
				el.parentNode.removeChild(el);
			});

			var $errorWrapper = $(obj.options.errorsWrapper);
			$errorWrapper.addClass(errWrapperClass);

			$errorWrapper.text( error );
			$(elErrContainer).append($errorWrapper);

			if (obj.options.inline) {
				elErrContainer.classList.remove('success');
				elErrContainer.classList.add('error');
			}
		};

		/**
		 * Split rules string by pipe operator.
		 *
		 * @param rulesStr
		 *
		 * @return array
		 */
		var splitRules = function (rulesStr) {
			var regex = /([A-Za-z0-9_-]+)(?:\[(\S*?(?:[^\\]|\\\\))[\]])?(?=\s*\|\s*|$)/g;
			var matches = [], match;
			while ((match = regex.exec(rulesStr)) != null) {
				matches.push({
					rule: match[1],
					param: match[2]
				});
			}
			return arrayUnique(matches);
		};
		
		var _err = function (rule, args) {
			return _t('Validator.' + rule, args)
		};


		this.addRule = function (name, data) {
			var ruledata = {
				name: name,
				callback: null,
				paramCount: 1,

				errorParam: null
			};
			$.extend(ruledata, data);
			ruleList[name] = ruledata;
		};

		this.addRuleNoParam = function (name, data) {
			data.paramCount = 0;
			this.addRule(name, data);
		};


		this.on = function (eventName, callback) {
			if (typeof callback !== 'function') return obj;
			switch (eventName) {
				case 'form.submit':
					form.addEventListener(eventName, callback);
					break;
				default:
					break;
			}
			return obj;
		};

		/**
		 * 폼 전송 이벤트를 발생시킨다.
		 */
		this.submit = function () {
			form.dispatchEvent(new CustomEvent('submit'));
		};

		/**
		 * 지정한 필드의 유효성을 검사한다.
		 *
		 * @returns {boolean}
		 */
		this.validateField = function (el) {
			var promise = $.Deferred();
			var elErrContainer, i, j, rule, param;
			var ruleinfo;

			// 유효성 검사 규칙이 없으면 - 통과
			if (typeof el.dataset.rules === 'undefined' || el.dataset.rules === '') {
				promise.resolve();
				return promise.promise();
			}

			var rules = splitRules(el.dataset.rules);

			// required 가 있어야만, 다른 유효성 규칙도 테스트한다
			if (! ruleExist(rules, _R.required) && el.value === '') {
				promise.resolve();
				return promise.promise();
			}

			// 오류 컨테이너 요소 지정
			if (typeof obj.options.errorsContainer === 'function') {
				elErrContainer = obj.options.errorsContainer.call(obj, el);
			} else {
				elErrContainer = obj.options.errorsContainer;
			}

			// 값이 비어 있으면?
			if (el.value === '') {
				showError( elErrContainer, _err(_R.required, [ getLabel(el) ]) );

				promise.reject();
				return promise.promise();
			}

			// 유효성 규칙 정리 (required 및 짝(pair) 찾아 정리)
			rules = ruleRemove(rules, _R.required);
			var pairs = [
				[ _R.min_length, _R.max_length, _R.length ],

			], pair, pair1, pair2, pairNew, pair1Index, pair2Index, pairNewIndex;
			for (i = 0; i < pairs.length; i++) {
				pair = pairs[i];
				pair1 = ruleGet(rules, pair[0]);
				pair2 = ruleGet(rules, pair[1]);
				if (pair1 !== null && pair2 !== null) {
					// 두개의 기존 규칙 중 앞에 규칙 위치에 새 조정된 규칙을 삽입한다.
					for (j = 0; j < rules.length; j++) {
						if (rules[j].rule === pair[0]) pair1Index = j;
						else if (rules[j].rule === pair[1]) pair2Index = j;
					}
					pairNewIndex = (pair1Index < pair2Index) ? pair1Index : pair2Index;
					pairNew = {
						rule: pair[2],
						param: pair1.param + ',' + pair2.param
					};
					rules.splice(pairNewIndex, 0, pairNew);
					rules = ruleRemove(rules, pair[0]);
					rules = ruleRemove(rules, pair[1]);
				}
			}


			var _rules = [];

			// 유효성 규칙 적용
			for (i = 0; i < rules.length; i++) {
				rule = rules[i];

				if (! (rule.rule in ruleList)) continue;
				ruleinfo = ruleList[rule.rule];
				if (typeof ruleinfo.callback !== 'function') continue;

				// 매개변수가 1개 초과일 때, 배열화한다. (구분기호: 쉼표(,))
				param = rule.param;
				if (ruleinfo.paramCount > 1) param = param.split(',');

				_rules.push({
					rule: rule,
					ruleinfo: ruleinfo,
					el: el,
					param: param
				});
			}

			var promiseRules = $.when();
			_rules.forEach(function (item) {
				promiseRules = promiseRules.then(function () {
					var def = $.Deferred();

					var value = item.el.value;

					var result = item.ruleinfo.callback.call(item.el, value, item.param, item.el);
					if (typeof result === 'object' && 'then' in result) {	// 함수의 반환 데이터가 promise 객체일 경우
						result.then(function () {
							def.resolve();
						}).catch(function (error) {
							def.reject(item, error);
						});

					} else {
						if (result) def.resolve();
						else def.reject(item);
					}

					return def.promise();
				});
			});

			promiseRules.then(function () {
				hideError(elErrContainer);

				promise.resolve();

			}).catch(function (item, error) {

				// 오류 매개변수를 만든다. (0: 필드 라벨, 1~: param | user-defined data)
				var rule = item.rule;
				var ruleinfo = item.ruleinfo;
				var el = item.el;
				var param = item.param;

				var param2 = [ getLabel(el) ];
				if (typeof ruleinfo.errorParam === 'function') {
					// errorParam 함수는 반드시 배열 데이터를 반환해야 한다.
					param2 = param2.concat(ruleinfo.errorParam.call(el, el, param));
				} else {
					if (Array.isArray(param)) param2 = param2.concat(param);
					else param2.push(param);
				}

				if (typeof error !== 'undefined' && error !== null && error !== '') {
					showError( elErrContainer, error );
				} else {
					showError( elErrContainer, _err(rule.rule, param2) );
				}

				promise.reject(item);
			});

			return promise.promise();
		};

		/**
		 * 폼 전체의 유효성을 검사한다.
		 */
		this.validateForm = function () {
			const promise = $.Deferred();

			const fields = form.querySelectorAll(obj.options.fieldSelector);
			let isValid = true,
				firstWrongFieldIndex = fields.length,
				firstWrongField = null;

			// 병렬 promise 필드 유효성 검사.
			let promisesFields = [];
			fields.forEach(function (el, i) {
				promisesFields.push(obj.validateField(el).catch(function () {
					if (i < firstWrongFieldIndex) {
						firstWrongFieldIndex = i;
						firstWrongField = el;
					}

					isValid = false;
				}));
			});

			$.when.apply($, promisesFields).then(function () {
				if (isValid) {
					promise.resolve();

				} else {
					promise.reject();

					firstWrongField.focus();
				}
			});

			return promise.promise();
		};


		// 이벤트

		$(function () {
			fields.forEach(function (el) {
				const rules = splitRules(el.dataset.rules);
				const tagName = el.tagName.toLowerCase();
				let params;

				// input type 자동 지정하기
				if (tagName === 'input') {
					const emailRule = ruleGet(rules, _R.valid_email);
					const urlRule = ruleGet(rules, _R.valid_url);

					if (emailRule !== null) el.type = 'email';
					else if (urlRule !== null) el.type = 'url';
				}

				// 최대길이 (max-length) 자동 지정하기
				const exactLengthRule = ruleGet(rules, _R.exact_length);
				const maxLengthRule = ruleGet(rules, _R.max_length);
				if (maxLengthRule !== null) {
					el.maxLength = maxLengthRule.param;
				}
				if (exactLengthRule !== null) {
					params = exactLengthRule.param.split(',');
					el.maxLength = Math.max.apply(null, params);
				}
			});
		});

		form.addEventListener('submit', function (e) {
			// 필드에서 blur 이벤트가 발생했어도 submit 이벤트가 우선이므로 blur 이벤트를 취소한다.
			waitingBlurEvent = false;

			obj.validateForm().then(function () {
				let ret = form.dispatchEvent(eventFormSubmit);

			}).catch(function () {

			});

			e.preventDefault();
			return false;
		});

		if (triggerEvents.indexOf('blur') >= 0) {
			fields.forEach(function (el, i) {
				el.addEventListener('blur', function () {
					waitingBlurEvent = true;
					setTimeout(function () {
						if (! waitingBlurEvent) return;

						obj.validateField(el);
					}, 100);
				});
			});
		}

		if (triggerEvents.indexOf('input') >= 0) {
			fields.forEach(function (el, i) {
				el.addEventListener('input', debounce(function () {
					obj.validateField(el);
				}, obj.options.debounce));
			});
		}


		// Built-in Rules - Almost same with CodeIgniger 4

		/** 글자 길이 관련 **/
		this.addRule(_R.exact_length, {
			callback: function (value, params) {
				// 이 경우는 내부적으로 배열화한다.
				params = params.split(',');
				for (let len, i = 0; i < params.length; i++) {
					len = params[i];
					if (isNumeric(len) && value.length == len) return true;
				}
				return false;
			}
		});
		this.addRule(_R.max_length, {
			callback: function (value, params) { return (value.length <= params); }
		});
		this.addRule(_R.min_length, {
			callback: function (value, params) { return (value.length >= params); }
		});

		/** 같은 값 / 다른 값 **/
		this.addRule(_R.matches, {
			callback: function (value, params) {
				let el2 = null;
				if (form[params]) el2 = form[params];
				else if (document.getElementById(params)) el2 = document.getElementById(params);

				if (el2 === null) return true;

				return value === el2.value;
			},
			errorParam: function (el, params) {
				let el2 = null;
				if (form[params]) el2 = form[params];
				else if (document.getElementById(params)) el2 = document.getElementById(params);

				if (el2 === null) return [];

				return [ getLabel(el2), params ];
			}
		});
		this.addRule(_R.differs, {
			callback: function (value, params) {
				let el2 = null;
				if (form[params]) el2 = form[params];
				else if (document.getElementById(params)) el2 = document.getElementById(params);

				if (el2 === null) return true;

				return value !== el2.value;
			},
			errorParam: ruleList[_R.matches].errorParam
		});

		/** 정규식 **/
		this.addRule(_R.regex_match, {
			callback: function (value, params) {
				let pattern = params, flags = undefined;
				if (params.indexOf('/') === 0) {
					const match = /\/(.+)\/([a-z]*)/.exec(params);
					pattern = match[1];	flags = match[2];
				}
				const regex = new RegExp(pattern, flags);
				return regex.test(value);
			}
		});

		/** 숫자 형식 **/


		/** 특수 형식 **/
		this.addRuleNoParam(_R.valid_email, {
			callback: function (value) {
				const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
				return re.test(value);
			}
		});
		this.addRule(_R.valid_ip, {
			callback: function (value, params) {
				let re;
				if (params === 'ipv6') {
					re = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:)(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
				} else {
					re = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
				}
				return re.test(value);
			}
		});
		this.addRuleNoParam(_R.valid_url, {
			callback: function (value) {
				const re = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=+$,\w]+@)?[A-Za-z0-9.\-]+|(?:www\.|[\-;:&=+$,\w]+@)[A-Za-z0-9.\-]+)((?:\/[+~%\/.\w\-_]*)?\??(?:[\-+=&;%@.\w_]*)#?(?:[.!\/\\\w]*))?)/;
				return re.test(value);
			}
		});

		/** AJAX - Data **/
		this.addRule(_R.unique, {
			callback: function (value, params, el) {
				const url = _url(params[0]);
				let data = { field: el.name, value: value, ignoreField: params[1] };

				let ignoreField, ignoreValue;
				if (typeof params[1] !== 'undefined') {
					ignoreField = params[1];
					if (form[ignoreField]) ignoreValue = form[ignoreField].value;
					if (document.getElementById(ignoreField)) ignoreValue = document.getElementById(ignoreField).value;

					if (ignoreValue) {
						data.ignoreValue = ignoreValue;
					}
				}

				return ajaxPost(url, data, {},
					function (result) {
						if (! result.isUnique) throw('');
					},
					function (content) {
						throw(content.message);
					});
			},
			paramCount: 2
		});

		// Built-in Rules - Pair (짝)

		this.addRule(_R.length, {
			callback: function (value, params) {
				return (value.length >= params[0] && value.length <= params[1]);
			},
			paramCount: 2
		});


		/**
		 * @todo 체크 리스트
		 *
		 * - CI 및 Arakny 유효성 규칙 최대한 적용하기 (in_list, valide_date_def 등등)
		 * - 사용자가 쉽게 규칙을 추가하도록 하기 및 테스트 (언어부분도 추가적으로 L 객체에 끼어넣기가 가능한지 테스트 (플러그인 개념))
		 * - radio, checkbox, select, (FUI dropdown) 에서 어떻게 동작하는지 체크 (required 있을때 없을때)
		 * - AJAX 부분 더 심도있는 테스트
		 */

	}
	window.AIValidator = AIValidator;

})();