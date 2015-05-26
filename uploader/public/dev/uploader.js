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