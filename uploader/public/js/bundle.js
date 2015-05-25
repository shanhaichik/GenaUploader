(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/media/5b8c33bd-b0bc-468a-b4a8-bde993bcb4bf/www/uploader/public/dev/uploader.js":[function(require,module,exports){
(function (document, window, $) {
	'use strict';

	var slice    = Array.prototype.slice,
		splice   = Array.prototype.splice,
		toString = Object.prototype.toString,
		getKeys  = Object.keys,
		hasOwn   = Object.hasOwnProperty;

	// Helpers
	var _h = {
		noop: function () {},
		isUndefined: function (arg) {return arg === void 0; },
		isFunction: function (x) {return toString.call(x) === '[object Function]'; },
		isObject: function (x) {return typeof x === 'object' && x !== null; },
		isArray: function (x) {return toString.call(x) === '[object Array]'; },
		oHas: function (obj, key) {return obj != null && hasOwn.call(obj, key); }
	};
	
	_h.extend = function (first, second) {
		for (var prop in second) {
			if (hasOwn.call(second, prop)) {
				first[prop] = second[prop];
			}
		}
	};
	
	_h.getUID = function () {
		/*jslint bitwise: true*/
		return 'axxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	};
	
	// Detect browser
	var _ua = navigator.userAgent.toLowerCase(),
		_is = {
			version: (_ua.match( /.+(?:me|ox|on|rv|it|era|opr|ie)[\/: ]([\d.]+)/ ) || [0,'0'])[1],
			opera: (/opera/i.test(_ua) || /opr/i.test(_ua)),
			msie: (/msie/i.test(_ua) && !/opera/i.test(_ua) || /trident\//i.test(_ua)),
			msie8: (/msie 8/i.test(_ua) && !/opera/i.test(_ua)),
			msie9: (/msie 9/i.test(_ua) && !/opera/i.test(_ua)),
			mozilla: /firefox/i.test(_ua),
			chrome: /chrome/i.test(_ua),
			safari: (!(/chrome/i.test(_ua)) && /webkit|safari|khtml/i.test(_ua)),
			iphone: /iphone/i.test(_ua),
			iphone4: /iphone.*OS 4/i.test(_ua),
			ipod4: /ipod.*OS 4/i.test(_ua),
			ipad: /ipad/i.test(_ua),
			android: /android/i.test(_ua),
			mobile: /iphone|ipod|ipad|opera mini|opera mobi|iemobile|android/i.test(_ua),
			msie_mobile: /iemobile/i.test(_ua),
			safari_mobile: /iphone|ipod|ipad/i.test(_ua),
			opera_mobile: /opera mini|opera mobi/i.test(_ua),
			opera_mini: /opera mini/i.test(_ua)
		},
		_support = (function(window) {
            var support = {};

            // Whether the browser supports uploading files with XMLHttpRequest
            support.xhrUpload = !!window.FormData && !!window.XMLHttpRequest && 'upload' in new XMLHttpRequest();

            // Whether the browser supports selecting multiple files at once
            support.selectMultiple = !!window.FileList && 'multiple' in document.createElement('input');

            // Whether the browser supports dropping files to the drop zone
            var div = document.createElement('div');
            support.dropFiles =  'ondragstart' in div && 'ondrop' in div && !!window.FileList;

            return support;
        }(window));
	
	
	/**
	 * Create XHR class
	 *
	 * @param options
	 */
	var XHR = function() {};
		
	
	/**
	 * Create Uploader class
	 *
	 * @param options
	 */
	var GU = window.GU = function () {};
	
	/**
	 * Define the static properties of Uploader
	 */
	_h.extend(GU, {
		/**
		 * Default values
		 */
		defaults: {
			// Name of the file input
			name: 'files',

			// Whether selecting multiple files at once in allowed
			multiple: true,

			// Disable input  if the number of files is the maximum number of uploaded files or required by the logic
			disabled: false,

			// The maximum number of files the user can upload (by default there is no limit)
			maxFiles: null,

			// The maximum size of files the user can upload (by default there is no limit)
			maxSize: null,

			// Whether to automatically upload files after they were selected
			autoStart: true,

			// Required field in the form (by default required)
			required: true,

			// Array of the accepted file types, ex. ['.jpg', '.jpeg', '.png'] (by default all types are accepted)
			acceptType: null,

			// Array of the accepted file types, ex. ['.jpg', '.jpeg', '.png'] (by default all types are accepted)
			acceptExtension: null,

			// Additional data to send with the files
			data: {},

			// Additional headers to send with the files (only for ajax uploads)
			headers: {},

			// Upload success callback
			success: function(){},

			// Upload fail callback
			fail: function(){},

			// The url to upload the files to
			url: document.URL,

			// The url to remove the files
			removeUrl: null,

			// Enable EDS functional
			eds: false,

			// Error messages
			errors: {
				maxFiles: 'Превышенно колличесво файлов {{maxFiles}} возможных для загрузки!',
				maxSize: 'Размер файла {{fileName}} превысил максимальный размер {{maxSize}}',
				invalidType: 'Неверный тип файла {{fileName}}. Для загрузки разрешены следующие типы файлов: {{fileType}}',
				invalidExtension: 'Неверное расширение файла {{fileName}}. Для загрузки разрешены следующие расширения файлов: {{fileExtension}}'
			}
		},
		
		extend: function(obj) {
			
		}
	});
	
	
	
	//console.log(GU.defaults.multiple)

}(document, window, jQuery));
},{}]},{},["/media/5b8c33bd-b0bc-468a-b4a8-bde993bcb4bf/www/uploader/public/dev/uploader.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL21lZGlhLzViOGMzM2JkLWIwYmMtNDY4YS1iNGE4LWJkZTk5M2JjYjRiZi93d3cvdXBsb2FkZXIvcHVibGljL2Rldi91cGxvYWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChkb2N1bWVudCwgd2luZG93LCAkKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgc2xpY2UgICAgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UsXG5cdFx0c3BsaWNlICAgPSBBcnJheS5wcm90b3R5cGUuc3BsaWNlLFxuXHRcdHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcblx0XHRnZXRLZXlzICA9IE9iamVjdC5rZXlzLFxuXHRcdGhhc093biAgID0gT2JqZWN0Lmhhc093blByb3BlcnR5O1xuXG5cdC8vIEhlbHBlcnNcblx0dmFyIF9oID0ge1xuXHRcdG5vb3A6IGZ1bmN0aW9uICgpIHt9LFxuXHRcdGlzVW5kZWZpbmVkOiBmdW5jdGlvbiAoYXJnKSB7cmV0dXJuIGFyZyA9PT0gdm9pZCAwOyB9LFxuXHRcdGlzRnVuY3Rpb246IGZ1bmN0aW9uICh4KSB7cmV0dXJuIHRvU3RyaW5nLmNhbGwoeCkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7IH0sXG5cdFx0aXNPYmplY3Q6IGZ1bmN0aW9uICh4KSB7cmV0dXJuIHR5cGVvZiB4ID09PSAnb2JqZWN0JyAmJiB4ICE9PSBudWxsOyB9LFxuXHRcdGlzQXJyYXk6IGZ1bmN0aW9uICh4KSB7cmV0dXJuIHRvU3RyaW5nLmNhbGwoeCkgPT09ICdbb2JqZWN0IEFycmF5XSc7IH0sXG5cdFx0b0hhczogZnVuY3Rpb24gKG9iaiwga2V5KSB7cmV0dXJuIG9iaiAhPSBudWxsICYmIGhhc093bi5jYWxsKG9iaiwga2V5KTsgfVxuXHR9O1xuXHRcblx0X2guZXh0ZW5kID0gZnVuY3Rpb24gKGZpcnN0LCBzZWNvbmQpIHtcblx0XHRmb3IgKHZhciBwcm9wIGluIHNlY29uZCkge1xuXHRcdFx0aWYgKGhhc093bi5jYWxsKHNlY29uZCwgcHJvcCkpIHtcblx0XHRcdFx0Zmlyc3RbcHJvcF0gPSBzZWNvbmRbcHJvcF07XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXHRcblx0X2guZ2V0VUlEID0gZnVuY3Rpb24gKCkge1xuXHRcdC8qanNsaW50IGJpdHdpc2U6IHRydWUqL1xuXHRcdHJldHVybiAnYXh4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbihjKSB7XG5cdFx0XHR2YXIgciA9IE1hdGgucmFuZG9tKCkqMTZ8MCwgdiA9IGMgPT0gJ3gnID8gciA6IChyJjB4M3wweDgpO1xuXHRcdFx0cmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuXHRcdH0pO1xuXHR9O1xuXHRcblx0Ly8gRGV0ZWN0IGJyb3dzZXJcblx0dmFyIF91YSA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKSxcblx0XHRfaXMgPSB7XG5cdFx0XHR2ZXJzaW9uOiAoX3VhLm1hdGNoKCAvLisoPzptZXxveHxvbnxydnxpdHxlcmF8b3ByfGllKVtcXC86IF0oW1xcZC5dKykvICkgfHwgWzAsJzAnXSlbMV0sXG5cdFx0XHRvcGVyYTogKC9vcGVyYS9pLnRlc3QoX3VhKSB8fCAvb3ByL2kudGVzdChfdWEpKSxcblx0XHRcdG1zaWU6ICgvbXNpZS9pLnRlc3QoX3VhKSAmJiAhL29wZXJhL2kudGVzdChfdWEpIHx8IC90cmlkZW50XFwvL2kudGVzdChfdWEpKSxcblx0XHRcdG1zaWU4OiAoL21zaWUgOC9pLnRlc3QoX3VhKSAmJiAhL29wZXJhL2kudGVzdChfdWEpKSxcblx0XHRcdG1zaWU5OiAoL21zaWUgOS9pLnRlc3QoX3VhKSAmJiAhL29wZXJhL2kudGVzdChfdWEpKSxcblx0XHRcdG1vemlsbGE6IC9maXJlZm94L2kudGVzdChfdWEpLFxuXHRcdFx0Y2hyb21lOiAvY2hyb21lL2kudGVzdChfdWEpLFxuXHRcdFx0c2FmYXJpOiAoISgvY2hyb21lL2kudGVzdChfdWEpKSAmJiAvd2Via2l0fHNhZmFyaXxraHRtbC9pLnRlc3QoX3VhKSksXG5cdFx0XHRpcGhvbmU6IC9pcGhvbmUvaS50ZXN0KF91YSksXG5cdFx0XHRpcGhvbmU0OiAvaXBob25lLipPUyA0L2kudGVzdChfdWEpLFxuXHRcdFx0aXBvZDQ6IC9pcG9kLipPUyA0L2kudGVzdChfdWEpLFxuXHRcdFx0aXBhZDogL2lwYWQvaS50ZXN0KF91YSksXG5cdFx0XHRhbmRyb2lkOiAvYW5kcm9pZC9pLnRlc3QoX3VhKSxcblx0XHRcdG1vYmlsZTogL2lwaG9uZXxpcG9kfGlwYWR8b3BlcmEgbWluaXxvcGVyYSBtb2JpfGllbW9iaWxlfGFuZHJvaWQvaS50ZXN0KF91YSksXG5cdFx0XHRtc2llX21vYmlsZTogL2llbW9iaWxlL2kudGVzdChfdWEpLFxuXHRcdFx0c2FmYXJpX21vYmlsZTogL2lwaG9uZXxpcG9kfGlwYWQvaS50ZXN0KF91YSksXG5cdFx0XHRvcGVyYV9tb2JpbGU6IC9vcGVyYSBtaW5pfG9wZXJhIG1vYmkvaS50ZXN0KF91YSksXG5cdFx0XHRvcGVyYV9taW5pOiAvb3BlcmEgbWluaS9pLnRlc3QoX3VhKVxuXHRcdH0sXG5cdFx0X3N1cHBvcnQgPSAoZnVuY3Rpb24od2luZG93KSB7XG4gICAgICAgICAgICB2YXIgc3VwcG9ydCA9IHt9O1xuXG4gICAgICAgICAgICAvLyBXaGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIHVwbG9hZGluZyBmaWxlcyB3aXRoIFhNTEh0dHBSZXF1ZXN0XG4gICAgICAgICAgICBzdXBwb3J0LnhoclVwbG9hZCA9ICEhd2luZG93LkZvcm1EYXRhICYmICEhd2luZG93LlhNTEh0dHBSZXF1ZXN0ICYmICd1cGxvYWQnIGluIG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgICAgICAvLyBXaGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIHNlbGVjdGluZyBtdWx0aXBsZSBmaWxlcyBhdCBvbmNlXG4gICAgICAgICAgICBzdXBwb3J0LnNlbGVjdE11bHRpcGxlID0gISF3aW5kb3cuRmlsZUxpc3QgJiYgJ211bHRpcGxlJyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXG4gICAgICAgICAgICAvLyBXaGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIGRyb3BwaW5nIGZpbGVzIHRvIHRoZSBkcm9wIHpvbmVcbiAgICAgICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIHN1cHBvcnQuZHJvcEZpbGVzID0gICdvbmRyYWdzdGFydCcgaW4gZGl2ICYmICdvbmRyb3AnIGluIGRpdiAmJiAhIXdpbmRvdy5GaWxlTGlzdDtcblxuICAgICAgICAgICAgcmV0dXJuIHN1cHBvcnQ7XG4gICAgICAgIH0od2luZG93KSk7XG5cdFxuXHRcblx0LyoqXG5cdCAqIENyZWF0ZSBYSFIgY2xhc3Ncblx0ICpcblx0ICogQHBhcmFtIG9wdGlvbnNcblx0ICovXG5cdHZhciBYSFIgPSBmdW5jdGlvbigpIHt9O1xuXHRcdFxuXHRcblx0LyoqXG5cdCAqIENyZWF0ZSBVcGxvYWRlciBjbGFzc1xuXHQgKlxuXHQgKiBAcGFyYW0gb3B0aW9uc1xuXHQgKi9cblx0dmFyIEdVID0gd2luZG93LkdVID0gZnVuY3Rpb24gKCkge307XG5cdFxuXHQvKipcblx0ICogRGVmaW5lIHRoZSBzdGF0aWMgcHJvcGVydGllcyBvZiBVcGxvYWRlclxuXHQgKi9cblx0X2guZXh0ZW5kKEdVLCB7XG5cdFx0LyoqXG5cdFx0ICogRGVmYXVsdCB2YWx1ZXNcblx0XHQgKi9cblx0XHRkZWZhdWx0czoge1xuXHRcdFx0Ly8gTmFtZSBvZiB0aGUgZmlsZSBpbnB1dFxuXHRcdFx0bmFtZTogJ2ZpbGVzJyxcblxuXHRcdFx0Ly8gV2hldGhlciBzZWxlY3RpbmcgbXVsdGlwbGUgZmlsZXMgYXQgb25jZSBpbiBhbGxvd2VkXG5cdFx0XHRtdWx0aXBsZTogdHJ1ZSxcblxuXHRcdFx0Ly8gRGlzYWJsZSBpbnB1dCAgaWYgdGhlIG51bWJlciBvZiBmaWxlcyBpcyB0aGUgbWF4aW11bSBudW1iZXIgb2YgdXBsb2FkZWQgZmlsZXMgb3IgcmVxdWlyZWQgYnkgdGhlIGxvZ2ljXG5cdFx0XHRkaXNhYmxlZDogZmFsc2UsXG5cblx0XHRcdC8vIFRoZSBtYXhpbXVtIG51bWJlciBvZiBmaWxlcyB0aGUgdXNlciBjYW4gdXBsb2FkIChieSBkZWZhdWx0IHRoZXJlIGlzIG5vIGxpbWl0KVxuXHRcdFx0bWF4RmlsZXM6IG51bGwsXG5cblx0XHRcdC8vIFRoZSBtYXhpbXVtIHNpemUgb2YgZmlsZXMgdGhlIHVzZXIgY2FuIHVwbG9hZCAoYnkgZGVmYXVsdCB0aGVyZSBpcyBubyBsaW1pdClcblx0XHRcdG1heFNpemU6IG51bGwsXG5cblx0XHRcdC8vIFdoZXRoZXIgdG8gYXV0b21hdGljYWxseSB1cGxvYWQgZmlsZXMgYWZ0ZXIgdGhleSB3ZXJlIHNlbGVjdGVkXG5cdFx0XHRhdXRvU3RhcnQ6IHRydWUsXG5cblx0XHRcdC8vIFJlcXVpcmVkIGZpZWxkIGluIHRoZSBmb3JtIChieSBkZWZhdWx0IHJlcXVpcmVkKVxuXHRcdFx0cmVxdWlyZWQ6IHRydWUsXG5cblx0XHRcdC8vIEFycmF5IG9mIHRoZSBhY2NlcHRlZCBmaWxlIHR5cGVzLCBleC4gWycuanBnJywgJy5qcGVnJywgJy5wbmcnXSAoYnkgZGVmYXVsdCBhbGwgdHlwZXMgYXJlIGFjY2VwdGVkKVxuXHRcdFx0YWNjZXB0VHlwZTogbnVsbCxcblxuXHRcdFx0Ly8gQXJyYXkgb2YgdGhlIGFjY2VwdGVkIGZpbGUgdHlwZXMsIGV4LiBbJy5qcGcnLCAnLmpwZWcnLCAnLnBuZyddIChieSBkZWZhdWx0IGFsbCB0eXBlcyBhcmUgYWNjZXB0ZWQpXG5cdFx0XHRhY2NlcHRFeHRlbnNpb246IG51bGwsXG5cblx0XHRcdC8vIEFkZGl0aW9uYWwgZGF0YSB0byBzZW5kIHdpdGggdGhlIGZpbGVzXG5cdFx0XHRkYXRhOiB7fSxcblxuXHRcdFx0Ly8gQWRkaXRpb25hbCBoZWFkZXJzIHRvIHNlbmQgd2l0aCB0aGUgZmlsZXMgKG9ubHkgZm9yIGFqYXggdXBsb2Fkcylcblx0XHRcdGhlYWRlcnM6IHt9LFxuXG5cdFx0XHQvLyBVcGxvYWQgc3VjY2VzcyBjYWxsYmFja1xuXHRcdFx0c3VjY2VzczogZnVuY3Rpb24oKXt9LFxuXG5cdFx0XHQvLyBVcGxvYWQgZmFpbCBjYWxsYmFja1xuXHRcdFx0ZmFpbDogZnVuY3Rpb24oKXt9LFxuXG5cdFx0XHQvLyBUaGUgdXJsIHRvIHVwbG9hZCB0aGUgZmlsZXMgdG9cblx0XHRcdHVybDogZG9jdW1lbnQuVVJMLFxuXG5cdFx0XHQvLyBUaGUgdXJsIHRvIHJlbW92ZSB0aGUgZmlsZXNcblx0XHRcdHJlbW92ZVVybDogbnVsbCxcblxuXHRcdFx0Ly8gRW5hYmxlIEVEUyBmdW5jdGlvbmFsXG5cdFx0XHRlZHM6IGZhbHNlLFxuXG5cdFx0XHQvLyBFcnJvciBtZXNzYWdlc1xuXHRcdFx0ZXJyb3JzOiB7XG5cdFx0XHRcdG1heEZpbGVzOiAn0J/RgNC10LLRi9GI0LXQvdC90L4g0LrQvtC70LvQuNGH0LXRgdCy0L4g0YTQsNC50LvQvtCyIHt7bWF4RmlsZXN9fSDQstC+0LfQvNC+0LbQvdGL0YUg0LTQu9GPINC30LDQs9GA0YPQt9C60LghJyxcblx0XHRcdFx0bWF4U2l6ZTogJ9Cg0LDQt9C80LXRgCDRhNCw0LnQu9CwIHt7ZmlsZU5hbWV9fSDQv9GA0LXQstGL0YHQuNC7INC80LDQutGB0LjQvNCw0LvRjNC90YvQuSDRgNCw0LfQvNC10YAge3ttYXhTaXplfX0nLFxuXHRcdFx0XHRpbnZhbGlkVHlwZTogJ9Cd0LXQstC10YDQvdGL0Lkg0YLQuNC/INGE0LDQudC70LAge3tmaWxlTmFtZX19LiDQlNC70Y8g0LfQsNCz0YDRg9C30LrQuCDRgNCw0LfRgNC10YjQtdC90Ysg0YHQu9C10LTRg9GO0YnQuNC1INGC0LjQv9GLINGE0LDQudC70L7Qsjoge3tmaWxlVHlwZX19Jyxcblx0XHRcdFx0aW52YWxpZEV4dGVuc2lvbjogJ9Cd0LXQstC10YDQvdC+0LUg0YDQsNGB0YjQuNGA0LXQvdC40LUg0YTQsNC50LvQsCB7e2ZpbGVOYW1lfX0uINCU0LvRjyDQt9Cw0LPRgNGD0LfQutC4INGA0LDQt9GA0LXRiNC10L3RiyDRgdC70LXQtNGD0Y7RidC40LUg0YDQsNGB0YjQuNGA0LXQvdC40Y8g0YTQsNC50LvQvtCyOiB7e2ZpbGVFeHRlbnNpb259fSdcblx0XHRcdH1cblx0XHR9LFxuXHRcdFxuXHRcdGV4dGVuZDogZnVuY3Rpb24ob2JqKSB7XG5cdFx0XHRcblx0XHR9XG5cdH0pO1xuXHRcblx0XG5cdFxuXHQvL2NvbnNvbGUubG9nKEdVLmRlZmF1bHRzLm11bHRpcGxlKVxuXG59KGRvY3VtZW50LCB3aW5kb3csIGpRdWVyeSkpOyJdfQ==
