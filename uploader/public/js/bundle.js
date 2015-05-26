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
	 * Temp store object
	 */
	var store = {
		_store: [],
		get: function(id){
			return this._store.filter(function(el){
				return el.id === id;
			})[0];
		},
		set: function(component) {
			this._store.push(component);
		},
		remove: function(id) {
			
		},
		getAll: function(){
			return this._store;
		}
	};
	
	
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
	var GU = window.GU = function (input, id) {
		this.options = store.get(id);
		this.$file = input.find('input[type=file]');
		
		this.$file.attr({
            id: id,         
            disabled: this.options.disabled
        });
		// !?
		if(_support.selectMultiple) {
			this.$file.attr('multiple', this.options.multiple);
		}
		
		// define queue props
		this.counter = -1;
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
				maxSize: 'Размер файла {{fileName}} превысил максимальный размер {{maxSize}} Mb',
				invalidType: 'Неверный тип файла {{fileName}}. Для загрузки разрешены: {{fileType}}',
				invalidExtension: 'Неверное расширение файла {{fileName}}. Разрешены следующие: {{fileExtension}}'
			}
		},
		// default templates
		templates: {
			input: ['<div class="gfu-wrap">',
						'<label for="{{id}}" class="file-label"><span>{{label}}</span><input type="file" id="{{id}}"></label>',											'</div>'
				   ].join(''),
			
			progress:['<div class="gfu-row"><div class="gfu-row-progress"></div></div>'].join(''),
		
			upload: ['<div class="upload">Загружен файл </div>'].join('')
		},
		// extend custom options from component
		extend: function(obj) {
			store.set($.extend({}, GU.defaults, obj));
		}
	});
	
	$.extend(GU.prototype, {
		/*
         * Add input files in upload queue
         *
         * @method addFiles
         */
		addFiles: function(e) {
			// TODO удаление из очереди при сбросе
			if(e.target.value === '') {
				return;
			}
			
			try {
				this.validate(e.target.files);
			}
			catch(err){
				console.log(err);
				e.target.value = null;
			}
			
			// add files in queue
			
			if(this.options.autoStart) {
				// отправляем файлы
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
				o = this.options;
				
			if(o.maxFiles !== null && (o.maxFiles < fLength || o.maxFiles == this.fileArr.length)) {
				throw new Error(_h.template(o.errors.maxFiles, o.maxFiles));
			}
			
			[].forEach.call(files, function(file) {
				// validate size
				if(o.maxSize !== null && ((file.size / 1024) / 1024 > o.maxSize)) { 
					throw new Error(_h.template(o.errors.maxSize, {fileName: file.name, maxSize: o.maxSize.toString()}));
				}
				
				// validate type
				if(o.acceptExtension !== null) {
					var ext = file.name.toLocaleLowerCase().split('.')[1];
					if(!~o.acceptExtension.indexOf(ext)) {
						var err = _h.template(o.errors.invalidExtension, {
							fileName: file.name, 
							fileExtension: o.acceptExtension.join(', ')
						});
						
						throw new Error(err);
					}
				}
				
				// validate type
				if(o.acceptType !== null && !~o.acceptType.indexOf(file.type)) {
					var err = _h.template(o.errors.invalidType, {
							fileName: file.name, 
							fileType: o.acceptType.join(', ')
						});
						
					throw new Error(err);
				}
			});
		}
	
	});
	
	
	$(document).ready(function(){
		var components = document.querySelectorAll('gena-upload');
		
		[].forEach.call(components, function(component) {
			var input = $(_h.template(GU.templates.input, component.id));
			
			$(component).replaceWith(input);
			if (!$.data(input, 'genaUploader')) {
                $.data(input, 'genaUploader', new GU(input, component.id))
            }
		})
	});
	
}(document, window, jQuery));
},{}]},{},["/media/5b8c33bd-b0bc-468a-b4a8-bde993bcb4bf/www/uploader/public/dev/uploader.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL21lZGlhLzViOGMzM2JkLWIwYmMtNDY4YS1iNGE4LWJkZTk5M2JjYjRiZi93d3cvdXBsb2FkZXIvcHVibGljL2Rldi91cGxvYWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKGRvY3VtZW50LCB3aW5kb3csICQpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBzbGljZSAgICA9IEFycmF5LnByb3RvdHlwZS5zbGljZSxcblx0XHRzcGxpY2UgICA9IEFycmF5LnByb3RvdHlwZS5zcGxpY2UsXG5cdFx0dG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuXHRcdGdldEtleXMgID0gT2JqZWN0LmtleXMsXG5cdFx0aGFzT3duICAgPSBPYmplY3QuaGFzT3duUHJvcGVydHk7XG5cblx0Ly8gSGVscGVyc1xuXHR2YXIgX2ggPSB7XG5cdFx0bm9vcDogZnVuY3Rpb24gKCkge30sXG5cdFx0aXNVbmRlZmluZWQ6IGZ1bmN0aW9uIChhcmcpIHtyZXR1cm4gYXJnID09PSB2b2lkIDA7IH0sXG5cdFx0aXNGdW5jdGlvbjogZnVuY3Rpb24gKHgpIHtyZXR1cm4gdG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJzsgfSxcblx0XHRpc09iamVjdDogZnVuY3Rpb24gKHgpIHtyZXR1cm4gdHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGw7IH0sXG5cdFx0aXNBcnJheTogZnVuY3Rpb24gKHgpIHtyZXR1cm4gdG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJyYXldJzsgfSxcblx0XHRvSGFzOiBmdW5jdGlvbiAob2JqLCBrZXkpIHtyZXR1cm4gb2JqICE9IG51bGwgJiYgaGFzT3duLmNhbGwob2JqLCBrZXkpOyB9XG5cdH07XG5cdFxuXHRfaC50ZW1wbGF0ZSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgZGF0YSkge1xuICAgICAgICByZXR1cm4gdGVtcGxhdGUucmVwbGFjZSgvXFx7eyhbXFx3XFwuXSopXFx9fS9nLCBmdW5jdGlvbiAoc3RyLCBrZXkpIHtcbiAgICAgICAgICAgIHZhciBrZXlzID0ga2V5LnNwbGl0KFwiLlwiKSwgdmFsdWUgPSBkYXRhW2tleXMuc2hpZnQoKV0gfHwgZGF0YTtcbiAgICAgICAgICAgICQuZWFjaChrZXlzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZVt0aGlzXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSA/IFwiXCIgOiAoJC5pc0FycmF5KHZhbHVlKSA/IHZhbHVlLmpvaW4oJycpIDogdmFsdWUpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXHRcblx0Ly8gRGV0ZWN0IGJyb3dzZXJcblx0dmFyIF91YSA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKSxcblx0XHRfaXMgPSB7XG5cdFx0XHR2ZXJzaW9uOiAoX3VhLm1hdGNoKCAvLisoPzptZXxveHxvbnxydnxpdHxlcmF8b3ByfGllKVtcXC86IF0oW1xcZC5dKykvICkgfHwgWzAsJzAnXSlbMV0sXG5cdFx0XHRvcGVyYTogKC9vcGVyYS9pLnRlc3QoX3VhKSB8fCAvb3ByL2kudGVzdChfdWEpKSxcblx0XHRcdG1zaWU6ICgvbXNpZS9pLnRlc3QoX3VhKSAmJiAhL29wZXJhL2kudGVzdChfdWEpIHx8IC90cmlkZW50XFwvL2kudGVzdChfdWEpKSxcblx0XHRcdG1zaWU4OiAoL21zaWUgOC9pLnRlc3QoX3VhKSAmJiAhL29wZXJhL2kudGVzdChfdWEpKSxcblx0XHRcdG1zaWU5OiAoL21zaWUgOS9pLnRlc3QoX3VhKSAmJiAhL29wZXJhL2kudGVzdChfdWEpKSxcblx0XHRcdG1vemlsbGE6IC9maXJlZm94L2kudGVzdChfdWEpLFxuXHRcdFx0Y2hyb21lOiAvY2hyb21lL2kudGVzdChfdWEpLFxuXHRcdFx0c2FmYXJpOiAoISgvY2hyb21lL2kudGVzdChfdWEpKSAmJiAvd2Via2l0fHNhZmFyaXxraHRtbC9pLnRlc3QoX3VhKSksXG5cdFx0XHRpcGhvbmU6IC9pcGhvbmUvaS50ZXN0KF91YSksXG5cdFx0XHRpcGhvbmU0OiAvaXBob25lLipPUyA0L2kudGVzdChfdWEpLFxuXHRcdFx0aXBvZDQ6IC9pcG9kLipPUyA0L2kudGVzdChfdWEpLFxuXHRcdFx0aXBhZDogL2lwYWQvaS50ZXN0KF91YSksXG5cdFx0XHRhbmRyb2lkOiAvYW5kcm9pZC9pLnRlc3QoX3VhKSxcblx0XHRcdG1vYmlsZTogL2lwaG9uZXxpcG9kfGlwYWR8b3BlcmEgbWluaXxvcGVyYSBtb2JpfGllbW9iaWxlfGFuZHJvaWQvaS50ZXN0KF91YSksXG5cdFx0XHRtc2llX21vYmlsZTogL2llbW9iaWxlL2kudGVzdChfdWEpLFxuXHRcdFx0c2FmYXJpX21vYmlsZTogL2lwaG9uZXxpcG9kfGlwYWQvaS50ZXN0KF91YSksXG5cdFx0XHRvcGVyYV9tb2JpbGU6IC9vcGVyYSBtaW5pfG9wZXJhIG1vYmkvaS50ZXN0KF91YSksXG5cdFx0XHRvcGVyYV9taW5pOiAvb3BlcmEgbWluaS9pLnRlc3QoX3VhKVxuXHRcdH0sXG5cdFx0X3N1cHBvcnQgPSAoZnVuY3Rpb24od2luZG93KSB7XG4gICAgICAgICAgICB2YXIgc3VwcG9ydCA9IHt9O1xuXG4gICAgICAgICAgICAvLyBXaGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIHVwbG9hZGluZyBmaWxlcyB3aXRoIFhNTEh0dHBSZXF1ZXN0XG4gICAgICAgICAgICBzdXBwb3J0LnhoclVwbG9hZCA9ICEhd2luZG93LkZvcm1EYXRhICYmICEhd2luZG93LlhNTEh0dHBSZXF1ZXN0ICYmICd1cGxvYWQnIGluIG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgICAgICAvLyBXaGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIHNlbGVjdGluZyBtdWx0aXBsZSBmaWxlcyBhdCBvbmNlXG4gICAgICAgICAgICBzdXBwb3J0LnNlbGVjdE11bHRpcGxlID0gISF3aW5kb3cuRmlsZUxpc3QgJiYgJ211bHRpcGxlJyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXG4gICAgICAgICAgICAvLyBXaGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIGRyb3BwaW5nIGZpbGVzIHRvIHRoZSBkcm9wIHpvbmVcbiAgICAgICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIHN1cHBvcnQuZHJvcEZpbGVzID0gICdvbmRyYWdzdGFydCcgaW4gZGl2ICYmICdvbmRyb3AnIGluIGRpdiAmJiAhIXdpbmRvdy5GaWxlTGlzdDtcblxuICAgICAgICAgICAgcmV0dXJuIHN1cHBvcnQ7XG4gICAgICAgIH0od2luZG93KSk7XG5cdFxuXHQvKipcblx0ICogVGVtcCBzdG9yZSBvYmplY3Rcblx0ICovXG5cdHZhciBzdG9yZSA9IHtcblx0XHRfc3RvcmU6IFtdLFxuXHRcdGdldDogZnVuY3Rpb24oaWQpe1xuXHRcdFx0cmV0dXJuIHRoaXMuX3N0b3JlLmZpbHRlcihmdW5jdGlvbihlbCl7XG5cdFx0XHRcdHJldHVybiBlbC5pZCA9PT0gaWQ7XG5cdFx0XHR9KVswXTtcblx0XHR9LFxuXHRcdHNldDogZnVuY3Rpb24oY29tcG9uZW50KSB7XG5cdFx0XHR0aGlzLl9zdG9yZS5wdXNoKGNvbXBvbmVudCk7XG5cdFx0fSxcblx0XHRyZW1vdmU6IGZ1bmN0aW9uKGlkKSB7XG5cdFx0XHRcblx0XHR9LFxuXHRcdGdldEFsbDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiB0aGlzLl9zdG9yZTtcblx0XHR9XG5cdH07XG5cdFxuXHRcblx0LyoqXG5cdCAqIENyZWF0ZSBYSFIgY2xhc3Ncblx0ICpcblx0ICogQHBhcmFtIG9wdGlvbnNcblx0ICovXG5cdHZhciBYSFIgPSBmdW5jdGlvbigpIHt9O1xuXHRcdFxuXHRcblx0LyoqXG5cdCAqIENyZWF0ZSBVcGxvYWRlciBjbGFzc1xuXHQgKlxuXHQgKiBAcGFyYW0gb3B0aW9uc1xuXHQgKi9cblx0dmFyIEdVID0gd2luZG93LkdVID0gZnVuY3Rpb24gKGlucHV0LCBpZCkge1xuXHRcdHRoaXMub3B0aW9ucyA9IHN0b3JlLmdldChpZCk7XG5cdFx0dGhpcy4kZmlsZSA9IGlucHV0LmZpbmQoJ2lucHV0W3R5cGU9ZmlsZV0nKTtcblx0XHRcblx0XHR0aGlzLiRmaWxlLmF0dHIoe1xuICAgICAgICAgICAgaWQ6IGlkLCAgICAgICAgIFxuICAgICAgICAgICAgZGlzYWJsZWQ6IHRoaXMub3B0aW9ucy5kaXNhYmxlZFxuICAgICAgICB9KTtcblx0XHQvLyAhP1xuXHRcdGlmKF9zdXBwb3J0LnNlbGVjdE11bHRpcGxlKSB7XG5cdFx0XHR0aGlzLiRmaWxlLmF0dHIoJ211bHRpcGxlJywgdGhpcy5vcHRpb25zLm11bHRpcGxlKTtcblx0XHR9XG5cdFx0XG5cdFx0Ly8gZGVmaW5lIHF1ZXVlIHByb3BzXG5cdFx0dGhpcy5jb3VudGVyID0gLTE7XG5cdFx0dGhpcy5maWxlQXJyID0gW107XG5cdFx0dGhpcy5wcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFxuXHRcdC8vIHNldCBldmVudCBoYW5kbGVyXG5cdFx0dGhpcy4kZmlsZS5vbignY2hhbmdlLmdmdScsICQucHJveHkodGhpcy5hZGRGaWxlcywgdGhpcykpO1xuXHR9O1xuXHRcblx0LyoqXG5cdCAqIERlZmluZSB0aGUgc3RhdGljIHByb3BlcnRpZXMgb2YgVXBsb2FkZXJcblx0ICovXG5cdCQuZXh0ZW5kKEdVLCB7XG5cdFx0LyoqXG5cdFx0ICogRGVmYXVsdCB2YWx1ZXNcblx0XHQgKi9cblx0XHRkZWZhdWx0czoge1xuXHRcdFx0Ly8gaWQgb2YgY29tcG9uZW50XG5cdFx0XHRpZDogbnVsbCxcblx0XHRcdC8vIE5hbWUgb2YgdGhlIGZpbGUgaW5wdXRcblx0XHRcdG5hbWU6ICdmaWxlcycsXG5cdFx0XHRcblx0XHRcdC8vIERlZmF1bHQgbGFiZWwgdGV4dFxuXHRcdFx0dGV4dDogJ9CX0LDQs9GA0YPQt9C40YLRjCDRhNCw0LnQuycsXG5cblx0XHRcdC8vIFdoZXRoZXIgc2VsZWN0aW5nIG11bHRpcGxlIGZpbGVzIGF0IG9uY2UgaW4gYWxsb3dlZFxuXHRcdFx0bXVsdGlwbGU6IHRydWUsXG5cblx0XHRcdC8vIERpc2FibGUgaW5wdXQgIGlmIHRoZSBudW1iZXIgb2YgZmlsZXMgaXMgdGhlIG1heGltdW0gbnVtYmVyIG9mIHVwbG9hZGVkIGZpbGVzIG9yIHJlcXVpcmVkIGJ5IHRoZSBsb2dpY1xuXHRcdFx0ZGlzYWJsZWQ6IGZhbHNlLFxuXG5cdFx0XHQvLyBUaGUgbWF4aW11bSBudW1iZXIgb2YgZmlsZXMgdGhlIHVzZXIgY2FuIHVwbG9hZCAoYnkgZGVmYXVsdCB0aGVyZSBpcyBubyBsaW1pdClcblx0XHRcdG1heEZpbGVzOiBudWxsLFxuXG5cdFx0XHQvLyBUaGUgbWF4aW11bSBzaXplIG9mIGZpbGVzIHRoZSB1c2VyIGNhbiB1cGxvYWQgKGJ5IGRlZmF1bHQgdGhlcmUgaXMgbm8gbGltaXQpXG5cdFx0XHRtYXhTaXplOiBudWxsLFxuXG5cdFx0XHQvLyBXaGV0aGVyIHRvIGF1dG9tYXRpY2FsbHkgdXBsb2FkIGZpbGVzIGFmdGVyIHRoZXkgd2VyZSBzZWxlY3RlZFxuXHRcdFx0YXV0b1N0YXJ0OiB0cnVlLFxuXG5cdFx0XHQvLyBSZXF1aXJlZCBmaWVsZCBpbiB0aGUgZm9ybSAoYnkgZGVmYXVsdCByZXF1aXJlZClcblx0XHRcdHJlcXVpcmVkOiB0cnVlLFxuXG5cdFx0XHQvLyBBcnJheSBvZiB0aGUgYWNjZXB0ZWQgZmlsZSB0eXBlcywgZXguIFsnYXBwbGljYXRpb24veC1jZC1pbWFnZSddIChieSBkZWZhdWx0IGFsbCB0eXBlcyBhcmUgYWNjZXB0ZWQpXG5cdFx0XHRhY2NlcHRUeXBlOiBudWxsLFxuXG5cdFx0XHQvLyBBcnJheSBvZiB0aGUgYWNjZXB0ZWQgZmlsZSB0eXBlcywgZXguIFsnLmpwZycsICcuanBlZycsICcucG5nJ10gKGJ5IGRlZmF1bHQgYWxsIHR5cGVzIGFyZSBhY2NlcHRlZClcblx0XHRcdGFjY2VwdEV4dGVuc2lvbjogbnVsbCxcblxuXHRcdFx0Ly8gQWRkaXRpb25hbCBkYXRhIHRvIHNlbmQgd2l0aCB0aGUgZmlsZXNcblx0XHRcdGRhdGE6IHt9LFxuXG5cdFx0XHQvLyBBZGRpdGlvbmFsIGhlYWRlcnMgdG8gc2VuZCB3aXRoIHRoZSBmaWxlcyAob25seSBmb3IgYWpheCB1cGxvYWRzKVxuXHRcdFx0aGVhZGVyczoge30sXG5cblx0XHRcdC8vIFVwbG9hZCBzdWNjZXNzIGNhbGxiYWNrXG5cdFx0XHRzdWNjZXNzOiBmdW5jdGlvbigpe30sXG5cblx0XHRcdC8vIFVwbG9hZCBmYWlsIGNhbGxiYWNrXG5cdFx0XHRmYWlsOiBmdW5jdGlvbigpe30sXG5cblx0XHRcdC8vIFRoZSB1cmwgdG8gdXBsb2FkIHRoZSBmaWxlcyB0b1xuXHRcdFx0dXJsOiBkb2N1bWVudC5VUkwsXG5cblx0XHRcdC8vIFRoZSB1cmwgdG8gcmVtb3ZlIHRoZSBmaWxlc1xuXHRcdFx0cmVtb3ZlVXJsOiBudWxsLFxuXG5cdFx0XHQvLyBFbmFibGUgRURTIGZ1bmN0aW9uYWxcblx0XHRcdGVkczogZmFsc2UsXG5cblx0XHRcdC8vIEVycm9yIG1lc3NhZ2VzXG5cdFx0XHRlcnJvcnM6IHtcblx0XHRcdFx0bWF4RmlsZXM6ICfQn9GA0LXQstGL0YjQtdC90L3QviDQutC+0LvQu9C40YfQtdGB0LLQviDRhNCw0LnQu9C+0LIge3ttYXhGaWxlc319INCy0L7Qt9C80L7QttC90YvRhSDQtNC70Y8g0LfQsNCz0YDRg9C30LrQuCEnLFxuXHRcdFx0XHRtYXhTaXplOiAn0KDQsNC30LzQtdGAINGE0LDQudC70LAge3tmaWxlTmFtZX19INC/0YDQtdCy0YvRgdC40Lsg0LzQsNC60YHQuNC80LDQu9GM0L3Ri9C5INGA0LDQt9C80LXRgCB7e21heFNpemV9fSBNYicsXG5cdFx0XHRcdGludmFsaWRUeXBlOiAn0J3QtdCy0LXRgNC90YvQuSDRgtC40L8g0YTQsNC50LvQsCB7e2ZpbGVOYW1lfX0uINCU0LvRjyDQt9Cw0LPRgNGD0LfQutC4INGA0LDQt9GA0LXRiNC10L3Rizoge3tmaWxlVHlwZX19Jyxcblx0XHRcdFx0aW52YWxpZEV4dGVuc2lvbjogJ9Cd0LXQstC10YDQvdC+0LUg0YDQsNGB0YjQuNGA0LXQvdC40LUg0YTQsNC50LvQsCB7e2ZpbGVOYW1lfX0uINCg0LDQt9GA0LXRiNC10L3RiyDRgdC70LXQtNGD0Y7RidC40LU6IHt7ZmlsZUV4dGVuc2lvbn19J1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Ly8gZGVmYXVsdCB0ZW1wbGF0ZXNcblx0XHR0ZW1wbGF0ZXM6IHtcblx0XHRcdGlucHV0OiBbJzxkaXYgY2xhc3M9XCJnZnUtd3JhcFwiPicsXG5cdFx0XHRcdFx0XHQnPGxhYmVsIGZvcj1cInt7aWR9fVwiIGNsYXNzPVwiZmlsZS1sYWJlbFwiPjxzcGFuPnt7bGFiZWx9fTwvc3Bhbj48aW5wdXQgdHlwZT1cImZpbGVcIiBpZD1cInt7aWR9fVwiPjwvbGFiZWw+JyxcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JzwvZGl2Pidcblx0XHRcdFx0ICAgXS5qb2luKCcnKSxcblx0XHRcdFxuXHRcdFx0cHJvZ3Jlc3M6Wyc8ZGl2IGNsYXNzPVwiZ2Z1LXJvd1wiPjxkaXYgY2xhc3M9XCJnZnUtcm93LXByb2dyZXNzXCI+PC9kaXY+PC9kaXY+J10uam9pbignJyksXG5cdFx0XG5cdFx0XHR1cGxvYWQ6IFsnPGRpdiBjbGFzcz1cInVwbG9hZFwiPtCX0LDQs9GA0YPQttC10L0g0YTQsNC50LsgPC9kaXY+J10uam9pbignJylcblx0XHR9LFxuXHRcdC8vIGV4dGVuZCBjdXN0b20gb3B0aW9ucyBmcm9tIGNvbXBvbmVudFxuXHRcdGV4dGVuZDogZnVuY3Rpb24ob2JqKSB7XG5cdFx0XHRzdG9yZS5zZXQoJC5leHRlbmQoe30sIEdVLmRlZmF1bHRzLCBvYmopKTtcblx0XHR9XG5cdH0pO1xuXHRcblx0JC5leHRlbmQoR1UucHJvdG90eXBlLCB7XG5cdFx0LypcbiAgICAgICAgICogQWRkIGlucHV0IGZpbGVzIGluIHVwbG9hZCBxdWV1ZVxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWV0aG9kIGFkZEZpbGVzXG4gICAgICAgICAqL1xuXHRcdGFkZEZpbGVzOiBmdW5jdGlvbihlKSB7XG5cdFx0XHQvLyBUT0RPINGD0LTQsNC70LXQvdC40LUg0LjQtyDQvtGH0LXRgNC10LTQuCDQv9GA0Lgg0YHQsdGA0L7RgdC1XG5cdFx0XHRpZihlLnRhcmdldC52YWx1ZSA9PT0gJycpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR0cnkge1xuXHRcdFx0XHR0aGlzLnZhbGlkYXRlKGUudGFyZ2V0LmZpbGVzKTtcblx0XHRcdH1cblx0XHRcdGNhdGNoKGVycil7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XG5cdFx0XHRcdGUudGFyZ2V0LnZhbHVlID0gbnVsbDtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gYWRkIGZpbGVzIGluIHF1ZXVlXG5cdFx0XHRcblx0XHRcdGlmKHRoaXMub3B0aW9ucy5hdXRvU3RhcnQpIHtcblx0XHRcdFx0Ly8g0L7RgtC/0YDQsNCy0LvRj9C10Lwg0YTQsNC50LvRi1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0LypcbiAgICAgICAgICogVmFsaWRhdGUgZmlsZXNcbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCB2YWxpZGF0ZVxuXHRcdCAqIEBwYXJhbSBmaWxlcyBmaWxlIG9iamVjdCBmcm9tIGlucHV0XG4gICAgICAgICAqL1xuXHRcdHZhbGlkYXRlOiBmdW5jdGlvbihmaWxlcykge1xuXHRcdFx0dmFyIGZMZW5ndGggPSBmaWxlcy5sZW5ndGgsXG5cdFx0XHRcdG8gPSB0aGlzLm9wdGlvbnM7XG5cdFx0XHRcdFxuXHRcdFx0aWYoby5tYXhGaWxlcyAhPT0gbnVsbCAmJiAoby5tYXhGaWxlcyA8IGZMZW5ndGggfHwgby5tYXhGaWxlcyA9PSB0aGlzLmZpbGVBcnIubGVuZ3RoKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoX2gudGVtcGxhdGUoby5lcnJvcnMubWF4RmlsZXMsIG8ubWF4RmlsZXMpKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0W10uZm9yRWFjaC5jYWxsKGZpbGVzLCBmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRcdC8vIHZhbGlkYXRlIHNpemVcblx0XHRcdFx0aWYoby5tYXhTaXplICE9PSBudWxsICYmICgoZmlsZS5zaXplIC8gMTAyNCkgLyAxMDI0ID4gby5tYXhTaXplKSkgeyBcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoX2gudGVtcGxhdGUoby5lcnJvcnMubWF4U2l6ZSwge2ZpbGVOYW1lOiBmaWxlLm5hbWUsIG1heFNpemU6IG8ubWF4U2l6ZS50b1N0cmluZygpfSkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyB2YWxpZGF0ZSB0eXBlXG5cdFx0XHRcdGlmKG8uYWNjZXB0RXh0ZW5zaW9uICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0dmFyIGV4dCA9IGZpbGUubmFtZS50b0xvY2FsZUxvd2VyQ2FzZSgpLnNwbGl0KCcuJylbMV07XG5cdFx0XHRcdFx0aWYoIX5vLmFjY2VwdEV4dGVuc2lvbi5pbmRleE9mKGV4dCkpIHtcblx0XHRcdFx0XHRcdHZhciBlcnIgPSBfaC50ZW1wbGF0ZShvLmVycm9ycy5pbnZhbGlkRXh0ZW5zaW9uLCB7XG5cdFx0XHRcdFx0XHRcdGZpbGVOYW1lOiBmaWxlLm5hbWUsIFxuXHRcdFx0XHRcdFx0XHRmaWxlRXh0ZW5zaW9uOiBvLmFjY2VwdEV4dGVuc2lvbi5qb2luKCcsICcpXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGVycik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyB2YWxpZGF0ZSB0eXBlXG5cdFx0XHRcdGlmKG8uYWNjZXB0VHlwZSAhPT0gbnVsbCAmJiAhfm8uYWNjZXB0VHlwZS5pbmRleE9mKGZpbGUudHlwZSkpIHtcblx0XHRcdFx0XHR2YXIgZXJyID0gX2gudGVtcGxhdGUoby5lcnJvcnMuaW52YWxpZFR5cGUsIHtcblx0XHRcdFx0XHRcdFx0ZmlsZU5hbWU6IGZpbGUubmFtZSwgXG5cdFx0XHRcdFx0XHRcdGZpbGVUeXBlOiBvLmFjY2VwdFR5cGUuam9pbignLCAnKVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcblx0fSk7XG5cdFxuXHRcblx0JChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcblx0XHR2YXIgY29tcG9uZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2dlbmEtdXBsb2FkJyk7XG5cdFx0XG5cdFx0W10uZm9yRWFjaC5jYWxsKGNvbXBvbmVudHMsIGZ1bmN0aW9uKGNvbXBvbmVudCkge1xuXHRcdFx0dmFyIGlucHV0ID0gJChfaC50ZW1wbGF0ZShHVS50ZW1wbGF0ZXMuaW5wdXQsIGNvbXBvbmVudC5pZCkpO1xuXHRcdFx0XG5cdFx0XHQkKGNvbXBvbmVudCkucmVwbGFjZVdpdGgoaW5wdXQpO1xuXHRcdFx0aWYgKCEkLmRhdGEoaW5wdXQsICdnZW5hVXBsb2FkZXInKSkge1xuICAgICAgICAgICAgICAgICQuZGF0YShpbnB1dCwgJ2dlbmFVcGxvYWRlcicsIG5ldyBHVShpbnB1dCwgY29tcG9uZW50LmlkKSlcbiAgICAgICAgICAgIH1cblx0XHR9KVxuXHR9KTtcblx0XG59KGRvY3VtZW50LCB3aW5kb3csIGpRdWVyeSkpOyJdfQ==
