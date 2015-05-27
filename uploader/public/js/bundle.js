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
		oHas: function (obj, key) {return obj !== null && hasOwn.call(obj, key); }
	};
	
	_h.template = function (template, data) {
        return template.replace(/\{{([\w\.]*)\}}/g, function (str, key) {
            var keys = key.split("."), value = data[keys.shift()] || data;
            $.each(keys, function () {
                value = value[this];
            });
            return (value === null || value === undefined) ? "" : ($.isArray(value) ? value.join('') : value);
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
		_support = (function (window) {
            var support = {};

            // Whether the browser supports uploading files with XMLHttpRequest
            support.xhrUpload = !!window.XMLHttpRequest && 'upload' in new XMLHttpRequest();

            // Whether the browser supports selecting multiple files at once
            support.selectMultiple = !!window.FileList && 'multiple' in document.createElement('input');

            // Whether the browser supports dropping files to the drop zone
            var div = document.createElement('div');
            support.dropFiles =  'ondragstart' in div && 'ondrop' in div && !!window.FileList;

            return support;
        }(window));
	
	/**
	 * Temp store object
	 */
	var store = {
		_store: [],
		get: function (id) {
			return this._store[id];
		},
		set: function (id, component) {
			this._store[id] = component;
		},
		remove: function (id) {
			
		},
		getAll: function () {
			return this._store;
		}
	};
	
	
	/**
	 * Create XHR class
	 *
	 * @param options
	 */
	var XHR = function() {};
		
	$.extend(XHR.prototype, {
		getXHR: function () {
			if (_support.xhrUpload) {
				return new XMLHttpRequest();
			} else if (window.ActiveXObject) {
				try {
					return new ActiveXObject('Microsoft.XMLHTTP');
				} catch (err) {
					return false;
				}
			}
		},
		
		getIframe: function() {}
	});
	
	/**
	 * Create Uploader class
	 *
	 * @param options
	 */
	var GU = window.GU = function (row, id) {
		this.$file = row.find('input[type=file]');
		this.options = store.get(id);
		
		if (!this.options) {
			this.options = $.extend({}, GU.defaults);
			this.options.id = id;
		}
		
		this.$file.attr({
            id: this.options.id,         
            disabled: this.options.disabled,
			name: this.options.name
        });
		// !?
		if (_support.selectMultiple) {
			this.$file.attr('multiple', this.options.multiple);
		}
		
		// set label text
		row.find('.gfu-text').text(this.options.text);
		
		// define queue props
		this.fileArr = [];
		this.progress = false;
		
		// set event handler
		this.$file.on('change.gfu', $.proxy(this.addFiles, this));
	};
	
	/**
	 * Define the static properties of Uploader
	 */
	$.extend(GU, {
		/**
		 * Default values
		 */
		defaults: {
			// id of component
			id: null,
			// Name of the file input
			name: 'files',
			
			// Default label text
			text: 'Загрузить файл',

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

			// Array of the accepted file types, ex. ['application/x-cd-image'] (by default all types are accepted)
			acceptType: null,

			// Array of the accepted file types, ex. ['jpg', 'jpeg', 'png'] (by default all types are accepted)
			acceptExtension: null,

			// Additional data to send with the files
			data: {},

			// Additional headers to send with the files (only for ajax uploads)
			headers: {},

			// Upload success callback
			success: function () {},

			// Upload fail callback
			fail: function () {},

			// The url to upload the files to
			url: document.URL,

			// The url to remove the files
			removeUrl: null,

			// Enable EDS functional
			eds: false,

			// Error messages
			errors: {
				maxFiles: 'Превышенно колличесво файлов {{maxFiles}} возможных для загрузки!',
				maxFilesSelect: 'Выбрано {{fileCount}} файлов из {{maxFiles}} возможных',
				maxSize: 'Размер файла {{fileName}} превысил максимальный размер {{maxSize}} Mb',
				invalidType: 'Неверный тип файла {{fileName}}. Для загрузки разрешены: {{fileType}}',
				invalidExtension: 'Неверное расширение файла {{fileName}}. Разрешены следующие: {{fileExtension}}'
			}
		},
		// default templates
		templates: {
			input: ['<div class="gfu-wrap">',
						'<label for="{{id}}" class="file-label"><span class="gfu-text"></span><input type="file" id="{{id}}"></label>',											'</div>'
				   ].join(''),
			
			progress: ['<div class="gfu-row"><div class="gfu-row-progress"></div></div>'].join(''),
		
			success: ['<div class="upload">Загружен файл </div>'].join('')
		},
		// extend custom options from component
		extend: function(obj) {
			store.set(obj.id, $.extend({}, GU.defaults, obj));
		}
	});
	
	$.extend(GU.prototype, {
		/*
         * Add input files in upload queue
         *
         * @method addFiles
         */
		addFiles: function (e) {
			// TODO удаление из очереди при сбросе
			if (e.target.value === '') {
				return;
			}
			
			var files = Array.prototype.slice.apply(e.target.files);
			
			try {
				this.validate(files);
			} catch (err) {
				console.log(err);
				e.target.value = null;
				return;
			}
			
			this.fileArr = this.fileArr.concat(files);

			if (this.fileArr.length === this.options.maxFiles) {
				this.$file.prop('disabled', true);
				// TODO стили блокировки для label
			}
			
			if (this.options.autoStart || !this.progress) { //!?
				// отправляем файлы
				// this.$file.prop('disabled', true);
				// this.fileGoAway();
				// e.target.value = null;
			}
		},
		/*
         * Validate files
         *
         * @method validate
		 * @param files file object from input
         */
		validate: function(files) {
			var fLength = files.length,
				o = this.options,
				fCount = this.fileArr.length + fLength;
			
			if(o.maxFiles !== null && o.maxFiles < fLength) {
				throw new Error(_h.template(o.errors.maxFiles, o.maxFiles));
			}
			
			if(o.maxFiles !== null && o.maxFiles < fCount) {
				var total = o.maxFiles - this.fileArr.length;
				throw new Error(_h.template(o.errors.maxFilesSelect, {maxFiles:o.maxFiles, fileCount: total.toString()}));
			}
			
			[].forEach.call(files, function(file) {
				// validate size
				if (o.maxSize !== null && ((file.size / 1024) / 1024 > o.maxSize)) {
					throw new Error(_h.template(o.errors.maxSize, {fileName: file.name, maxSize: o.maxSize.toString()}));
				}
				
				// validate type
				if (o.acceptExtension !== null) {
					var ext = file.name.toLocaleLowerCase().split('.')[1];
					if (!~o.acceptExtension.indexOf(ext)) {
						var err = _h.template(o.errors.invalidExtension, {
							fileName: file.name, 
							fileExtension: o.acceptExtension.join(', ')
						});
						
						throw new Error(err);
					}
				}
				
				// validate type
				if (o.acceptType !== null && !~o.acceptType.indexOf(file.type)) {
					var err = _h.template(o.errors.invalidType, {
							fileName: file.name, 
							fileType: o.acceptType.join(', ')
						});
						
					throw new Error(err);
				}
			});
		},
		
		/*
         * Prepare and send files
         *
         * @method fileGoAway
         */
		fileGoAway: function () {
		
		}
	});
	
	
	$(document).ready(function () {
		console.time('d');
		var components = document.querySelectorAll('gena-upload');
		
		[].forEach.call(components, function (component) {
			var template = component.querySelectorAll('[data-rel="input"]');

			template = _h.template(
				template.length
				? template[0].innerHTML
				: GU.templates.input, component.id);
			
			template = $(template);
			
			$(component).replaceWith(template);
			$.data(template, 'genaUploader', new GU(template, component.id));
			
			template = null;
		});
		console.timeEnd('d');
	});
	
})(document, window, jQuery);
},{}]},{},["/media/5b8c33bd-b0bc-468a-b4a8-bde993bcb4bf/www/uploader/public/dev/uploader.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL21lZGlhLzViOGMzM2JkLWIwYmMtNDY4YS1iNGE4LWJkZTk5M2JjYjRiZi93d3cvdXBsb2FkZXIvcHVibGljL2Rldi91cGxvYWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZG9jdW1lbnQsIHdpbmRvdywgJCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIHNsaWNlICAgID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLFxuXHRcdHNwbGljZSAgID0gQXJyYXkucHJvdG90eXBlLnNwbGljZSxcblx0XHR0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG5cdFx0Z2V0S2V5cyAgPSBPYmplY3Qua2V5cyxcblx0XHRoYXNPd24gICA9IE9iamVjdC5oYXNPd25Qcm9wZXJ0eTtcblxuXHQvLyBIZWxwZXJzXG5cdHZhciBfaCA9IHtcblx0XHRub29wOiBmdW5jdGlvbiAoKSB7fSxcblx0XHRpc1VuZGVmaW5lZDogZnVuY3Rpb24gKGFyZykge3JldHVybiBhcmcgPT09IHZvaWQgMDsgfSxcblx0XHRpc0Z1bmN0aW9uOiBmdW5jdGlvbiAoeCkge3JldHVybiB0b1N0cmluZy5jYWxsKHgpID09PSAnW29iamVjdCBGdW5jdGlvbl0nOyB9LFxuXHRcdGlzT2JqZWN0OiBmdW5jdGlvbiAoeCkge3JldHVybiB0eXBlb2YgeCA9PT0gJ29iamVjdCcgJiYgeCAhPT0gbnVsbDsgfSxcblx0XHRpc0FycmF5OiBmdW5jdGlvbiAoeCkge3JldHVybiB0b1N0cmluZy5jYWxsKHgpID09PSAnW29iamVjdCBBcnJheV0nOyB9LFxuXHRcdG9IYXM6IGZ1bmN0aW9uIChvYmosIGtleSkge3JldHVybiBvYmogIT09IG51bGwgJiYgaGFzT3duLmNhbGwob2JqLCBrZXkpOyB9XG5cdH07XG5cdFxuXHRfaC50ZW1wbGF0ZSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgZGF0YSkge1xuICAgICAgICByZXR1cm4gdGVtcGxhdGUucmVwbGFjZSgvXFx7eyhbXFx3XFwuXSopXFx9fS9nLCBmdW5jdGlvbiAoc3RyLCBrZXkpIHtcbiAgICAgICAgICAgIHZhciBrZXlzID0ga2V5LnNwbGl0KFwiLlwiKSwgdmFsdWUgPSBkYXRhW2tleXMuc2hpZnQoKV0gfHwgZGF0YTtcbiAgICAgICAgICAgICQuZWFjaChrZXlzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZVt0aGlzXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSA/IFwiXCIgOiAoJC5pc0FycmF5KHZhbHVlKSA/IHZhbHVlLmpvaW4oJycpIDogdmFsdWUpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXHRcblx0Ly8gRGV0ZWN0IGJyb3dzZXJcblx0dmFyIF91YSA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKSxcblx0XHRfaXMgPSB7XG5cdFx0XHR2ZXJzaW9uOiAoX3VhLm1hdGNoKCAvLisoPzptZXxveHxvbnxydnxpdHxlcmF8b3ByfGllKVtcXC86IF0oW1xcZC5dKykvICkgfHwgWzAsJzAnXSlbMV0sXG5cdFx0XHRvcGVyYTogKC9vcGVyYS9pLnRlc3QoX3VhKSB8fCAvb3ByL2kudGVzdChfdWEpKSxcblx0XHRcdG1zaWU6ICgvbXNpZS9pLnRlc3QoX3VhKSAmJiAhL29wZXJhL2kudGVzdChfdWEpIHx8IC90cmlkZW50XFwvL2kudGVzdChfdWEpKSxcblx0XHRcdG1zaWU4OiAoL21zaWUgOC9pLnRlc3QoX3VhKSAmJiAhL29wZXJhL2kudGVzdChfdWEpKSxcblx0XHRcdG1zaWU5OiAoL21zaWUgOS9pLnRlc3QoX3VhKSAmJiAhL29wZXJhL2kudGVzdChfdWEpKSxcblx0XHRcdG1vemlsbGE6IC9maXJlZm94L2kudGVzdChfdWEpLFxuXHRcdFx0Y2hyb21lOiAvY2hyb21lL2kudGVzdChfdWEpLFxuXHRcdFx0c2FmYXJpOiAoISgvY2hyb21lL2kudGVzdChfdWEpKSAmJiAvd2Via2l0fHNhZmFyaXxraHRtbC9pLnRlc3QoX3VhKSksXG5cdFx0XHRpcGhvbmU6IC9pcGhvbmUvaS50ZXN0KF91YSksXG5cdFx0XHRpcGhvbmU0OiAvaXBob25lLipPUyA0L2kudGVzdChfdWEpLFxuXHRcdFx0aXBvZDQ6IC9pcG9kLipPUyA0L2kudGVzdChfdWEpLFxuXHRcdFx0aXBhZDogL2lwYWQvaS50ZXN0KF91YSksXG5cdFx0XHRhbmRyb2lkOiAvYW5kcm9pZC9pLnRlc3QoX3VhKSxcblx0XHRcdG1vYmlsZTogL2lwaG9uZXxpcG9kfGlwYWR8b3BlcmEgbWluaXxvcGVyYSBtb2JpfGllbW9iaWxlfGFuZHJvaWQvaS50ZXN0KF91YSksXG5cdFx0XHRtc2llX21vYmlsZTogL2llbW9iaWxlL2kudGVzdChfdWEpLFxuXHRcdFx0c2FmYXJpX21vYmlsZTogL2lwaG9uZXxpcG9kfGlwYWQvaS50ZXN0KF91YSksXG5cdFx0XHRvcGVyYV9tb2JpbGU6IC9vcGVyYSBtaW5pfG9wZXJhIG1vYmkvaS50ZXN0KF91YSksXG5cdFx0XHRvcGVyYV9taW5pOiAvb3BlcmEgbWluaS9pLnRlc3QoX3VhKVxuXHRcdH0sXG5cdFx0X3N1cHBvcnQgPSAoZnVuY3Rpb24gKHdpbmRvdykge1xuICAgICAgICAgICAgdmFyIHN1cHBvcnQgPSB7fTtcblxuICAgICAgICAgICAgLy8gV2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyB1cGxvYWRpbmcgZmlsZXMgd2l0aCBYTUxIdHRwUmVxdWVzdFxuICAgICAgICAgICAgc3VwcG9ydC54aHJVcGxvYWQgPSAhIXdpbmRvdy5YTUxIdHRwUmVxdWVzdCAmJiAndXBsb2FkJyBpbiBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAgICAgLy8gV2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBzZWxlY3RpbmcgbXVsdGlwbGUgZmlsZXMgYXQgb25jZVxuICAgICAgICAgICAgc3VwcG9ydC5zZWxlY3RNdWx0aXBsZSA9ICEhd2luZG93LkZpbGVMaXN0ICYmICdtdWx0aXBsZScgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcblxuICAgICAgICAgICAgLy8gV2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBkcm9wcGluZyBmaWxlcyB0byB0aGUgZHJvcCB6b25lXG4gICAgICAgICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICBzdXBwb3J0LmRyb3BGaWxlcyA9ICAnb25kcmFnc3RhcnQnIGluIGRpdiAmJiAnb25kcm9wJyBpbiBkaXYgJiYgISF3aW5kb3cuRmlsZUxpc3Q7XG5cbiAgICAgICAgICAgIHJldHVybiBzdXBwb3J0O1xuICAgICAgICB9KHdpbmRvdykpO1xuXHRcblx0LyoqXG5cdCAqIFRlbXAgc3RvcmUgb2JqZWN0XG5cdCAqL1xuXHR2YXIgc3RvcmUgPSB7XG5cdFx0X3N0b3JlOiBbXSxcblx0XHRnZXQ6IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX3N0b3JlW2lkXTtcblx0XHR9LFxuXHRcdHNldDogZnVuY3Rpb24gKGlkLCBjb21wb25lbnQpIHtcblx0XHRcdHRoaXMuX3N0b3JlW2lkXSA9IGNvbXBvbmVudDtcblx0XHR9LFxuXHRcdHJlbW92ZTogZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRcblx0XHR9LFxuXHRcdGdldEFsbDogZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX3N0b3JlO1xuXHRcdH1cblx0fTtcblx0XG5cdFxuXHQvKipcblx0ICogQ3JlYXRlIFhIUiBjbGFzc1xuXHQgKlxuXHQgKiBAcGFyYW0gb3B0aW9uc1xuXHQgKi9cblx0dmFyIFhIUiA9IGZ1bmN0aW9uKCkge307XG5cdFx0XG5cdCQuZXh0ZW5kKFhIUi5wcm90b3R5cGUsIHtcblx0XHRnZXRYSFI6IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChfc3VwcG9ydC54aHJVcGxvYWQpIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHRcdFx0fSBlbHNlIGlmICh3aW5kb3cuQWN0aXZlWE9iamVjdCkge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHJldHVybiBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRcblx0XHRnZXRJZnJhbWU6IGZ1bmN0aW9uKCkge31cblx0fSk7XG5cdFxuXHQvKipcblx0ICogQ3JlYXRlIFVwbG9hZGVyIGNsYXNzXG5cdCAqXG5cdCAqIEBwYXJhbSBvcHRpb25zXG5cdCAqL1xuXHR2YXIgR1UgPSB3aW5kb3cuR1UgPSBmdW5jdGlvbiAocm93LCBpZCkge1xuXHRcdHRoaXMuJGZpbGUgPSByb3cuZmluZCgnaW5wdXRbdHlwZT1maWxlXScpO1xuXHRcdHRoaXMub3B0aW9ucyA9IHN0b3JlLmdldChpZCk7XG5cdFx0XG5cdFx0aWYgKCF0aGlzLm9wdGlvbnMpIHtcblx0XHRcdHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBHVS5kZWZhdWx0cyk7XG5cdFx0XHR0aGlzLm9wdGlvbnMuaWQgPSBpZDtcblx0XHR9XG5cdFx0XG5cdFx0dGhpcy4kZmlsZS5hdHRyKHtcbiAgICAgICAgICAgIGlkOiB0aGlzLm9wdGlvbnMuaWQsICAgICAgICAgXG4gICAgICAgICAgICBkaXNhYmxlZDogdGhpcy5vcHRpb25zLmRpc2FibGVkLFxuXHRcdFx0bmFtZTogdGhpcy5vcHRpb25zLm5hbWVcbiAgICAgICAgfSk7XG5cdFx0Ly8gIT9cblx0XHRpZiAoX3N1cHBvcnQuc2VsZWN0TXVsdGlwbGUpIHtcblx0XHRcdHRoaXMuJGZpbGUuYXR0cignbXVsdGlwbGUnLCB0aGlzLm9wdGlvbnMubXVsdGlwbGUpO1xuXHRcdH1cblx0XHRcblx0XHQvLyBzZXQgbGFiZWwgdGV4dFxuXHRcdHJvdy5maW5kKCcuZ2Z1LXRleHQnKS50ZXh0KHRoaXMub3B0aW9ucy50ZXh0KTtcblx0XHRcblx0XHQvLyBkZWZpbmUgcXVldWUgcHJvcHNcblx0XHR0aGlzLmZpbGVBcnIgPSBbXTtcblx0XHR0aGlzLnByb2dyZXNzID0gZmFsc2U7XG5cdFx0XG5cdFx0Ly8gc2V0IGV2ZW50IGhhbmRsZXJcblx0XHR0aGlzLiRmaWxlLm9uKCdjaGFuZ2UuZ2Z1JywgJC5wcm94eSh0aGlzLmFkZEZpbGVzLCB0aGlzKSk7XG5cdH07XG5cdFxuXHQvKipcblx0ICogRGVmaW5lIHRoZSBzdGF0aWMgcHJvcGVydGllcyBvZiBVcGxvYWRlclxuXHQgKi9cblx0JC5leHRlbmQoR1UsIHtcblx0XHQvKipcblx0XHQgKiBEZWZhdWx0IHZhbHVlc1xuXHRcdCAqL1xuXHRcdGRlZmF1bHRzOiB7XG5cdFx0XHQvLyBpZCBvZiBjb21wb25lbnRcblx0XHRcdGlkOiBudWxsLFxuXHRcdFx0Ly8gTmFtZSBvZiB0aGUgZmlsZSBpbnB1dFxuXHRcdFx0bmFtZTogJ2ZpbGVzJyxcblx0XHRcdFxuXHRcdFx0Ly8gRGVmYXVsdCBsYWJlbCB0ZXh0XG5cdFx0XHR0ZXh0OiAn0JfQsNCz0YDRg9C30LjRgtGMINGE0LDQudC7JyxcblxuXHRcdFx0Ly8gV2hldGhlciBzZWxlY3RpbmcgbXVsdGlwbGUgZmlsZXMgYXQgb25jZSBpbiBhbGxvd2VkXG5cdFx0XHRtdWx0aXBsZTogdHJ1ZSxcblxuXHRcdFx0Ly8gRGlzYWJsZSBpbnB1dCAgaWYgdGhlIG51bWJlciBvZiBmaWxlcyBpcyB0aGUgbWF4aW11bSBudW1iZXIgb2YgdXBsb2FkZWQgZmlsZXMgb3IgcmVxdWlyZWQgYnkgdGhlIGxvZ2ljXG5cdFx0XHRkaXNhYmxlZDogZmFsc2UsXG5cblx0XHRcdC8vIFRoZSBtYXhpbXVtIG51bWJlciBvZiBmaWxlcyB0aGUgdXNlciBjYW4gdXBsb2FkIChieSBkZWZhdWx0IHRoZXJlIGlzIG5vIGxpbWl0KVxuXHRcdFx0bWF4RmlsZXM6IG51bGwsXG5cblx0XHRcdC8vIFRoZSBtYXhpbXVtIHNpemUgb2YgZmlsZXMgdGhlIHVzZXIgY2FuIHVwbG9hZCAoYnkgZGVmYXVsdCB0aGVyZSBpcyBubyBsaW1pdClcblx0XHRcdG1heFNpemU6IG51bGwsXG5cblx0XHRcdC8vIFdoZXRoZXIgdG8gYXV0b21hdGljYWxseSB1cGxvYWQgZmlsZXMgYWZ0ZXIgdGhleSB3ZXJlIHNlbGVjdGVkXG5cdFx0XHRhdXRvU3RhcnQ6IHRydWUsXG5cblx0XHRcdC8vIFJlcXVpcmVkIGZpZWxkIGluIHRoZSBmb3JtIChieSBkZWZhdWx0IHJlcXVpcmVkKVxuXHRcdFx0cmVxdWlyZWQ6IHRydWUsXG5cblx0XHRcdC8vIEFycmF5IG9mIHRoZSBhY2NlcHRlZCBmaWxlIHR5cGVzLCBleC4gWydhcHBsaWNhdGlvbi94LWNkLWltYWdlJ10gKGJ5IGRlZmF1bHQgYWxsIHR5cGVzIGFyZSBhY2NlcHRlZClcblx0XHRcdGFjY2VwdFR5cGU6IG51bGwsXG5cblx0XHRcdC8vIEFycmF5IG9mIHRoZSBhY2NlcHRlZCBmaWxlIHR5cGVzLCBleC4gWydqcGcnLCAnanBlZycsICdwbmcnXSAoYnkgZGVmYXVsdCBhbGwgdHlwZXMgYXJlIGFjY2VwdGVkKVxuXHRcdFx0YWNjZXB0RXh0ZW5zaW9uOiBudWxsLFxuXG5cdFx0XHQvLyBBZGRpdGlvbmFsIGRhdGEgdG8gc2VuZCB3aXRoIHRoZSBmaWxlc1xuXHRcdFx0ZGF0YToge30sXG5cblx0XHRcdC8vIEFkZGl0aW9uYWwgaGVhZGVycyB0byBzZW5kIHdpdGggdGhlIGZpbGVzIChvbmx5IGZvciBhamF4IHVwbG9hZHMpXG5cdFx0XHRoZWFkZXJzOiB7fSxcblxuXHRcdFx0Ly8gVXBsb2FkIHN1Y2Nlc3MgY2FsbGJhY2tcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHt9LFxuXG5cdFx0XHQvLyBVcGxvYWQgZmFpbCBjYWxsYmFja1xuXHRcdFx0ZmFpbDogZnVuY3Rpb24gKCkge30sXG5cblx0XHRcdC8vIFRoZSB1cmwgdG8gdXBsb2FkIHRoZSBmaWxlcyB0b1xuXHRcdFx0dXJsOiBkb2N1bWVudC5VUkwsXG5cblx0XHRcdC8vIFRoZSB1cmwgdG8gcmVtb3ZlIHRoZSBmaWxlc1xuXHRcdFx0cmVtb3ZlVXJsOiBudWxsLFxuXG5cdFx0XHQvLyBFbmFibGUgRURTIGZ1bmN0aW9uYWxcblx0XHRcdGVkczogZmFsc2UsXG5cblx0XHRcdC8vIEVycm9yIG1lc3NhZ2VzXG5cdFx0XHRlcnJvcnM6IHtcblx0XHRcdFx0bWF4RmlsZXM6ICfQn9GA0LXQstGL0YjQtdC90L3QviDQutC+0LvQu9C40YfQtdGB0LLQviDRhNCw0LnQu9C+0LIge3ttYXhGaWxlc319INCy0L7Qt9C80L7QttC90YvRhSDQtNC70Y8g0LfQsNCz0YDRg9C30LrQuCEnLFxuXHRcdFx0XHRtYXhGaWxlc1NlbGVjdDogJ9CS0YvQsdGA0LDQvdC+IHt7ZmlsZUNvdW50fX0g0YTQsNC50LvQvtCyINC40Lcge3ttYXhGaWxlc319INCy0L7Qt9C80L7QttC90YvRhScsXG5cdFx0XHRcdG1heFNpemU6ICfQoNCw0LfQvNC10YAg0YTQsNC50LvQsCB7e2ZpbGVOYW1lfX0g0L/RgNC10LLRi9GB0LjQuyDQvNCw0LrRgdC40LzQsNC70YzQvdGL0Lkg0YDQsNC30LzQtdGAIHt7bWF4U2l6ZX19IE1iJyxcblx0XHRcdFx0aW52YWxpZFR5cGU6ICfQndC10LLQtdGA0L3Ri9C5INGC0LjQvyDRhNCw0LnQu9CwIHt7ZmlsZU5hbWV9fS4g0JTQu9GPINC30LDQs9GA0YPQt9C60Lgg0YDQsNC30YDQtdGI0LXQvdGLOiB7e2ZpbGVUeXBlfX0nLFxuXHRcdFx0XHRpbnZhbGlkRXh0ZW5zaW9uOiAn0J3QtdCy0LXRgNC90L7QtSDRgNCw0YHRiNC40YDQtdC90LjQtSDRhNCw0LnQu9CwIHt7ZmlsZU5hbWV9fS4g0KDQsNC30YDQtdGI0LXQvdGLINGB0LvQtdC00YPRjtGJ0LjQtToge3tmaWxlRXh0ZW5zaW9ufX0nXG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvLyBkZWZhdWx0IHRlbXBsYXRlc1xuXHRcdHRlbXBsYXRlczoge1xuXHRcdFx0aW5wdXQ6IFsnPGRpdiBjbGFzcz1cImdmdS13cmFwXCI+Jyxcblx0XHRcdFx0XHRcdCc8bGFiZWwgZm9yPVwie3tpZH19XCIgY2xhc3M9XCJmaWxlLWxhYmVsXCI+PHNwYW4gY2xhc3M9XCJnZnUtdGV4dFwiPjwvc3Bhbj48aW5wdXQgdHlwZT1cImZpbGVcIiBpZD1cInt7aWR9fVwiPjwvbGFiZWw+JyxcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JzwvZGl2Pidcblx0XHRcdFx0ICAgXS5qb2luKCcnKSxcblx0XHRcdFxuXHRcdFx0cHJvZ3Jlc3M6IFsnPGRpdiBjbGFzcz1cImdmdS1yb3dcIj48ZGl2IGNsYXNzPVwiZ2Z1LXJvdy1wcm9ncmVzc1wiPjwvZGl2PjwvZGl2PiddLmpvaW4oJycpLFxuXHRcdFxuXHRcdFx0c3VjY2VzczogWyc8ZGl2IGNsYXNzPVwidXBsb2FkXCI+0JfQsNCz0YDRg9C20LXQvSDRhNCw0LnQuyA8L2Rpdj4nXS5qb2luKCcnKVxuXHRcdH0sXG5cdFx0Ly8gZXh0ZW5kIGN1c3RvbSBvcHRpb25zIGZyb20gY29tcG9uZW50XG5cdFx0ZXh0ZW5kOiBmdW5jdGlvbihvYmopIHtcblx0XHRcdHN0b3JlLnNldChvYmouaWQsICQuZXh0ZW5kKHt9LCBHVS5kZWZhdWx0cywgb2JqKSk7XG5cdFx0fVxuXHR9KTtcblx0XG5cdCQuZXh0ZW5kKEdVLnByb3RvdHlwZSwge1xuXHRcdC8qXG4gICAgICAgICAqIEFkZCBpbnB1dCBmaWxlcyBpbiB1cGxvYWQgcXVldWVcbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCBhZGRGaWxlc1xuICAgICAgICAgKi9cblx0XHRhZGRGaWxlczogZnVuY3Rpb24gKGUpIHtcblx0XHRcdC8vIFRPRE8g0YPQtNCw0LvQtdC90LjQtSDQuNC3INC+0YfQtdGA0LXQtNC4INC/0YDQuCDRgdCx0YDQvtGB0LVcblx0XHRcdGlmIChlLnRhcmdldC52YWx1ZSA9PT0gJycpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR2YXIgZmlsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoZS50YXJnZXQuZmlsZXMpO1xuXHRcdFx0XG5cdFx0XHR0cnkge1xuXHRcdFx0XHR0aGlzLnZhbGlkYXRlKGZpbGVzKTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xuXHRcdFx0XHRlLnRhcmdldC52YWx1ZSA9IG51bGw7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5maWxlQXJyID0gdGhpcy5maWxlQXJyLmNvbmNhdChmaWxlcyk7XG5cblx0XHRcdGlmICh0aGlzLmZpbGVBcnIubGVuZ3RoID09PSB0aGlzLm9wdGlvbnMubWF4RmlsZXMpIHtcblx0XHRcdFx0dGhpcy4kZmlsZS5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xuXHRcdFx0XHQvLyBUT0RPINGB0YLQuNC70Lgg0LHQu9C+0LrQuNGA0L7QstC60Lgg0LTQu9GPIGxhYmVsXG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGlmICh0aGlzLm9wdGlvbnMuYXV0b1N0YXJ0IHx8ICF0aGlzLnByb2dyZXNzKSB7IC8vIT9cblx0XHRcdFx0Ly8g0L7RgtC/0YDQsNCy0LvRj9C10Lwg0YTQsNC50LvRi1xuXHRcdFx0XHQvLyB0aGlzLiRmaWxlLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG5cdFx0XHRcdC8vIHRoaXMuZmlsZUdvQXdheSgpO1xuXHRcdFx0XHQvLyBlLnRhcmdldC52YWx1ZSA9IG51bGw7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvKlxuICAgICAgICAgKiBWYWxpZGF0ZSBmaWxlc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAbWV0aG9kIHZhbGlkYXRlXG5cdFx0ICogQHBhcmFtIGZpbGVzIGZpbGUgb2JqZWN0IGZyb20gaW5wdXRcbiAgICAgICAgICovXG5cdFx0dmFsaWRhdGU6IGZ1bmN0aW9uKGZpbGVzKSB7XG5cdFx0XHR2YXIgZkxlbmd0aCA9IGZpbGVzLmxlbmd0aCxcblx0XHRcdFx0byA9IHRoaXMub3B0aW9ucyxcblx0XHRcdFx0ZkNvdW50ID0gdGhpcy5maWxlQXJyLmxlbmd0aCArIGZMZW5ndGg7XG5cdFx0XHRcblx0XHRcdGlmKG8ubWF4RmlsZXMgIT09IG51bGwgJiYgby5tYXhGaWxlcyA8IGZMZW5ndGgpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKF9oLnRlbXBsYXRlKG8uZXJyb3JzLm1heEZpbGVzLCBvLm1heEZpbGVzKSk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGlmKG8ubWF4RmlsZXMgIT09IG51bGwgJiYgby5tYXhGaWxlcyA8IGZDb3VudCkge1xuXHRcdFx0XHR2YXIgdG90YWwgPSBvLm1heEZpbGVzIC0gdGhpcy5maWxlQXJyLmxlbmd0aDtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKF9oLnRlbXBsYXRlKG8uZXJyb3JzLm1heEZpbGVzU2VsZWN0LCB7bWF4RmlsZXM6by5tYXhGaWxlcywgZmlsZUNvdW50OiB0b3RhbC50b1N0cmluZygpfSkpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwoZmlsZXMsIGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdFx0Ly8gdmFsaWRhdGUgc2l6ZVxuXHRcdFx0XHRpZiAoby5tYXhTaXplICE9PSBudWxsICYmICgoZmlsZS5zaXplIC8gMTAyNCkgLyAxMDI0ID4gby5tYXhTaXplKSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihfaC50ZW1wbGF0ZShvLmVycm9ycy5tYXhTaXplLCB7ZmlsZU5hbWU6IGZpbGUubmFtZSwgbWF4U2l6ZTogby5tYXhTaXplLnRvU3RyaW5nKCl9KSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdC8vIHZhbGlkYXRlIHR5cGVcblx0XHRcdFx0aWYgKG8uYWNjZXB0RXh0ZW5zaW9uICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0dmFyIGV4dCA9IGZpbGUubmFtZS50b0xvY2FsZUxvd2VyQ2FzZSgpLnNwbGl0KCcuJylbMV07XG5cdFx0XHRcdFx0aWYgKCF+by5hY2NlcHRFeHRlbnNpb24uaW5kZXhPZihleHQpKSB7XG5cdFx0XHRcdFx0XHR2YXIgZXJyID0gX2gudGVtcGxhdGUoby5lcnJvcnMuaW52YWxpZEV4dGVuc2lvbiwge1xuXHRcdFx0XHRcdFx0XHRmaWxlTmFtZTogZmlsZS5uYW1lLCBcblx0XHRcdFx0XHRcdFx0ZmlsZUV4dGVuc2lvbjogby5hY2NlcHRFeHRlbnNpb24uam9pbignLCAnKVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihlcnIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0Ly8gdmFsaWRhdGUgdHlwZVxuXHRcdFx0XHRpZiAoby5hY2NlcHRUeXBlICE9PSBudWxsICYmICF+by5hY2NlcHRUeXBlLmluZGV4T2YoZmlsZS50eXBlKSkge1xuXHRcdFx0XHRcdHZhciBlcnIgPSBfaC50ZW1wbGF0ZShvLmVycm9ycy5pbnZhbGlkVHlwZSwge1xuXHRcdFx0XHRcdFx0XHRmaWxlTmFtZTogZmlsZS5uYW1lLCBcblx0XHRcdFx0XHRcdFx0ZmlsZVR5cGU6IG8uYWNjZXB0VHlwZS5qb2luKCcsICcpXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihlcnIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdFxuXHRcdC8qXG4gICAgICAgICAqIFByZXBhcmUgYW5kIHNlbmQgZmlsZXNcbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCBmaWxlR29Bd2F5XG4gICAgICAgICAqL1xuXHRcdGZpbGVHb0F3YXk6IGZ1bmN0aW9uICgpIHtcblx0XHRcblx0XHR9XG5cdH0pO1xuXHRcblx0XG5cdCQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcblx0XHRjb25zb2xlLnRpbWUoJ2QnKTtcblx0XHR2YXIgY29tcG9uZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2dlbmEtdXBsb2FkJyk7XG5cdFx0XG5cdFx0W10uZm9yRWFjaC5jYWxsKGNvbXBvbmVudHMsIGZ1bmN0aW9uIChjb21wb25lbnQpIHtcblx0XHRcdHZhciB0ZW1wbGF0ZSA9IGNvbXBvbmVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1yZWw9XCJpbnB1dFwiXScpO1xuXG5cdFx0XHR0ZW1wbGF0ZSA9IF9oLnRlbXBsYXRlKFxuXHRcdFx0XHR0ZW1wbGF0ZS5sZW5ndGhcblx0XHRcdFx0PyB0ZW1wbGF0ZVswXS5pbm5lckhUTUxcblx0XHRcdFx0OiBHVS50ZW1wbGF0ZXMuaW5wdXQsIGNvbXBvbmVudC5pZCk7XG5cdFx0XHRcblx0XHRcdHRlbXBsYXRlID0gJCh0ZW1wbGF0ZSk7XG5cdFx0XHRcblx0XHRcdCQoY29tcG9uZW50KS5yZXBsYWNlV2l0aCh0ZW1wbGF0ZSk7XG5cdFx0XHQkLmRhdGEodGVtcGxhdGUsICdnZW5hVXBsb2FkZXInLCBuZXcgR1UodGVtcGxhdGUsIGNvbXBvbmVudC5pZCkpO1xuXHRcdFx0XG5cdFx0XHR0ZW1wbGF0ZSA9IG51bGw7XG5cdFx0fSk7XG5cdFx0Y29uc29sZS50aW1lRW5kKCdkJyk7XG5cdH0pO1xuXHRcbn0pKGRvY3VtZW50LCB3aW5kb3csIGpRdWVyeSk7Il19
