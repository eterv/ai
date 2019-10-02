/**
 * 	Arakny Interface - Utils
 */

import './dom';

/**
 * Performs a deep merge of `source` into `target`.
 * Mutates `target` only but not its objects and arrays.
 * jQuery의 extend와 같은 기능.
 */
if (typeof Object.assignDeep !== 'function') {
	Object.assignDeep = function (target, source) {
		const isObject = (obj) => obj && typeof obj === 'object';

		if (!isObject(target) || !isObject(source)) {
			return source;
		}

		Object.keys(source).forEach(key => {
			const targetValue = target[key];
			const sourceValue = source[key];

			if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
				target[key] = targetValue.concat(sourceValue);
			} else if (isObject(targetValue) && isObject(sourceValue)) {
				target[key] = Object.assignDeep(Object.assign({}, targetValue), sourceValue);
			} else {
				target[key] = sourceValue;
			}
		});

		return target;
	}
}

(() => {
	window.ai.UserAgent = {
		isIE: function () {
			return window.navigator.userAgent.match(/MSIE|Trident/);
		},
	};
})();

/*
window.ai._utils.checkKorean = function(word) {
	let uni = word.charCodeAt(0);
	return (uni >= 12593 && uni <= 12643) || (uni >= 44032 && uni <= 55203);
};
*/

(() => {
	const CHO = [
			'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ',
			'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ',
			'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ',
			'ㅍ', 'ㅎ'
		],
		JOONG = [
			'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ',
			'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', ['ㅗ', 'ㅏ'], ['ㅗ', 'ㅐ'],
			['ㅗ', 'ㅣ'], 'ㅛ', 'ㅜ', ['ㅜ','ㅓ'], ['ㅜ','ㅔ'], ['ㅜ','ㅣ'],
			'ㅠ', 'ㅡ', ['ㅡ', 'ㅣ'], 'ㅣ'
		],
		JONG = [
			'', 'ㄱ', 'ㄲ', ['ㄱ','ㅅ'], 'ㄴ', ['ㄴ','ㅈ'], ['ㄴ', 'ㅎ'], 'ㄷ', 'ㄹ',
			['ㄹ', 'ㄱ'], ['ㄹ','ㅁ'], ['ㄹ','ㅂ'], ['ㄹ','ㅅ'], ['ㄹ','ㅌ'], ['ㄹ','ㅍ'], ['ㄹ','ㅎ'], 'ㅁ',
			'ㅂ', ['ㅂ','ㅅ'], 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
		],
		CONSONANTS = [
			'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄸ',
			'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ',
			'ㅁ', 'ㅂ', 'ㅃ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ',
			'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
		],
		COMPLETE_CHO = [
			'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ',
			'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ',
			'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
		],
		COMPLETE_JOONG = [
			'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ',
			'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ',
			'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ',
			'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
		],
		COMPLETE_JONG = [
			'', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ',
			'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ',
			'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
		],
		HANGUL_OFFSET = 0xAC00;

	function _makeHash(arr) {
		let hash = {0: 0};
		for (let i = 0; i < arr.length; i++) {
			if (arr[i]) hash[arr[i].charCodeAt(0)] = i;
		}
		return hash;
	}

	const CONSONANTS_HASH = _makeHash(CONSONANTS);
	const CHO_HASH = _makeHash(COMPLETE_CHO);
	const JOONG_HASH = _makeHash(COMPLETE_JOONG);
	const JONG_HASH = _makeHash(COMPLETE_JONG);

	function _isComplete(c) {
		return 0xAC00 <= c && c <= 0xd7a3;
	}
	function _isConsonant(c) {
		return typeof CONSONANTS_HASH[c] !== 'undefined';
	}
	function _isCho(c){
		return typeof CHO_HASH[c] !== 'undefined';
	}
	function _isJoong(c){
		return typeof JOONG_HASH[c] !== 'undefined';
	}
	function _isJong(c){
		return typeof JONG_HASH[c] !== 'undefined';
	}

	const disassemble = function(str, includeInfo = true) {
		let result = [],
			code, char, cho, joong, jong, r;

		for (let i = 0; i < str.length; i++) {
			let temp = [];

			code = str.charCodeAt(i);
			char = str.charAt(i);
			if (_isComplete(code)) {	// 완성형 한글
				code -= HANGUL_OFFSET;
				jong = code % 28;
				joong = (code - jong) / 28 % 21;
				cho = parseInt((code - jong) / 28 / 21);

				temp.push(CHO[cho]);
				temp.push(JOONG[joong]);
				if (jong > 0) temp.push(JONG[jong]);

			} else if (_isConsonant(code)) {	// 자음
				if (_isCho(code)) {
					r = CHO[CHO_HASH[code]];
				} else {
					r = JONG[JONG_HASH[code]];
				}
				temp.push(r);
				temp.push(null);

			} else if (_isJoong(code)) {		// 모음
				r = JOONG[JOONG_HASH[code]];
				temp.push(null);
				temp.push(r);

			} else {	// 한글이 아닐 경우
				result.push(char);
				continue;
			}

			result.push(temp);
		}

		return result;
	};

	const contains = function(haystack, niddle) {
		return indexOf(haystack, niddle) >= 0;
	};

	const indexOf = function(haystack, niddle) {
		const d1 = disassemble(haystack),
			d2 = disassemble(niddle),
			d1_len = d1.length,
			d2_len = d2.length;
		let c1, c2, b1;

		if (d1_len < d2_len) return -1;

		for (let i = 0; i <= d1_len - d2_len; i++) {
			b1 = true;
			for (let j = 0; j < d2_len; j++) {
				c1 = d1[i+j]; c2 = d2[j];
				//console.log(c1, c2);

				if (Array.isArray(c1) && Array.isArray(c2)) {	// 둘다 한글
					// 검색 대상의 요소가 더 적으면 - 패스
					if (c1.length < c2.length) { b1 = false; break; }

					// 검색어에 초성이 있다면 초성 비교후 다르면 - 패스
					if (c2[0] && c1[0] !== c2[0]) {
						b1 = false; break;
					}

					// 검색어에 중성이 있다면
					if (c2[1]) {
						if (Array.isArray(c2[1])) {		// 검색어 - 복합 모음
							// 대상이 배열이면 전체비교, 아니면 패스
							b1 = Array.isArray(c1[1])
								? c1[1][0] === c2[1][0] && c1[1][1] === c2[1][1] : false;
						} else {						// 검색어 - 단모음
							// 대상이 배열이면 첫째 비교, 아니면 일반비교
							b1 = Array.isArray(c1[1])
								? c1[1][0] === c2[1] : c1[1] === c2[1];
						}
						if (!b1) break;
					}

					// 검색어에 종성이 있다면
					if (c2.length === 3 && c2[2]) {
						// 검색 대상에 종성이 없다면 - 패스
						if (c1.length < 3 || !c1[2]) { b1 = false; break; }

						if (Array.isArray(c2[2])) {		// 검색어 - 복합 모음
							// 대상이 배열이면 전체비교, 아니면 패스
							b1 = Array.isArray(c1[2])
								? c1[2][0] === c2[2][0] && c1[2][1] === c2[2][1] : false;
						} else {						// 검색어 - 단모음
							// 대상이 배열이면 첫째 비교, 아니면 일반비교
							b1 = Array.isArray(c1[2])
								? c1[2][0] === c2[2] : c1[2] === c2[2];
						}
						if (!b1) break;
					}

				} else if (typeof c1 === 'string' && typeof c2 === 'string') {
					// 서로 다른 문자이면 - 패스
					if (c1 !== c2) { b1 = false; break; }

				} else {
					b1 = false; break;
				}
			}
			if (b1) return i;
		}

		return -1;
	};

	window.ai.Hangul = {
		d: disassemble,
		contains: contains,
		indexOf: indexOf,
	};
})();