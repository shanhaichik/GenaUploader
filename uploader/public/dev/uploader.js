(function (document, window, $) {
	'use strict';

	var slice    = Array.prototype.slice,
		splice   = Array.prototype.splice,
		toString = Object.prototype.toString,
		getKeys  = Object.keys,
		hasOwn   = Object.hasOwnProperty;

	// Helpers
	var _h = {
		isUndefined: function (arg) {return arg === void 0; },
		isFunction: function (x) {return toString.call(x) === '[object Function]'; },
		isObject: function (x) {return typeof x === 'object' && x !== null; },
		isArray: function (x) {return toString.call(x) === '[object Array]'; },
		oHas: function (obj, key) {return obj !== null && hasOwn.call(obj, key); }
	};
	
	_h.template = function (template, data) {
        return template.replace(/\{{([\w\.]*)\}}/g, function (str, key) {
            var keys = key.split("."), value = data[keys.shift()] || data;
            [].forEach.call(keys, function () {
                value = value[this];
            });
            return (value === null || value === undefined) ? "" : (_h.isArray(value) ? value.join('') : value);
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
			
			var $btnAbort = data.progress.find('.gfu-progress-del'),
				$progressState = data.progress.find('.gfu-progress-state');
			
			xhr.upload.onprogress =  function (e) {
				 var percent = 0, 
					 position = e.loaded || e.position, 
					 total = e.total || e.totalFileSize;
				
				if (e.lengthComputable) {
					if($progressState.length) {
						percent = Math.ceil(position / total * 100);
						$progressState.css('width', percent + '%');
					}
				}
			}
			// TODO error callback 404
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
						
						$progressState = $btnAbort = null;
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
			
			// set ajax headers
			xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			
			// set custom headers
			if(data.opt.headers !== null) {
				for(var header in data.opt.headers) {
					if(_h.oHas(data.opt.headers, header)) {
						xhr.setRequestHeader(header, data.opt.headers[header]);
					}
				}
			}
			
			// prepend and send data
			if (_support.xhrUpload) {
				var fd = new FormData();

				fd.append(data.opt.name, data.file);
				
				if(data.opt.data !== null) {
					for(var key in data.opt.data) {
						if(_h.oHas(data.opt.data, key)) {
							fd.append(key, data.opt.data[key]);
						}
					}	
				}
				// send data
				xhr.send(fd);
			} else {
				xhr.send(data.file);
			}
			
			// add abort event handler
			if($btnAbort.length) {
				$btnAbort.on('click.gfu.abort', function(e) {
					if(e) e.preventDefault();

					xhr.abort();
					data.cb();
						
					if(self.filesQueue.length) self.send();
					data.progress.remove();
				});
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
			name: this.options.name,
			required: this.options.required
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
		
		// add xhr 
		this.xhr = new XHR();
		
		// set event handler
		this.$file.on('change.gfu', $.proxy(this.addFiles, this));
		// init upload buttons
		if(this.options.progressBox) this.initBtns();
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
			required: false,

			// Array of the accepted file types, ex. ['application/x-cd-image'] (by default all types are accepted)
			acceptType: null,

			// Array of the accepted file types, ex. ['jpg', 'jpeg', 'png'] (by default all types are accepted)
			acceptExtension: null,
			
			// Place where put progress bar. Class .gfu-progress-box
			progressBox: false,

			// Additional data to send with the files
			data: null,

			// Additional headers to send with the files (only for ajax uploads)
			headers: null,

			// Upload success callback
			success: function () {},

			// Upload fail callback
			fail: function () {},

			// The url to upload the files to
			url: document.URL,

			// The url to remove the files
			removeUrl: null,

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
			input: ['<div class="gfu-wrap">',
						'<label for="{{id}}" class="gfu-label">',
							'<span class="gfu-text"></span>',
							'<input type="file" id="{{id}}" class="gfu-input">',
						'</label>',
					'</div>'].join(''),
			
			progress: ['<div class="gfu-row-progress">',
							'<ul class="gfu-progress-info">',
								'<li class="gfu-progress-name">{{name}}</li>',
								'<li class="gfu-progress-size">{{size}} Mb</li>',
							'</ul>',
							'<a href="#" class="gfu-progress-del">отменить</a>',
							'<div class="gfu-progress-state"></div>',
						'</div>'].join('')
		},
		// extend custom options from component
		extend: function(obj) {
			store.set(obj.id, $.extend({}, GU.defaults, obj));
		}
	});
	
	$.extend(GU.prototype, {
		/*
         * Add buttons event handler
         *
         * @method init
         */
		initBtns: function() {
			var $button = $(document.body).find('[data-gfu-btn='+this.options.id+']');
				
			if($button.length) {
				$button.on('click.gfu.send', function(e) {
					if(e) e.preventDefault();
					
					if(this.processCount > 0) {
						this.$file.prop('disabled', true);
						this.$file.parent('label').addClass('off');
						this.xhr.send();
					}
				}.bind(this));
			}
		},
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
			var $progressBox, sendFile;
			
			// get place for append progress bar
			$progressBox = this.getProgressPlace();
			
			while(sendFile = this.fileArr.shift()) {
				var $progress = _h.template(GU.templates.progress, {
					name: sendFile.name,
					size: Math.ceil((sendFile.size / 1024) / 1024)
				});
				
				this.xhr.createQueue(
					{
						file: sendFile, 
						opt: this.options, 
						progress: $($progress).appendTo($progressBox), 
						cb: this.fileUpload.bind(this)
					}
				);
				
				this.processCount++;
				$progress = null;
			}
			
			if (this.options.autoStart) {
				this.$file.prop('disabled', true);
				this.$file.parent('label').addClass('off');
				this.xhr.send();
			}
		},
		/*
         * Prepare and send files
         *
         * @method getProgressPlace
		 * @return DOM object
         */
		getProgressPlace: function() {
			//TODO реорганизовать
			if (this.options.progressBox) return $(document).find('.gfu-progress-box');
				
			var $progressBox = this.$row.find('.gfu-progress');
			return ($progressBox.length) ? $progressBox	: this.$row;
		},
		
		fileUpload: function(res, progressBar) {
			if(progressBar !== undefined) {
				var $deleteBtn = progressBar.find('.gfu-progress-del');
				//!& 
				if($deleteBtn.length) {
					$deleteBtn
						.off('click.gfu.abort')
						.text('удалить')
						.on('click.gfu.delete', function(e) {
							if(e) e.preventDefault();
							// update counter for undisabled input
							this.counter--;
							this.$file.prop('disabled', false);
							this.$file.parent('label').removeClass('off');
						
							progressBar.remove();						
						}.bind(this));
				}
			}

			if(!!--this.processCount) return;

			if (this.options.maxFiles === null || this.counter < this.options.maxFiles) {
				this.$file.prop('disabled', false);
				this.$file.parent().removeClass('off');
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
