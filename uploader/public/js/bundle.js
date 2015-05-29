(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/media/5b8c33bd-b0bc-468a-b4a8-bde993bcb4bf/www/uploader/public/dev/uploader.js":[function(require,module,exports){
/**
 * Прокладка для "исправления" отсутствия поддержки в IE < 9 применения slice
 * к хост-объектам вроде NamedNodeMap, NodeList и HTMLCollection
 * (технически, поскольку хост-объекты зависят от реализации,
 * по крайней мере, до ES6, IE не обязан так работать).
 * Также работает для строк, исправляет поведение IE < 9, позволяя явно указывать undefined
 * вторым аргументом (как в Firefox), и предотвращает ошибки, возникающие при
 * вызове на других объектах DOM.
 */
(function () {
  'use strict';
  var _slice = Array.prototype.slice;

  try {
    // Не может использоваться с элементами DOM в IE < 9
    _slice.call(document.documentElement);
  } catch (e) { // В IE < 9 кидается исключение
    // Функция будет работать для истинных массивов, массивоподобных объектов,
    // NamedNodeMap (атрибуты, сущности, примечания),
    // NodeList (например, getElementsByTagName), HTMLCollection (например, childNodes)
    // и не будет падать на других объектах DOM (как это происходит на элементах DOM в IE < 9)
    Array.prototype.slice = function(begin, end) {
      // IE < 9 будет недоволен аргументом end, равным undefined
      end = (typeof end !== 'undefined') ? end : this.length;

      // Для родных объектов Array мы используем родную функцию slice
      if (Object.prototype.toString.call(this) === '[object Array]') {
        return _slice.call(this, begin, end); 
      }

      // Массивоподобные объекты мы обрабатываем самостоятельно
      var i, cloned = [],
          size, len = this.length;

      // Обрабатываем отрицательное значение begin
      var start = begin || 0;
      start = (start >= 0) ? start: len + start;

      // Обрабатываем отрицательное значение end
      var upTo = (end) ? end : len;
      if (end < 0) {
        upTo = len + end;
      }

      // Фактически ожидаемый размер среза
      size = upTo - start;

      if (size > 0) {
        cloned = new Array(size);
        if (this.charAt) {
          for (i = 0; i < size; i++) {
            cloned[i] = this.charAt(start + i);
          }
        } else {
          for (i = 0; i < size; i++) {
            cloned[i] = this[start + i];
          }
        }
      }

      return cloned;
    };
  }
}());
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
		get: function (id) {
			return this._store[id];
		},
		set: function (id, component) {
			this._store[id] = component;
		}
	};
	
	
	/**
	 * Create XHR class
	 *
	 * @param options
	 */
	var XHR = function() {
		this.filesQueue = [];
		return this;
	};
		
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
		
		getIframe: function () {},
		
		createQueue: function(fileData) {
			this.filesQueue.push(fileData);	
		},
		
		send: function () {
			var self = this,
				xhr  = this.getXHR(),
				data = this.filesQueue.shift();
				
			if(!data) {
				xhr = null;
				return
			}
		
			xhr.upload.onprogress =  function (e) {
				 var percent = 0, 
					 position = e.loaded || e.position, 
					 total = e.total || e.totalFileSize;
				
				if (data.progress && e.lengthComputable) {
					percent = Math.ceil(position / total * 100);
                    //progress.animate({'width': percent + '%'}, 200);
					data.progress.text(percent + '%');
				}
			}
			
			xhr.onreadystatechange = function () {
				if(this.readyState == 4) {
					if(this.status == 200) {
						try {
							data.cb(JSON.parse(this.response), data.progress);
						} catch (e) {
							var res = {
								status: 'Ошибка обработки ответа',
								data: 'Ответ сервера: ['+this.responseText+']'
							}
						}
						
						self.send();
					} else {
						var res = {
							status: 'Ошибка ответа сервера',
							code: this.status,
							data: 'Ответ сервера: ['+this.responseText+']'
						}
					}
				}
			}
			
			xhr.open('POST', data.opt.url, true);
			
			// prepend and send data
			if (_support.xhrUpload) {
				var fd = new FormData();

				fd.append(data.opt.name, data.file);
				// send data
				xhr.send(fd);
			} else {
				xhr.send(data.file);
			}
		}
	});
	
	/**
	 * Create Uploader class
	 *
	 * @param options
	 */
	var GU = window.GU = function (row, id) {
		this.$row = row;
		this.$file = this.$row.find('input[type=file]');
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
		this.$row.find('.gfu-text').text(this.options.text);
		
		// define queue props
		this.fileArr = [];
		this.counter = 0;
		this.processCount = 0;
		
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
			
			// Place where put progress bar. Class .gfu-progress-box
			progressBox: false,

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
				maxFilesSelect: 'Можно выбрать еще {{fileCount}} файл/файлов',
				maxSize: 'Размер файла {{fileName}} превысил максимальный размер {{maxSize}} Mb',
				invalidType: 'Неверный тип файла {{fileName}}. Для загрузки разрешены: {{fileType}}',
				invalidExtension: 'Неверное расширение файла {{fileName}}. Разрешены следующие: {{fileExtension}}'
			}
		},
		// default templates
		templates: {
			input: ['<div class="gfu-wrap">','<label for="{{id}}" class="file-label"><span class="gfu-text"></span><input type="file" id="{{id}}"></label>','</div>'].join(''),
			
			progress: ['<div class="gfu-row-progress"><div class="gfu-progress-state"> прогресс</div></div>'].join(''),
		
			success: ['<div class="upload" data=gfu-id="{{id}}">Загружен файл </div>'].join('')
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
			
			var files = slice.apply(e.target.files);

			try {
				this.validate(files);
			} catch (err) {
				console.log(err);
				e.target.value = null;
				return;
			}
			
			this.fileArr = this.fileArr.concat(files);
		
			this.fileGoAway();
			e.target.value = null;
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
				fCount = this.counter + fLength;
			
			if(o.maxFiles !== null && o.maxFiles < fLength) {
				throw new Error(_h.template(o.errors.maxFiles, o.maxFiles));
			}
			
			if(o.maxFiles !== null && o.maxFiles < fCount) {
				var total = o.maxFiles - this.counter;
				var err = _h.template(o.errors.maxFilesSelect, {
					fileCount: total.toString()
				});
				
				throw new Error(err);
			}
			
			[].forEach.call(files, function(file) {
				// validate size
				if (o.maxSize !== null && ((file.size / 1024) / 1024 > o.maxSize)) {
					var err = _h.template(o.errors.maxSize, {
						fileName: file.name, 
						maxSize: o.maxSize.toString()
					});
					
					throw new Error(err);
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
				
				this.counter++;
			}.bind(this));
		},
		
		/*
         * Prepare and send files
         *
         * @method fileGoAway
         */
		fileGoAway: function () {
			var xhr = new XHR(), $progressBox, sendFile;
			
			// get place for append progress bar
			$progressBox = this.getProgressPlace();
			
			while(sendFile = this.fileArr.shift()) {
				xhr.createQueue(
					{
						file: sendFile, 
						opt: this.options, 
						progress: $(GU.templates.progress).appendTo($progressBox), 
						cb: this.fileUpload.bind(this)
					}
				);
				
				this.processCount++;
			}
			
			if (this.options.autoStart) {
				this.$file.prop('disabled', true);
				xhr.send();
			} else {
				var $button = $(document.body).find('[data-gfu-btn='+this.options.id+']');
				
				if($button.length) {
					$button.on('click.gfu.send', function(e) {
						if(e) e.preventDefault();
						
						this.$file.prop('disabled', true);
						xhr.send();
					}.bind(this));
				}
			}
		},
		/*
         * Prepare and send files
         *
         * @method getProgressPlace
		 * @return DOM object
         */
		getProgressPlace: function() {
			if (this.options.progressBox) return $(document).find('.gfu-progress-box');
				
			var $progressBox = this.$row.find('.gfu-progress');
			return ($progressBox.length) ? $progressBox	: this.$row;
		},
		
		fileUpload: function(res, progressBar) {
			progressBar.replaceWith(GU.templates.success);

			if(!!--this.processCount) return;

			if (this.options.maxFiles === null || this.counter < this.options.maxFiles) {
				this.$file.prop('disabled', false);
			}
			
			
			// Calback все файлы загружены
			
		}
	});
	
	
	$(document).ready(function () {
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
	});
	
})(document, window, jQuery);

},{}]},{},["/media/5b8c33bd-b0bc-468a-b4a8-bde993bcb4bf/www/uploader/public/dev/uploader.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL21lZGlhLzViOGMzM2JkLWIwYmMtNDY4YS1iNGE4LWJkZTk5M2JjYjRiZi93d3cvdXBsb2FkZXIvcHVibGljL2Rldi91cGxvYWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICog0J/RgNC+0LrQu9Cw0LTQutCwINC00LvRjyBcItC40YHQv9GA0LDQstC70LXQvdC40Y9cIiDQvtGC0YHRg9GC0YHRgtCy0LjRjyDQv9C+0LTQtNC10YDQttC60Lgg0LIgSUUgPCA5INC/0YDQuNC80LXQvdC10L3QuNGPIHNsaWNlXG4gKiDQuiDRhdC+0YHRgi3QvtCx0YrQtdC60YLQsNC8INCy0YDQvtC00LUgTmFtZWROb2RlTWFwLCBOb2RlTGlzdCDQuCBIVE1MQ29sbGVjdGlvblxuICogKNGC0LXRhdC90LjRh9C10YHQutC4LCDQv9C+0YHQutC+0LvRjNC60YMg0YXQvtGB0YIt0L7QsdGK0LXQutGC0Ysg0LfQsNCy0LjRgdGP0YIg0L7RgiDRgNC10LDQu9C40LfQsNGG0LjQuCxcbiAqINC/0L4g0LrRgNCw0LnQvdC10Lkg0LzQtdGA0LUsINC00L4gRVM2LCBJRSDQvdC1INC+0LHRj9C30LDQvSDRgtCw0Log0YDQsNCx0L7RgtCw0YLRjCkuXG4gKiDQotCw0LrQttC1INGA0LDQsdC+0YLQsNC10YIg0LTQu9GPINGB0YLRgNC+0LosINC40YHQv9GA0LDQstC70Y/QtdGCINC/0L7QstC10LTQtdC90LjQtSBJRSA8IDksINC/0L7Qt9Cy0L7Qu9GP0Y8g0Y/QstC90L4g0YPQutCw0LfRi9Cy0LDRgtGMIHVuZGVmaW5lZFxuICog0LLRgtC+0YDRi9C8INCw0YDQs9GD0LzQtdC90YLQvtC8ICjQutCw0Log0LIgRmlyZWZveCksINC4INC/0YDQtdC00L7RgtCy0YDQsNGJ0LDQtdGCINC+0YjQuNCx0LrQuCwg0LLQvtC30L3QuNC60LDRjtGJ0LjQtSDQv9GA0LhcbiAqINCy0YvQt9C+0LLQtSDQvdCwINC00YDRg9Cz0LjRhSDQvtCx0YrQtdC60YLQsNGFIERPTS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICB2YXIgX3NsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuXG4gIHRyeSB7XG4gICAgLy8g0J3QtSDQvNC+0LbQtdGCINC40YHQv9C+0LvRjNC30L7QstCw0YLRjNGB0Y8g0YEg0Y3Qu9C10LzQtdC90YLQsNC80LggRE9NINCyIElFIDwgOVxuICAgIF9zbGljZS5jYWxsKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCk7XG4gIH0gY2F0Y2ggKGUpIHsgLy8g0JIgSUUgPCA5INC60LjQtNCw0LXRgtGB0Y8g0LjRgdC60LvRjtGH0LXQvdC40LVcbiAgICAvLyDQpNGD0L3QutGG0LjRjyDQsdGD0LTQtdGCINGA0LDQsdC+0YLQsNGC0Ywg0LTQu9GPINC40YHRgtC40L3QvdGL0YUg0LzQsNGB0YHQuNCy0L7Qsiwg0LzQsNGB0YHQuNCy0L7Qv9C+0LTQvtCx0L3Ri9GFINC+0LHRitC10LrRgtC+0LIsXG4gICAgLy8gTmFtZWROb2RlTWFwICjQsNGC0YDQuNCx0YPRgtGLLCDRgdGD0YnQvdC+0YHRgtC4LCDQv9GA0LjQvNC10YfQsNC90LjRjyksXG4gICAgLy8gTm9kZUxpc3QgKNC90LDQv9GA0LjQvNC10YAsIGdldEVsZW1lbnRzQnlUYWdOYW1lKSwgSFRNTENvbGxlY3Rpb24gKNC90LDQv9GA0LjQvNC10YAsIGNoaWxkTm9kZXMpXG4gICAgLy8g0Lgg0L3QtSDQsdGD0LTQtdGCINC/0LDQtNCw0YLRjCDQvdCwINC00YDRg9Cz0LjRhSDQvtCx0YrQtdC60YLQsNGFIERPTSAo0LrQsNC6INGN0YLQviDQv9GA0L7QuNGB0YXQvtC00LjRgiDQvdCwINGN0LvQtdC80LXQvdGC0LDRhSBET00g0LIgSUUgPCA5KVxuICAgIEFycmF5LnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uKGJlZ2luLCBlbmQpIHtcbiAgICAgIC8vIElFIDwgOSDQsdGD0LTQtdGCINC90LXQtNC+0LLQvtC70LXQvSDQsNGA0LPRg9C80LXQvdGC0L7QvCBlbmQsINGA0LDQstC90YvQvCB1bmRlZmluZWRcbiAgICAgIGVuZCA9ICh0eXBlb2YgZW5kICE9PSAndW5kZWZpbmVkJykgPyBlbmQgOiB0aGlzLmxlbmd0aDtcblxuICAgICAgLy8g0JTQu9GPINGA0L7QtNC90YvRhSDQvtCx0YrQtdC60YLQvtCyIEFycmF5INC80Ysg0LjRgdC/0L7Qu9GM0LfRg9C10Lwg0YDQvtC00L3Rg9GOINGE0YPQvdC60YbQuNGOIHNsaWNlXG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHRoaXMpID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgIHJldHVybiBfc2xpY2UuY2FsbCh0aGlzLCBiZWdpbiwgZW5kKTsgXG4gICAgICB9XG5cbiAgICAgIC8vINCc0LDRgdGB0LjQstC+0L/QvtC00L7QsdC90YvQtSDQvtCx0YrQtdC60YLRiyDQvNGLINC+0LHRgNCw0LHQsNGC0YvQstCw0LXQvCDRgdCw0LzQvtGB0YLQvtGP0YLQtdC70YzQvdC+XG4gICAgICB2YXIgaSwgY2xvbmVkID0gW10sXG4gICAgICAgICAgc2l6ZSwgbGVuID0gdGhpcy5sZW5ndGg7XG5cbiAgICAgIC8vINCe0LHRgNCw0LHQsNGC0YvQstCw0LXQvCDQvtGC0YDQuNGG0LDRgtC10LvRjNC90L7QtSDQt9C90LDRh9C10L3QuNC1IGJlZ2luXG4gICAgICB2YXIgc3RhcnQgPSBiZWdpbiB8fCAwO1xuICAgICAgc3RhcnQgPSAoc3RhcnQgPj0gMCkgPyBzdGFydDogbGVuICsgc3RhcnQ7XG5cbiAgICAgIC8vINCe0LHRgNCw0LHQsNGC0YvQstCw0LXQvCDQvtGC0YDQuNGG0LDRgtC10LvRjNC90L7QtSDQt9C90LDRh9C10L3QuNC1IGVuZFxuICAgICAgdmFyIHVwVG8gPSAoZW5kKSA/IGVuZCA6IGxlbjtcbiAgICAgIGlmIChlbmQgPCAwKSB7XG4gICAgICAgIHVwVG8gPSBsZW4gKyBlbmQ7XG4gICAgICB9XG5cbiAgICAgIC8vINCk0LDQutGC0LjRh9C10YHQutC4INC+0LbQuNC00LDQtdC80YvQuSDRgNCw0LfQvNC10YAg0YHRgNC10LfQsFxuICAgICAgc2l6ZSA9IHVwVG8gLSBzdGFydDtcblxuICAgICAgaWYgKHNpemUgPiAwKSB7XG4gICAgICAgIGNsb25lZCA9IG5ldyBBcnJheShzaXplKTtcbiAgICAgICAgaWYgKHRoaXMuY2hhckF0KSB7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgY2xvbmVkW2ldID0gdGhpcy5jaGFyQXQoc3RhcnQgKyBpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgY2xvbmVkW2ldID0gdGhpc1tzdGFydCArIGldO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2xvbmVkO1xuICAgIH07XG4gIH1cbn0oKSk7XG4oZnVuY3Rpb24gKGRvY3VtZW50LCB3aW5kb3csICQpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBzbGljZSAgICA9IEFycmF5LnByb3RvdHlwZS5zbGljZSxcblx0XHRzcGxpY2UgICA9IEFycmF5LnByb3RvdHlwZS5zcGxpY2UsXG5cdFx0dG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuXHRcdGdldEtleXMgID0gT2JqZWN0LmtleXMsXG5cdFx0aGFzT3duICAgPSBPYmplY3QuaGFzT3duUHJvcGVydHk7XG5cblx0Ly8gSGVscGVyc1xuXHR2YXIgX2ggPSB7XG5cdFx0bm9vcDogZnVuY3Rpb24gKCkge30sXG5cdFx0aXNVbmRlZmluZWQ6IGZ1bmN0aW9uIChhcmcpIHtyZXR1cm4gYXJnID09PSB2b2lkIDA7IH0sXG5cdFx0aXNGdW5jdGlvbjogZnVuY3Rpb24gKHgpIHtyZXR1cm4gdG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJzsgfSxcblx0XHRpc09iamVjdDogZnVuY3Rpb24gKHgpIHtyZXR1cm4gdHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGw7IH0sXG5cdFx0aXNBcnJheTogZnVuY3Rpb24gKHgpIHtyZXR1cm4gdG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJyYXldJzsgfSxcblx0XHRvSGFzOiBmdW5jdGlvbiAob2JqLCBrZXkpIHtyZXR1cm4gb2JqICE9PSBudWxsICYmIGhhc093bi5jYWxsKG9iaiwga2V5KTsgfVxuXHR9O1xuXHRcblx0X2gudGVtcGxhdGUgPSBmdW5jdGlvbiAodGVtcGxhdGUsIGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlLnJlcGxhY2UoL1xce3soW1xcd1xcLl0qKVxcfX0vZywgZnVuY3Rpb24gKHN0ciwga2V5KSB7XG4gICAgICAgICAgICB2YXIga2V5cyA9IGtleS5zcGxpdChcIi5cIiksIHZhbHVlID0gZGF0YVtrZXlzLnNoaWZ0KCldIHx8IGRhdGE7XG4gICAgICAgICAgICAkLmVhY2goa2V5cywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWVbdGhpc107XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkgPyBcIlwiIDogKCQuaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZS5qb2luKCcnKSA6IHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblx0XG5cdC8vIERldGVjdCBicm93c2VyXG5cdHZhciBfdWEgPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCksXG5cdFx0X2lzID0ge1xuXHRcdFx0dmVyc2lvbjogKF91YS5tYXRjaCggLy4rKD86bWV8b3h8b258cnZ8aXR8ZXJhfG9wcnxpZSlbXFwvOiBdKFtcXGQuXSspLyApIHx8IFswLCcwJ10pWzFdLFxuXHRcdFx0b3BlcmE6ICgvb3BlcmEvaS50ZXN0KF91YSkgfHwgL29wci9pLnRlc3QoX3VhKSksXG5cdFx0XHRtc2llOiAoL21zaWUvaS50ZXN0KF91YSkgJiYgIS9vcGVyYS9pLnRlc3QoX3VhKSB8fCAvdHJpZGVudFxcLy9pLnRlc3QoX3VhKSksXG5cdFx0XHRtc2llODogKC9tc2llIDgvaS50ZXN0KF91YSkgJiYgIS9vcGVyYS9pLnRlc3QoX3VhKSksXG5cdFx0XHRtc2llOTogKC9tc2llIDkvaS50ZXN0KF91YSkgJiYgIS9vcGVyYS9pLnRlc3QoX3VhKSksXG5cdFx0XHRtb3ppbGxhOiAvZmlyZWZveC9pLnRlc3QoX3VhKSxcblx0XHRcdGNocm9tZTogL2Nocm9tZS9pLnRlc3QoX3VhKSxcblx0XHRcdHNhZmFyaTogKCEoL2Nocm9tZS9pLnRlc3QoX3VhKSkgJiYgL3dlYmtpdHxzYWZhcml8a2h0bWwvaS50ZXN0KF91YSkpLFxuXHRcdFx0aXBob25lOiAvaXBob25lL2kudGVzdChfdWEpLFxuXHRcdFx0aXBob25lNDogL2lwaG9uZS4qT1MgNC9pLnRlc3QoX3VhKSxcblx0XHRcdGlwb2Q0OiAvaXBvZC4qT1MgNC9pLnRlc3QoX3VhKSxcblx0XHRcdGlwYWQ6IC9pcGFkL2kudGVzdChfdWEpLFxuXHRcdFx0YW5kcm9pZDogL2FuZHJvaWQvaS50ZXN0KF91YSksXG5cdFx0XHRtb2JpbGU6IC9pcGhvbmV8aXBvZHxpcGFkfG9wZXJhIG1pbml8b3BlcmEgbW9iaXxpZW1vYmlsZXxhbmRyb2lkL2kudGVzdChfdWEpLFxuXHRcdFx0bXNpZV9tb2JpbGU6IC9pZW1vYmlsZS9pLnRlc3QoX3VhKSxcblx0XHRcdHNhZmFyaV9tb2JpbGU6IC9pcGhvbmV8aXBvZHxpcGFkL2kudGVzdChfdWEpLFxuXHRcdFx0b3BlcmFfbW9iaWxlOiAvb3BlcmEgbWluaXxvcGVyYSBtb2JpL2kudGVzdChfdWEpLFxuXHRcdFx0b3BlcmFfbWluaTogL29wZXJhIG1pbmkvaS50ZXN0KF91YSlcblx0XHR9LFxuXHRcdF9zdXBwb3J0ID0gKGZ1bmN0aW9uICh3aW5kb3cpIHtcbiAgICAgICAgICAgIHZhciBzdXBwb3J0ID0ge307XG5cbiAgICAgICAgICAgIC8vIFdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgdXBsb2FkaW5nIGZpbGVzIHdpdGggWE1MSHR0cFJlcXVlc3RcbiAgICAgICAgICAgIHN1cHBvcnQueGhyVXBsb2FkID0gISF3aW5kb3cuRm9ybURhdGEgJiYgISF3aW5kb3cuWE1MSHR0cFJlcXVlc3QgJiYgJ3VwbG9hZCcgaW4gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgIC8vIFdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgc2VsZWN0aW5nIG11bHRpcGxlIGZpbGVzIGF0IG9uY2VcbiAgICAgICAgICAgIHN1cHBvcnQuc2VsZWN0TXVsdGlwbGUgPSAhIXdpbmRvdy5GaWxlTGlzdCAmJiAnbXVsdGlwbGUnIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cbiAgICAgICAgICAgIC8vIFdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgZHJvcHBpbmcgZmlsZXMgdG8gdGhlIGRyb3Agem9uZVxuICAgICAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgc3VwcG9ydC5kcm9wRmlsZXMgPSAgJ29uZHJhZ3N0YXJ0JyBpbiBkaXYgJiYgJ29uZHJvcCcgaW4gZGl2ICYmICEhd2luZG93LkZpbGVMaXN0O1xuXG4gICAgICAgICAgICByZXR1cm4gc3VwcG9ydDtcbiAgICAgICAgfSh3aW5kb3cpKTtcblx0XG5cdC8qKlxuXHQgKiBUZW1wIHN0b3JlIG9iamVjdFxuXHQgKi9cblx0dmFyIHN0b3JlID0ge1xuXHRcdF9zdG9yZTogW10sXG5cdFx0Z2V0OiBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHJldHVybiB0aGlzLl9zdG9yZVtpZF07XG5cdFx0fSxcblx0XHRzZXQ6IGZ1bmN0aW9uIChpZCwgY29tcG9uZW50KSB7XG5cdFx0XHR0aGlzLl9zdG9yZVtpZF0gPSBjb21wb25lbnQ7XG5cdFx0fVxuXHR9O1xuXHRcblx0XG5cdC8qKlxuXHQgKiBDcmVhdGUgWEhSIGNsYXNzXG5cdCAqXG5cdCAqIEBwYXJhbSBvcHRpb25zXG5cdCAqL1xuXHR2YXIgWEhSID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5maWxlc1F1ZXVlID0gW107XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cdFx0XG5cdCQuZXh0ZW5kKFhIUi5wcm90b3R5cGUsIHtcblx0XHRnZXRYSFI6IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChfc3VwcG9ydC54aHJVcGxvYWQpIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHRcdFx0fSBlbHNlIGlmICh3aW5kb3cuQWN0aXZlWE9iamVjdCkge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHJldHVybiBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRcblx0XHRnZXRJZnJhbWU6IGZ1bmN0aW9uICgpIHt9LFxuXHRcdFxuXHRcdGNyZWF0ZVF1ZXVlOiBmdW5jdGlvbihmaWxlRGF0YSkge1xuXHRcdFx0dGhpcy5maWxlc1F1ZXVlLnB1c2goZmlsZURhdGEpO1x0XG5cdFx0fSxcblx0XHRcblx0XHRzZW5kOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgc2VsZiA9IHRoaXMsXG5cdFx0XHRcdHhociAgPSB0aGlzLmdldFhIUigpLFxuXHRcdFx0XHRkYXRhID0gdGhpcy5maWxlc1F1ZXVlLnNoaWZ0KCk7XG5cdFx0XHRcdFxuXHRcdFx0aWYoIWRhdGEpIHtcblx0XHRcdFx0eGhyID0gbnVsbDtcblx0XHRcdFx0cmV0dXJuXG5cdFx0XHR9XG5cdFx0XG5cdFx0XHR4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSAgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0IHZhciBwZXJjZW50ID0gMCwgXG5cdFx0XHRcdFx0IHBvc2l0aW9uID0gZS5sb2FkZWQgfHwgZS5wb3NpdGlvbiwgXG5cdFx0XHRcdFx0IHRvdGFsID0gZS50b3RhbCB8fCBlLnRvdGFsRmlsZVNpemU7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAoZGF0YS5wcm9ncmVzcyAmJiBlLmxlbmd0aENvbXB1dGFibGUpIHtcblx0XHRcdFx0XHRwZXJjZW50ID0gTWF0aC5jZWlsKHBvc2l0aW9uIC8gdG90YWwgKiAxMDApO1xuICAgICAgICAgICAgICAgICAgICAvL3Byb2dyZXNzLmFuaW1hdGUoeyd3aWR0aCc6IHBlcmNlbnQgKyAnJSd9LCAyMDApO1xuXHRcdFx0XHRcdGRhdGEucHJvZ3Jlc3MudGV4dChwZXJjZW50ICsgJyUnKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRpZih0aGlzLnJlYWR5U3RhdGUgPT0gNCkge1xuXHRcdFx0XHRcdGlmKHRoaXMuc3RhdHVzID09IDIwMCkge1xuXHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0ZGF0YS5jYihKU09OLnBhcnNlKHRoaXMucmVzcG9uc2UpLCBkYXRhLnByb2dyZXNzKTtcblx0XHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdFx0dmFyIHJlcyA9IHtcblx0XHRcdFx0XHRcdFx0XHRzdGF0dXM6ICfQntGI0LjQsdC60LAg0L7QsdGA0LDQsdC+0YLQutC4INC+0YLQstC10YLQsCcsXG5cdFx0XHRcdFx0XHRcdFx0ZGF0YTogJ9Ce0YLQstC10YIg0YHQtdGA0LLQtdGA0LA6IFsnK3RoaXMucmVzcG9uc2VUZXh0KyddJ1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdHNlbGYuc2VuZCgpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR2YXIgcmVzID0ge1xuXHRcdFx0XHRcdFx0XHRzdGF0dXM6ICfQntGI0LjQsdC60LAg0L7RgtCy0LXRgtCwINGB0LXRgNCy0LXRgNCwJyxcblx0XHRcdFx0XHRcdFx0Y29kZTogdGhpcy5zdGF0dXMsXG5cdFx0XHRcdFx0XHRcdGRhdGE6ICfQntGC0LLQtdGCINGB0LXRgNCy0LXRgNCwOiBbJyt0aGlzLnJlc3BvbnNlVGV4dCsnXSdcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0eGhyLm9wZW4oJ1BPU1QnLCBkYXRhLm9wdC51cmwsIHRydWUpO1xuXHRcdFx0XG5cdFx0XHQvLyBwcmVwZW5kIGFuZCBzZW5kIGRhdGFcblx0XHRcdGlmIChfc3VwcG9ydC54aHJVcGxvYWQpIHtcblx0XHRcdFx0dmFyIGZkID0gbmV3IEZvcm1EYXRhKCk7XG5cblx0XHRcdFx0ZmQuYXBwZW5kKGRhdGEub3B0Lm5hbWUsIGRhdGEuZmlsZSk7XG5cdFx0XHRcdC8vIHNlbmQgZGF0YVxuXHRcdFx0XHR4aHIuc2VuZChmZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR4aHIuc2VuZChkYXRhLmZpbGUpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cdFxuXHQvKipcblx0ICogQ3JlYXRlIFVwbG9hZGVyIGNsYXNzXG5cdCAqXG5cdCAqIEBwYXJhbSBvcHRpb25zXG5cdCAqL1xuXHR2YXIgR1UgPSB3aW5kb3cuR1UgPSBmdW5jdGlvbiAocm93LCBpZCkge1xuXHRcdHRoaXMuJHJvdyA9IHJvdztcblx0XHR0aGlzLiRmaWxlID0gdGhpcy4kcm93LmZpbmQoJ2lucHV0W3R5cGU9ZmlsZV0nKTtcblx0XHR0aGlzLm9wdGlvbnMgPSBzdG9yZS5nZXQoaWQpO1xuXHRcdFxuXHRcdGlmICghdGhpcy5vcHRpb25zKSB7XG5cdFx0XHR0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgR1UuZGVmYXVsdHMpO1xuXHRcdFx0dGhpcy5vcHRpb25zLmlkID0gaWQ7XG5cdFx0fVxuXHRcdFxuXHRcdHRoaXMuJGZpbGUuYXR0cih7XG4gICAgICAgICAgICBpZDogdGhpcy5vcHRpb25zLmlkLCAgICAgICAgIFxuICAgICAgICAgICAgZGlzYWJsZWQ6IHRoaXMub3B0aW9ucy5kaXNhYmxlZCxcblx0XHRcdG5hbWU6IHRoaXMub3B0aW9ucy5uYW1lXG4gICAgICAgIH0pO1xuXHRcdC8vICE/XG5cdFx0aWYgKF9zdXBwb3J0LnNlbGVjdE11bHRpcGxlKSB7XG5cdFx0XHR0aGlzLiRmaWxlLmF0dHIoJ211bHRpcGxlJywgdGhpcy5vcHRpb25zLm11bHRpcGxlKTtcblx0XHR9XG5cdFx0XG5cdFx0Ly8gc2V0IGxhYmVsIHRleHRcblx0XHR0aGlzLiRyb3cuZmluZCgnLmdmdS10ZXh0JykudGV4dCh0aGlzLm9wdGlvbnMudGV4dCk7XG5cdFx0XG5cdFx0Ly8gZGVmaW5lIHF1ZXVlIHByb3BzXG5cdFx0dGhpcy5maWxlQXJyID0gW107XG5cdFx0dGhpcy5jb3VudGVyID0gMDtcblx0XHR0aGlzLnByb2Nlc3NDb3VudCA9IDA7XG5cdFx0XG5cdFx0Ly8gc2V0IGV2ZW50IGhhbmRsZXJcblx0XHR0aGlzLiRmaWxlLm9uKCdjaGFuZ2UuZ2Z1JywgJC5wcm94eSh0aGlzLmFkZEZpbGVzLCB0aGlzKSk7XG5cdH07XG5cdFxuXHQvKipcblx0ICogRGVmaW5lIHRoZSBzdGF0aWMgcHJvcGVydGllcyBvZiBVcGxvYWRlclxuXHQgKi9cblx0JC5leHRlbmQoR1UsIHtcblx0XHQvKipcblx0XHQgKiBEZWZhdWx0IHZhbHVlc1xuXHRcdCAqL1xuXHRcdGRlZmF1bHRzOiB7XG5cdFx0XHQvLyBpZCBvZiBjb21wb25lbnRcblx0XHRcdGlkOiBudWxsLFxuXHRcdFx0Ly8gTmFtZSBvZiB0aGUgZmlsZSBpbnB1dFxuXHRcdFx0bmFtZTogJ2ZpbGVzJyxcblx0XHRcdFxuXHRcdFx0Ly8gRGVmYXVsdCBsYWJlbCB0ZXh0XG5cdFx0XHR0ZXh0OiAn0JfQsNCz0YDRg9C30LjRgtGMINGE0LDQudC7JyxcblxuXHRcdFx0Ly8gV2hldGhlciBzZWxlY3RpbmcgbXVsdGlwbGUgZmlsZXMgYXQgb25jZSBpbiBhbGxvd2VkXG5cdFx0XHRtdWx0aXBsZTogdHJ1ZSxcblxuXHRcdFx0Ly8gRGlzYWJsZSBpbnB1dCAgaWYgdGhlIG51bWJlciBvZiBmaWxlcyBpcyB0aGUgbWF4aW11bSBudW1iZXIgb2YgdXBsb2FkZWQgZmlsZXMgb3IgcmVxdWlyZWQgYnkgdGhlIGxvZ2ljXG5cdFx0XHRkaXNhYmxlZDogZmFsc2UsXG5cblx0XHRcdC8vIFRoZSBtYXhpbXVtIG51bWJlciBvZiBmaWxlcyB0aGUgdXNlciBjYW4gdXBsb2FkIChieSBkZWZhdWx0IHRoZXJlIGlzIG5vIGxpbWl0KVxuXHRcdFx0bWF4RmlsZXM6IG51bGwsXG5cblx0XHRcdC8vIFRoZSBtYXhpbXVtIHNpemUgb2YgZmlsZXMgdGhlIHVzZXIgY2FuIHVwbG9hZCAoYnkgZGVmYXVsdCB0aGVyZSBpcyBubyBsaW1pdClcblx0XHRcdG1heFNpemU6IG51bGwsXG5cblx0XHRcdC8vIFdoZXRoZXIgdG8gYXV0b21hdGljYWxseSB1cGxvYWQgZmlsZXMgYWZ0ZXIgdGhleSB3ZXJlIHNlbGVjdGVkXG5cdFx0XHRhdXRvU3RhcnQ6IHRydWUsXG5cblx0XHRcdC8vIFJlcXVpcmVkIGZpZWxkIGluIHRoZSBmb3JtIChieSBkZWZhdWx0IHJlcXVpcmVkKVxuXHRcdFx0cmVxdWlyZWQ6IHRydWUsXG5cblx0XHRcdC8vIEFycmF5IG9mIHRoZSBhY2NlcHRlZCBmaWxlIHR5cGVzLCBleC4gWydhcHBsaWNhdGlvbi94LWNkLWltYWdlJ10gKGJ5IGRlZmF1bHQgYWxsIHR5cGVzIGFyZSBhY2NlcHRlZClcblx0XHRcdGFjY2VwdFR5cGU6IG51bGwsXG5cblx0XHRcdC8vIEFycmF5IG9mIHRoZSBhY2NlcHRlZCBmaWxlIHR5cGVzLCBleC4gWydqcGcnLCAnanBlZycsICdwbmcnXSAoYnkgZGVmYXVsdCBhbGwgdHlwZXMgYXJlIGFjY2VwdGVkKVxuXHRcdFx0YWNjZXB0RXh0ZW5zaW9uOiBudWxsLFxuXHRcdFx0XG5cdFx0XHQvLyBQbGFjZSB3aGVyZSBwdXQgcHJvZ3Jlc3MgYmFyLiBDbGFzcyAuZ2Z1LXByb2dyZXNzLWJveFxuXHRcdFx0cHJvZ3Jlc3NCb3g6IGZhbHNlLFxuXG5cdFx0XHQvLyBBZGRpdGlvbmFsIGRhdGEgdG8gc2VuZCB3aXRoIHRoZSBmaWxlc1xuXHRcdFx0ZGF0YToge30sXG5cblx0XHRcdC8vIEFkZGl0aW9uYWwgaGVhZGVycyB0byBzZW5kIHdpdGggdGhlIGZpbGVzIChvbmx5IGZvciBhamF4IHVwbG9hZHMpXG5cdFx0XHRoZWFkZXJzOiB7fSxcblxuXHRcdFx0Ly8gVXBsb2FkIHN1Y2Nlc3MgY2FsbGJhY2tcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHt9LFxuXG5cdFx0XHQvLyBVcGxvYWQgZmFpbCBjYWxsYmFja1xuXHRcdFx0ZmFpbDogZnVuY3Rpb24gKCkge30sXG5cblx0XHRcdC8vIFRoZSB1cmwgdG8gdXBsb2FkIHRoZSBmaWxlcyB0b1xuXHRcdFx0dXJsOiBkb2N1bWVudC5VUkwsXG5cblx0XHRcdC8vIFRoZSB1cmwgdG8gcmVtb3ZlIHRoZSBmaWxlc1xuXHRcdFx0cmVtb3ZlVXJsOiBudWxsLFxuXG5cdFx0XHQvLyBFbmFibGUgRURTIGZ1bmN0aW9uYWxcblx0XHRcdGVkczogZmFsc2UsXG5cblx0XHRcdC8vIEVycm9yIG1lc3NhZ2VzXG5cdFx0XHRlcnJvcnM6IHtcblx0XHRcdFx0bWF4RmlsZXM6ICfQn9GA0LXQstGL0YjQtdC90L3QviDQutC+0LvQu9C40YfQtdGB0LLQviDRhNCw0LnQu9C+0LIge3ttYXhGaWxlc319INCy0L7Qt9C80L7QttC90YvRhSDQtNC70Y8g0LfQsNCz0YDRg9C30LrQuCEnLFxuXHRcdFx0XHRtYXhGaWxlc1NlbGVjdDogJ9Cc0L7QttC90L4g0LLRi9Cx0YDQsNGC0Ywg0LXRidC1IHt7ZmlsZUNvdW50fX0g0YTQsNC50Lsv0YTQsNC50LvQvtCyJyxcblx0XHRcdFx0bWF4U2l6ZTogJ9Cg0LDQt9C80LXRgCDRhNCw0LnQu9CwIHt7ZmlsZU5hbWV9fSDQv9GA0LXQstGL0YHQuNC7INC80LDQutGB0LjQvNCw0LvRjNC90YvQuSDRgNCw0LfQvNC10YAge3ttYXhTaXplfX0gTWInLFxuXHRcdFx0XHRpbnZhbGlkVHlwZTogJ9Cd0LXQstC10YDQvdGL0Lkg0YLQuNC/INGE0LDQudC70LAge3tmaWxlTmFtZX19LiDQlNC70Y8g0LfQsNCz0YDRg9C30LrQuCDRgNCw0LfRgNC10YjQtdC90Ys6IHt7ZmlsZVR5cGV9fScsXG5cdFx0XHRcdGludmFsaWRFeHRlbnNpb246ICfQndC10LLQtdGA0L3QvtC1INGA0LDRgdGI0LjRgNC10L3QuNC1INGE0LDQudC70LAge3tmaWxlTmFtZX19LiDQoNCw0LfRgNC10YjQtdC90Ysg0YHQu9C10LTRg9GO0YnQuNC1OiB7e2ZpbGVFeHRlbnNpb259fSdcblx0XHRcdH1cblx0XHR9LFxuXHRcdC8vIGRlZmF1bHQgdGVtcGxhdGVzXG5cdFx0dGVtcGxhdGVzOiB7XG5cdFx0XHRpbnB1dDogWyc8ZGl2IGNsYXNzPVwiZ2Z1LXdyYXBcIj4nLCc8bGFiZWwgZm9yPVwie3tpZH19XCIgY2xhc3M9XCJmaWxlLWxhYmVsXCI+PHNwYW4gY2xhc3M9XCJnZnUtdGV4dFwiPjwvc3Bhbj48aW5wdXQgdHlwZT1cImZpbGVcIiBpZD1cInt7aWR9fVwiPjwvbGFiZWw+JywnPC9kaXY+J10uam9pbignJyksXG5cdFx0XHRcblx0XHRcdHByb2dyZXNzOiBbJzxkaXYgY2xhc3M9XCJnZnUtcm93LXByb2dyZXNzXCI+PGRpdiBjbGFzcz1cImdmdS1wcm9ncmVzcy1zdGF0ZVwiPiDQv9GA0L7Qs9GA0LXRgdGBPC9kaXY+PC9kaXY+J10uam9pbignJyksXG5cdFx0XG5cdFx0XHRzdWNjZXNzOiBbJzxkaXYgY2xhc3M9XCJ1cGxvYWRcIiBkYXRhPWdmdS1pZD1cInt7aWR9fVwiPtCX0LDQs9GA0YPQttC10L0g0YTQsNC50LsgPC9kaXY+J10uam9pbignJylcblx0XHR9LFxuXHRcdC8vIGV4dGVuZCBjdXN0b20gb3B0aW9ucyBmcm9tIGNvbXBvbmVudFxuXHRcdGV4dGVuZDogZnVuY3Rpb24ob2JqKSB7XG5cdFx0XHRzdG9yZS5zZXQob2JqLmlkLCAkLmV4dGVuZCh7fSwgR1UuZGVmYXVsdHMsIG9iaikpO1xuXHRcdH1cblx0fSk7XG5cdFxuXHQkLmV4dGVuZChHVS5wcm90b3R5cGUsIHtcblx0XHQvKlxuICAgICAgICAgKiBBZGQgaW5wdXQgZmlsZXMgaW4gdXBsb2FkIHF1ZXVlXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZXRob2QgYWRkRmlsZXNcbiAgICAgICAgICovXG5cdFx0YWRkRmlsZXM6IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHQvLyBUT0RPINGD0LTQsNC70LXQvdC40LUg0LjQtyDQvtGH0LXRgNC10LTQuCDQv9GA0Lgg0YHQsdGA0L7RgdC1XG5cdFx0XHRpZiAoZS50YXJnZXQudmFsdWUgPT09ICcnKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dmFyIGZpbGVzID0gc2xpY2UuYXBwbHkoZS50YXJnZXQuZmlsZXMpO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHR0aGlzLnZhbGlkYXRlKGZpbGVzKTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xuXHRcdFx0XHRlLnRhcmdldC52YWx1ZSA9IG51bGw7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dGhpcy5maWxlQXJyID0gdGhpcy5maWxlQXJyLmNvbmNhdChmaWxlcyk7XG5cdFx0XG5cdFx0XHR0aGlzLmZpbGVHb0F3YXkoKTtcblx0XHRcdGUudGFyZ2V0LnZhbHVlID0gbnVsbDtcblx0XHR9LFxuXHRcdC8qXG4gICAgICAgICAqIFZhbGlkYXRlIGZpbGVzXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZXRob2QgdmFsaWRhdGVcblx0XHQgKiBAcGFyYW0gZmlsZXMgZmlsZSBvYmplY3QgZnJvbSBpbnB1dFxuICAgICAgICAgKi9cblx0XHR2YWxpZGF0ZTogZnVuY3Rpb24oZmlsZXMpIHtcblx0XHRcdHZhciBmTGVuZ3RoID0gZmlsZXMubGVuZ3RoLFxuXHRcdFx0XHRvID0gdGhpcy5vcHRpb25zLFxuXHRcdFx0XHRmQ291bnQgPSB0aGlzLmNvdW50ZXIgKyBmTGVuZ3RoO1xuXHRcdFx0XG5cdFx0XHRpZihvLm1heEZpbGVzICE9PSBudWxsICYmIG8ubWF4RmlsZXMgPCBmTGVuZ3RoKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihfaC50ZW1wbGF0ZShvLmVycm9ycy5tYXhGaWxlcywgby5tYXhGaWxlcykpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpZihvLm1heEZpbGVzICE9PSBudWxsICYmIG8ubWF4RmlsZXMgPCBmQ291bnQpIHtcblx0XHRcdFx0dmFyIHRvdGFsID0gby5tYXhGaWxlcyAtIHRoaXMuY291bnRlcjtcblx0XHRcdFx0dmFyIGVyciA9IF9oLnRlbXBsYXRlKG8uZXJyb3JzLm1heEZpbGVzU2VsZWN0LCB7XG5cdFx0XHRcdFx0ZmlsZUNvdW50OiB0b3RhbC50b1N0cmluZygpXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGVycik7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdFtdLmZvckVhY2guY2FsbChmaWxlcywgZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0XHQvLyB2YWxpZGF0ZSBzaXplXG5cdFx0XHRcdGlmIChvLm1heFNpemUgIT09IG51bGwgJiYgKChmaWxlLnNpemUgLyAxMDI0KSAvIDEwMjQgPiBvLm1heFNpemUpKSB7XG5cdFx0XHRcdFx0dmFyIGVyciA9IF9oLnRlbXBsYXRlKG8uZXJyb3JzLm1heFNpemUsIHtcblx0XHRcdFx0XHRcdGZpbGVOYW1lOiBmaWxlLm5hbWUsIFxuXHRcdFx0XHRcdFx0bWF4U2l6ZTogby5tYXhTaXplLnRvU3RyaW5nKClcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0Ly8gdmFsaWRhdGUgdHlwZVxuXHRcdFx0XHRpZiAoby5hY2NlcHRFeHRlbnNpb24gIT09IG51bGwpIHtcblx0XHRcdFx0XHR2YXIgZXh0ID0gZmlsZS5uYW1lLnRvTG9jYWxlTG93ZXJDYXNlKCkuc3BsaXQoJy4nKVsxXTtcblx0XHRcdFx0XHRpZiAoIX5vLmFjY2VwdEV4dGVuc2lvbi5pbmRleE9mKGV4dCkpIHtcblx0XHRcdFx0XHRcdHZhciBlcnIgPSBfaC50ZW1wbGF0ZShvLmVycm9ycy5pbnZhbGlkRXh0ZW5zaW9uLCB7XG5cdFx0XHRcdFx0XHRcdGZpbGVOYW1lOiBmaWxlLm5hbWUsIFxuXHRcdFx0XHRcdFx0XHRmaWxlRXh0ZW5zaW9uOiBvLmFjY2VwdEV4dGVuc2lvbi5qb2luKCcsICcpXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGVycik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyB2YWxpZGF0ZSB0eXBlXG5cdFx0XHRcdGlmIChvLmFjY2VwdFR5cGUgIT09IG51bGwgJiYgIX5vLmFjY2VwdFR5cGUuaW5kZXhPZihmaWxlLnR5cGUpKSB7XG5cdFx0XHRcdFx0dmFyIGVyciA9IF9oLnRlbXBsYXRlKG8uZXJyb3JzLmludmFsaWRUeXBlLCB7XG5cdFx0XHRcdFx0XHRcdGZpbGVOYW1lOiBmaWxlLm5hbWUsIFxuXHRcdFx0XHRcdFx0XHRmaWxlVHlwZTogby5hY2NlcHRUeXBlLmpvaW4oJywgJylcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGVycik7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdHRoaXMuY291bnRlcisrO1xuXHRcdFx0fS5iaW5kKHRoaXMpKTtcblx0XHR9LFxuXHRcdFxuXHRcdC8qXG4gICAgICAgICAqIFByZXBhcmUgYW5kIHNlbmQgZmlsZXNcbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCBmaWxlR29Bd2F5XG4gICAgICAgICAqL1xuXHRcdGZpbGVHb0F3YXk6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciB4aHIgPSBuZXcgWEhSKCksICRwcm9ncmVzc0JveCwgc2VuZEZpbGU7XG5cdFx0XHRcblx0XHRcdC8vIGdldCBwbGFjZSBmb3IgYXBwZW5kIHByb2dyZXNzIGJhclxuXHRcdFx0JHByb2dyZXNzQm94ID0gdGhpcy5nZXRQcm9ncmVzc1BsYWNlKCk7XG5cdFx0XHRcblx0XHRcdHdoaWxlKHNlbmRGaWxlID0gdGhpcy5maWxlQXJyLnNoaWZ0KCkpIHtcblx0XHRcdFx0eGhyLmNyZWF0ZVF1ZXVlKFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGZpbGU6IHNlbmRGaWxlLCBcblx0XHRcdFx0XHRcdG9wdDogdGhpcy5vcHRpb25zLCBcblx0XHRcdFx0XHRcdHByb2dyZXNzOiAkKEdVLnRlbXBsYXRlcy5wcm9ncmVzcykuYXBwZW5kVG8oJHByb2dyZXNzQm94KSwgXG5cdFx0XHRcdFx0XHRjYjogdGhpcy5maWxlVXBsb2FkLmJpbmQodGhpcylcblx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHRcdFxuXHRcdFx0XHR0aGlzLnByb2Nlc3NDb3VudCsrO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLmF1dG9TdGFydCkge1xuXHRcdFx0XHR0aGlzLiRmaWxlLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG5cdFx0XHRcdHhoci5zZW5kKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgJGJ1dHRvbiA9ICQoZG9jdW1lbnQuYm9keSkuZmluZCgnW2RhdGEtZ2Z1LWJ0bj0nK3RoaXMub3B0aW9ucy5pZCsnXScpO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYoJGJ1dHRvbi5sZW5ndGgpIHtcblx0XHRcdFx0XHQkYnV0dG9uLm9uKCdjbGljay5nZnUuc2VuZCcsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0XHRcdGlmKGUpIGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0dGhpcy4kZmlsZS5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xuXHRcdFx0XHRcdFx0eGhyLnNlbmQoKTtcblx0XHRcdFx0XHR9LmJpbmQodGhpcykpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvKlxuICAgICAgICAgKiBQcmVwYXJlIGFuZCBzZW5kIGZpbGVzXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZXRob2QgZ2V0UHJvZ3Jlc3NQbGFjZVxuXHRcdCAqIEByZXR1cm4gRE9NIG9iamVjdFxuICAgICAgICAgKi9cblx0XHRnZXRQcm9ncmVzc1BsYWNlOiBmdW5jdGlvbigpIHtcblx0XHRcdGlmICh0aGlzLm9wdGlvbnMucHJvZ3Jlc3NCb3gpIHJldHVybiAkKGRvY3VtZW50KS5maW5kKCcuZ2Z1LXByb2dyZXNzLWJveCcpO1xuXHRcdFx0XHRcblx0XHRcdHZhciAkcHJvZ3Jlc3NCb3ggPSB0aGlzLiRyb3cuZmluZCgnLmdmdS1wcm9ncmVzcycpO1xuXHRcdFx0cmV0dXJuICgkcHJvZ3Jlc3NCb3gubGVuZ3RoKSA/ICRwcm9ncmVzc0JveFx0OiB0aGlzLiRyb3c7XG5cdFx0fSxcblx0XHRcblx0XHRmaWxlVXBsb2FkOiBmdW5jdGlvbihyZXMsIHByb2dyZXNzQmFyKSB7XG5cdFx0XHRwcm9ncmVzc0Jhci5yZXBsYWNlV2l0aChHVS50ZW1wbGF0ZXMuc3VjY2Vzcyk7XG5cblx0XHRcdGlmKCEhLS10aGlzLnByb2Nlc3NDb3VudCkgcmV0dXJuO1xuXG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLm1heEZpbGVzID09PSBudWxsIHx8IHRoaXMuY291bnRlciA8IHRoaXMub3B0aW9ucy5tYXhGaWxlcykge1xuXHRcdFx0XHR0aGlzLiRmaWxlLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRcblx0XHRcdC8vIENhbGJhY2sg0LLRgdC1INGE0LDQudC70Ysg0LfQsNCz0YDRg9C20LXQvdGLXG5cdFx0XHRcblx0XHR9XG5cdH0pO1xuXHRcblx0XG5cdCQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY29tcG9uZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2dlbmEtdXBsb2FkJyk7XG5cdFx0XG5cdFx0W10uZm9yRWFjaC5jYWxsKGNvbXBvbmVudHMsIGZ1bmN0aW9uIChjb21wb25lbnQpIHtcblx0XHRcdHZhciB0ZW1wbGF0ZSA9IGNvbXBvbmVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1yZWw9XCJpbnB1dFwiXScpO1xuXG5cdFx0XHR0ZW1wbGF0ZSA9IF9oLnRlbXBsYXRlKFxuXHRcdFx0XHR0ZW1wbGF0ZS5sZW5ndGhcblx0XHRcdFx0PyB0ZW1wbGF0ZVswXS5pbm5lckhUTUxcblx0XHRcdFx0OiBHVS50ZW1wbGF0ZXMuaW5wdXQsIGNvbXBvbmVudC5pZCk7XG5cdFx0XHRcblx0XHRcdHRlbXBsYXRlID0gJCh0ZW1wbGF0ZSk7XG5cdFx0XHRcblx0XHRcdCQoY29tcG9uZW50KS5yZXBsYWNlV2l0aCh0ZW1wbGF0ZSk7XG5cdFx0XHQkLmRhdGEodGVtcGxhdGUsICdnZW5hVXBsb2FkZXInLCBuZXcgR1UodGVtcGxhdGUsIGNvbXBvbmVudC5pZCkpO1xuXHRcdFx0XG5cdFx0XHR0ZW1wbGF0ZSA9IG51bGw7XG5cdFx0fSk7XG5cdH0pO1xuXHRcbn0pKGRvY3VtZW50LCB3aW5kb3csIGpRdWVyeSk7XG4iXX0=
