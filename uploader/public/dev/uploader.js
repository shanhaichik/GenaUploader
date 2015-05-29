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
