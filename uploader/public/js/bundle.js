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

},{}]},{},["/media/5b8c33bd-b0bc-468a-b4a8-bde993bcb4bf/www/uploader/public/dev/uploader.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL21lZGlhLzViOGMzM2JkLWIwYmMtNDY4YS1iNGE4LWJkZTk5M2JjYjRiZi93d3cvdXBsb2FkZXIvcHVibGljL2Rldi91cGxvYWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZG9jdW1lbnQsIHdpbmRvdywgJCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIHNsaWNlICAgID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLFxuXHRcdHNwbGljZSAgID0gQXJyYXkucHJvdG90eXBlLnNwbGljZSxcblx0XHR0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG5cdFx0Z2V0S2V5cyAgPSBPYmplY3Qua2V5cyxcblx0XHRoYXNPd24gICA9IE9iamVjdC5oYXNPd25Qcm9wZXJ0eTtcblxuXHQvLyBIZWxwZXJzXG5cdHZhciBfaCA9IHtcblx0XHRpc1VuZGVmaW5lZDogZnVuY3Rpb24gKGFyZykge3JldHVybiBhcmcgPT09IHZvaWQgMDsgfSxcblx0XHRpc0Z1bmN0aW9uOiBmdW5jdGlvbiAoeCkge3JldHVybiB0b1N0cmluZy5jYWxsKHgpID09PSAnW29iamVjdCBGdW5jdGlvbl0nOyB9LFxuXHRcdGlzT2JqZWN0OiBmdW5jdGlvbiAoeCkge3JldHVybiB0eXBlb2YgeCA9PT0gJ29iamVjdCcgJiYgeCAhPT0gbnVsbDsgfSxcblx0XHRpc0FycmF5OiBmdW5jdGlvbiAoeCkge3JldHVybiB0b1N0cmluZy5jYWxsKHgpID09PSAnW29iamVjdCBBcnJheV0nOyB9LFxuXHRcdG9IYXM6IGZ1bmN0aW9uIChvYmosIGtleSkge3JldHVybiBvYmogIT09IG51bGwgJiYgaGFzT3duLmNhbGwob2JqLCBrZXkpOyB9XG5cdH07XG5cdFxuXHRfaC50ZW1wbGF0ZSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgZGF0YSkge1xuICAgICAgICByZXR1cm4gdGVtcGxhdGUucmVwbGFjZSgvXFx7eyhbXFx3XFwuXSopXFx9fS9nLCBmdW5jdGlvbiAoc3RyLCBrZXkpIHtcbiAgICAgICAgICAgIHZhciBrZXlzID0ga2V5LnNwbGl0KFwiLlwiKSwgdmFsdWUgPSBkYXRhW2tleXMuc2hpZnQoKV0gfHwgZGF0YTtcbiAgICAgICAgICAgIFtdLmZvckVhY2guY2FsbChrZXlzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZVt0aGlzXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSA/IFwiXCIgOiAoX2guaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZS5qb2luKCcnKSA6IHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblx0XG5cdC8vIERldGVjdCBicm93c2VyXG5cdHZhciBfdWEgPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCksXG5cdFx0X2lzID0ge1xuXHRcdFx0dmVyc2lvbjogKF91YS5tYXRjaCggLy4rKD86bWV8b3h8b258cnZ8aXR8ZXJhfG9wcnxpZSlbXFwvOiBdKFtcXGQuXSspLyApIHx8IFswLCcwJ10pWzFdLFxuXHRcdFx0b3BlcmE6ICgvb3BlcmEvaS50ZXN0KF91YSkgfHwgL29wci9pLnRlc3QoX3VhKSksXG5cdFx0XHRtc2llOiAoL21zaWUvaS50ZXN0KF91YSkgJiYgIS9vcGVyYS9pLnRlc3QoX3VhKSB8fCAvdHJpZGVudFxcLy9pLnRlc3QoX3VhKSksXG5cdFx0XHRtc2llODogKC9tc2llIDgvaS50ZXN0KF91YSkgJiYgIS9vcGVyYS9pLnRlc3QoX3VhKSksXG5cdFx0XHRtc2llOTogKC9tc2llIDkvaS50ZXN0KF91YSkgJiYgIS9vcGVyYS9pLnRlc3QoX3VhKSksXG5cdFx0XHRtb3ppbGxhOiAvZmlyZWZveC9pLnRlc3QoX3VhKSxcblx0XHRcdGNocm9tZTogL2Nocm9tZS9pLnRlc3QoX3VhKSxcblx0XHRcdHNhZmFyaTogKCEoL2Nocm9tZS9pLnRlc3QoX3VhKSkgJiYgL3dlYmtpdHxzYWZhcml8a2h0bWwvaS50ZXN0KF91YSkpLFxuXHRcdFx0aXBob25lOiAvaXBob25lL2kudGVzdChfdWEpLFxuXHRcdFx0aXBob25lNDogL2lwaG9uZS4qT1MgNC9pLnRlc3QoX3VhKSxcblx0XHRcdGlwb2Q0OiAvaXBvZC4qT1MgNC9pLnRlc3QoX3VhKSxcblx0XHRcdGlwYWQ6IC9pcGFkL2kudGVzdChfdWEpLFxuXHRcdFx0YW5kcm9pZDogL2FuZHJvaWQvaS50ZXN0KF91YSksXG5cdFx0XHRtb2JpbGU6IC9pcGhvbmV8aXBvZHxpcGFkfG9wZXJhIG1pbml8b3BlcmEgbW9iaXxpZW1vYmlsZXxhbmRyb2lkL2kudGVzdChfdWEpLFxuXHRcdFx0bXNpZV9tb2JpbGU6IC9pZW1vYmlsZS9pLnRlc3QoX3VhKSxcblx0XHRcdHNhZmFyaV9tb2JpbGU6IC9pcGhvbmV8aXBvZHxpcGFkL2kudGVzdChfdWEpLFxuXHRcdFx0b3BlcmFfbW9iaWxlOiAvb3BlcmEgbWluaXxvcGVyYSBtb2JpL2kudGVzdChfdWEpLFxuXHRcdFx0b3BlcmFfbWluaTogL29wZXJhIG1pbmkvaS50ZXN0KF91YSlcblx0XHR9LFxuXHRcdF9zdXBwb3J0ID0gKGZ1bmN0aW9uICh3aW5kb3cpIHtcbiAgICAgICAgICAgIHZhciBzdXBwb3J0ID0ge307XG5cbiAgICAgICAgICAgIC8vIFdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgdXBsb2FkaW5nIGZpbGVzIHdpdGggWE1MSHR0cFJlcXVlc3RcbiAgICAgICAgICAgIHN1cHBvcnQueGhyVXBsb2FkID0gISF3aW5kb3cuRm9ybURhdGEgJiYgISF3aW5kb3cuWE1MSHR0cFJlcXVlc3QgJiYgJ3VwbG9hZCcgaW4gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgIC8vIFdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgc2VsZWN0aW5nIG11bHRpcGxlIGZpbGVzIGF0IG9uY2VcbiAgICAgICAgICAgIHN1cHBvcnQuc2VsZWN0TXVsdGlwbGUgPSAhIXdpbmRvdy5GaWxlTGlzdCAmJiAnbXVsdGlwbGUnIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cbiAgICAgICAgICAgIC8vIFdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgZHJvcHBpbmcgZmlsZXMgdG8gdGhlIGRyb3Agem9uZVxuICAgICAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgc3VwcG9ydC5kcm9wRmlsZXMgPSAgJ29uZHJhZ3N0YXJ0JyBpbiBkaXYgJiYgJ29uZHJvcCcgaW4gZGl2ICYmICEhd2luZG93LkZpbGVMaXN0O1xuXG4gICAgICAgICAgICByZXR1cm4gc3VwcG9ydDtcbiAgICAgICAgfSh3aW5kb3cpKTtcblx0XG5cdC8qKlxuXHQgKiBUZW1wIHN0b3JlIG9iamVjdFxuXHQgKi9cblx0dmFyIHN0b3JlID0ge1xuXHRcdF9zdG9yZTogW10sXG5cdFx0Z2V0OiBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHJldHVybiB0aGlzLl9zdG9yZVtpZF07XG5cdFx0fSxcblx0XHRzZXQ6IGZ1bmN0aW9uIChpZCwgY29tcG9uZW50KSB7XG5cdFx0XHR0aGlzLl9zdG9yZVtpZF0gPSBjb21wb25lbnQ7XG5cdFx0fVxuXHR9O1xuXHRcdFxuXHQvKipcblx0ICogQ3JlYXRlIFhIUiBjbGFzc1xuXHQgKlxuXHQgKiBAcGFyYW0gb3B0aW9uc1xuXHQgKi9cblx0dmFyIFhIUiA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZmlsZXNRdWV1ZSA9IFtdO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXHRcdFxuXHQkLmV4dGVuZChYSFIucHJvdG90eXBlLCB7XG5cdFx0Z2V0WEhSOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoX3N1cHBvcnQueGhyVXBsb2FkKSB7XG5cdFx0XHRcdHJldHVybiBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0XHRcdH0gZWxzZSBpZiAod2luZG93LkFjdGl2ZVhPYmplY3QpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRyZXR1cm4gbmV3IEFjdGl2ZVhPYmplY3QoJ01pY3Jvc29mdC5YTUxIVFRQJyk7XG5cdFx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0XG5cdFx0Z2V0SWZyYW1lOiBmdW5jdGlvbiAoKSB7fSxcblx0XHRcblx0XHRjcmVhdGVRdWV1ZTogZnVuY3Rpb24oZmlsZURhdGEpIHtcblx0XHRcdHRoaXMuZmlsZXNRdWV1ZS5wdXNoKGZpbGVEYXRhKTtcdFxuXHRcdH0sXG5cdFx0XG5cdFx0c2VuZDogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0XHR4aHIgID0gdGhpcy5nZXRYSFIoKSxcblx0XHRcdFx0ZGF0YSA9IHRoaXMuZmlsZXNRdWV1ZS5zaGlmdCgpO1xuXHRcdFx0XG5cdFx0XHRpZighZGF0YSkge1xuXHRcdFx0XHR4aHIgPSBudWxsO1xuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dmFyICRidG5BYm9ydCA9IGRhdGEucHJvZ3Jlc3MuZmluZCgnLmdmdS1wcm9ncmVzcy1kZWwnKSxcblx0XHRcdFx0JHByb2dyZXNzU3RhdGUgPSBkYXRhLnByb2dyZXNzLmZpbmQoJy5nZnUtcHJvZ3Jlc3Mtc3RhdGUnKTtcblx0XHRcdFxuXHRcdFx0eGhyLnVwbG9hZC5vbnByb2dyZXNzID0gIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdCB2YXIgcGVyY2VudCA9IDAsIFxuXHRcdFx0XHRcdCBwb3NpdGlvbiA9IGUubG9hZGVkIHx8IGUucG9zaXRpb24sIFxuXHRcdFx0XHRcdCB0b3RhbCA9IGUudG90YWwgfHwgZS50b3RhbEZpbGVTaXplO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xuXHRcdFx0XHRcdGlmKCRwcm9ncmVzc1N0YXRlLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0cGVyY2VudCA9IE1hdGguY2VpbChwb3NpdGlvbiAvIHRvdGFsICogMTAwKTtcblx0XHRcdFx0XHRcdCRwcm9ncmVzc1N0YXRlLmNzcygnd2lkdGgnLCBwZXJjZW50ICsgJyUnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdC8vIFRPRE8gZXJyb3IgY2FsbGJhY2sgNDA0XG5cdFx0XHR4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRpZih0aGlzLnJlYWR5U3RhdGUgPT0gNCkge1xuXHRcdFx0XHRcdGlmKHRoaXMuc3RhdHVzID09IDIwMCkge1xuXHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0ZGF0YS5jYihKU09OLnBhcnNlKHRoaXMucmVzcG9uc2UpLCBkYXRhLnByb2dyZXNzKTtcblx0XHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdFx0dmFyIHJlcyA9IHtcblx0XHRcdFx0XHRcdFx0XHRzdGF0dXM6ICfQntGI0LjQsdC60LAg0L7QsdGA0LDQsdC+0YLQutC4INC+0YLQstC10YLQsCcsXG5cdFx0XHRcdFx0XHRcdFx0ZGF0YTogJ9Ce0YLQstC10YIg0YHQtdGA0LLQtdGA0LA6IFsnK3RoaXMucmVzcG9uc2VUZXh0KyddJ1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdCRwcm9ncmVzc1N0YXRlID0gJGJ0bkFib3J0ID0gbnVsbDtcblx0XHRcdFx0XHRcdHNlbGYuc2VuZCgpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR2YXIgcmVzID0ge1xuXHRcdFx0XHRcdFx0XHRzdGF0dXM6ICfQntGI0LjQsdC60LAg0L7RgtCy0LXRgtCwINGB0LXRgNCy0LXRgNCwJyxcblx0XHRcdFx0XHRcdFx0Y29kZTogdGhpcy5zdGF0dXMsXG5cdFx0XHRcdFx0XHRcdGRhdGE6ICfQntGC0LLQtdGCINGB0LXRgNCy0LXRgNCwOiBbJyt0aGlzLnJlc3BvbnNlVGV4dCsnXSdcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0eGhyLm9wZW4oJ1BPU1QnLCBkYXRhLm9wdC51cmwsIHRydWUpO1xuXHRcdFx0XG5cdFx0XHQvLyBzZXQgYWpheCBoZWFkZXJzXG5cdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcignWC1SZXF1ZXN0ZWQtV2l0aCcsICdYTUxIdHRwUmVxdWVzdCcpO1xuXHRcdFx0XG5cdFx0XHQvLyBzZXQgY3VzdG9tIGhlYWRlcnNcblx0XHRcdGlmKGRhdGEub3B0LmhlYWRlcnMgIT09IG51bGwpIHtcblx0XHRcdFx0Zm9yKHZhciBoZWFkZXIgaW4gZGF0YS5vcHQuaGVhZGVycykge1xuXHRcdFx0XHRcdGlmKF9oLm9IYXMoZGF0YS5vcHQuaGVhZGVycywgaGVhZGVyKSkge1xuXHRcdFx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoaGVhZGVyLCBkYXRhLm9wdC5oZWFkZXJzW2hlYWRlcl0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvLyBwcmVwZW5kIGFuZCBzZW5kIGRhdGFcblx0XHRcdGlmIChfc3VwcG9ydC54aHJVcGxvYWQpIHtcblx0XHRcdFx0dmFyIGZkID0gbmV3IEZvcm1EYXRhKCk7XG5cblx0XHRcdFx0ZmQuYXBwZW5kKGRhdGEub3B0Lm5hbWUsIGRhdGEuZmlsZSk7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZihkYXRhLm9wdC5kYXRhICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gZGF0YS5vcHQuZGF0YSkge1xuXHRcdFx0XHRcdFx0aWYoX2gub0hhcyhkYXRhLm9wdC5kYXRhLCBrZXkpKSB7XG5cdFx0XHRcdFx0XHRcdGZkLmFwcGVuZChrZXksIGRhdGEub3B0LmRhdGFba2V5XSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVx0XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gc2VuZCBkYXRhXG5cdFx0XHRcdHhoci5zZW5kKGZkKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHhoci5zZW5kKGRhdGEuZmlsZSk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdC8vIGFkZCBhYm9ydCBldmVudCBoYW5kbGVyXG5cdFx0XHRpZigkYnRuQWJvcnQubGVuZ3RoKSB7XG5cdFx0XHRcdCRidG5BYm9ydC5vbignY2xpY2suZ2Z1LmFib3J0JywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRcdGlmKGUpIGUucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0XHRcdHhoci5hYm9ydCgpO1xuXHRcdFx0XHRcdGRhdGEuY2IoKTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmKHNlbGYuZmlsZXNRdWV1ZS5sZW5ndGgpIHNlbGYuc2VuZCgpO1xuXHRcdFx0XHRcdGRhdGEucHJvZ3Jlc3MucmVtb3ZlKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cdFxuXHQvKipcblx0ICogQ3JlYXRlIFVwbG9hZGVyIGNsYXNzXG5cdCAqXG5cdCAqIEBwYXJhbSBvcHRpb25zXG5cdCAqL1xuXHR2YXIgR1UgPSB3aW5kb3cuR1UgPSBmdW5jdGlvbiAocm93LCBpZCkge1xuXHRcdHRoaXMuJHJvdyA9IHJvdztcblx0XHR0aGlzLiRmaWxlID0gdGhpcy4kcm93LmZpbmQoJ2lucHV0W3R5cGU9ZmlsZV0nKTtcblx0XHR0aGlzLm9wdGlvbnMgPSBzdG9yZS5nZXQoaWQpO1xuXHRcdFxuXHRcdGlmICghdGhpcy5vcHRpb25zKSB7XG5cdFx0XHR0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgR1UuZGVmYXVsdHMpO1xuXHRcdFx0dGhpcy5vcHRpb25zLmlkID0gaWQ7XG5cdFx0fVxuXHRcdFxuXHRcdHRoaXMuJGZpbGUuYXR0cih7XG4gICAgICAgICAgICBpZDogdGhpcy5vcHRpb25zLmlkLCAgICAgICAgIFxuICAgICAgICAgICAgZGlzYWJsZWQ6IHRoaXMub3B0aW9ucy5kaXNhYmxlZCxcblx0XHRcdG5hbWU6IHRoaXMub3B0aW9ucy5uYW1lLFxuXHRcdFx0cmVxdWlyZWQ6IHRoaXMub3B0aW9ucy5yZXF1aXJlZFxuICAgICAgICB9KTtcblx0XHQvLyAhP1xuXHRcdGlmIChfc3VwcG9ydC5zZWxlY3RNdWx0aXBsZSkge1xuXHRcdFx0dGhpcy4kZmlsZS5hdHRyKCdtdWx0aXBsZScsIHRoaXMub3B0aW9ucy5tdWx0aXBsZSk7XG5cdFx0fVxuXHRcdFxuXHRcdC8vIHNldCBsYWJlbCB0ZXh0XG5cdFx0dGhpcy4kcm93LmZpbmQoJy5nZnUtdGV4dCcpLnRleHQodGhpcy5vcHRpb25zLnRleHQpO1xuXHRcdFxuXHRcdC8vIGRlZmluZSBxdWV1ZSBwcm9wc1xuXHRcdHRoaXMuZmlsZUFyciA9IFtdO1xuXHRcdHRoaXMuY291bnRlciA9IDA7XG5cdFx0dGhpcy5wcm9jZXNzQ291bnQgPSAwO1xuXHRcdFxuXHRcdC8vIGFkZCB4aHIgXG5cdFx0dGhpcy54aHIgPSBuZXcgWEhSKCk7XG5cdFx0XG5cdFx0Ly8gc2V0IGV2ZW50IGhhbmRsZXJcblx0XHR0aGlzLiRmaWxlLm9uKCdjaGFuZ2UuZ2Z1JywgJC5wcm94eSh0aGlzLmFkZEZpbGVzLCB0aGlzKSk7XG5cdFx0Ly8gaW5pdCB1cGxvYWQgYnV0dG9uc1xuXHRcdGlmKHRoaXMub3B0aW9ucy5wcm9ncmVzc0JveCkgdGhpcy5pbml0QnRucygpO1xuXHR9O1xuXHRcblx0LyoqXG5cdCAqIERlZmluZSB0aGUgc3RhdGljIHByb3BlcnRpZXMgb2YgVXBsb2FkZXJcblx0ICovXG5cdCQuZXh0ZW5kKEdVLCB7XG5cdFx0LyoqXG5cdFx0ICogRGVmYXVsdCB2YWx1ZXNcblx0XHQgKi9cblx0XHRkZWZhdWx0czoge1xuXHRcdFx0Ly8gaWQgb2YgY29tcG9uZW50XG5cdFx0XHRpZDogbnVsbCxcblx0XHRcdC8vIE5hbWUgb2YgdGhlIGZpbGUgaW5wdXRcblx0XHRcdG5hbWU6ICdmaWxlcycsXG5cdFx0XHRcblx0XHRcdC8vIERlZmF1bHQgbGFiZWwgdGV4dFxuXHRcdFx0dGV4dDogJ9CX0LDQs9GA0YPQt9C40YLRjCDRhNCw0LnQuycsXG5cblx0XHRcdC8vIFdoZXRoZXIgc2VsZWN0aW5nIG11bHRpcGxlIGZpbGVzIGF0IG9uY2UgaW4gYWxsb3dlZFxuXHRcdFx0bXVsdGlwbGU6IHRydWUsXG5cblx0XHRcdC8vIERpc2FibGUgaW5wdXQgIGlmIHRoZSBudW1iZXIgb2YgZmlsZXMgaXMgdGhlIG1heGltdW0gbnVtYmVyIG9mIHVwbG9hZGVkIGZpbGVzIG9yIHJlcXVpcmVkIGJ5IHRoZSBsb2dpY1xuXHRcdFx0ZGlzYWJsZWQ6IGZhbHNlLFxuXG5cdFx0XHQvLyBUaGUgbWF4aW11bSBudW1iZXIgb2YgZmlsZXMgdGhlIHVzZXIgY2FuIHVwbG9hZCAoYnkgZGVmYXVsdCB0aGVyZSBpcyBubyBsaW1pdClcblx0XHRcdG1heEZpbGVzOiBudWxsLFxuXG5cdFx0XHQvLyBUaGUgbWF4aW11bSBzaXplIG9mIGZpbGVzIHRoZSB1c2VyIGNhbiB1cGxvYWQgKGJ5IGRlZmF1bHQgdGhlcmUgaXMgbm8gbGltaXQpXG5cdFx0XHRtYXhTaXplOiBudWxsLFxuXG5cdFx0XHQvLyBXaGV0aGVyIHRvIGF1dG9tYXRpY2FsbHkgdXBsb2FkIGZpbGVzIGFmdGVyIHRoZXkgd2VyZSBzZWxlY3RlZFxuXHRcdFx0YXV0b1N0YXJ0OiB0cnVlLFxuXG5cdFx0XHQvLyBSZXF1aXJlZCBmaWVsZCBpbiB0aGUgZm9ybSAoYnkgZGVmYXVsdCByZXF1aXJlZClcblx0XHRcdHJlcXVpcmVkOiBmYWxzZSxcblxuXHRcdFx0Ly8gQXJyYXkgb2YgdGhlIGFjY2VwdGVkIGZpbGUgdHlwZXMsIGV4LiBbJ2FwcGxpY2F0aW9uL3gtY2QtaW1hZ2UnXSAoYnkgZGVmYXVsdCBhbGwgdHlwZXMgYXJlIGFjY2VwdGVkKVxuXHRcdFx0YWNjZXB0VHlwZTogbnVsbCxcblxuXHRcdFx0Ly8gQXJyYXkgb2YgdGhlIGFjY2VwdGVkIGZpbGUgdHlwZXMsIGV4LiBbJ2pwZycsICdqcGVnJywgJ3BuZyddIChieSBkZWZhdWx0IGFsbCB0eXBlcyBhcmUgYWNjZXB0ZWQpXG5cdFx0XHRhY2NlcHRFeHRlbnNpb246IG51bGwsXG5cdFx0XHRcblx0XHRcdC8vIFBsYWNlIHdoZXJlIHB1dCBwcm9ncmVzcyBiYXIuIENsYXNzIC5nZnUtcHJvZ3Jlc3MtYm94XG5cdFx0XHRwcm9ncmVzc0JveDogZmFsc2UsXG5cblx0XHRcdC8vIEFkZGl0aW9uYWwgZGF0YSB0byBzZW5kIHdpdGggdGhlIGZpbGVzXG5cdFx0XHRkYXRhOiBudWxsLFxuXG5cdFx0XHQvLyBBZGRpdGlvbmFsIGhlYWRlcnMgdG8gc2VuZCB3aXRoIHRoZSBmaWxlcyAob25seSBmb3IgYWpheCB1cGxvYWRzKVxuXHRcdFx0aGVhZGVyczogbnVsbCxcblxuXHRcdFx0Ly8gVXBsb2FkIHN1Y2Nlc3MgY2FsbGJhY2tcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHt9LFxuXG5cdFx0XHQvLyBVcGxvYWQgZmFpbCBjYWxsYmFja1xuXHRcdFx0ZmFpbDogZnVuY3Rpb24gKCkge30sXG5cblx0XHRcdC8vIFRoZSB1cmwgdG8gdXBsb2FkIHRoZSBmaWxlcyB0b1xuXHRcdFx0dXJsOiBkb2N1bWVudC5VUkwsXG5cblx0XHRcdC8vIFRoZSB1cmwgdG8gcmVtb3ZlIHRoZSBmaWxlc1xuXHRcdFx0cmVtb3ZlVXJsOiBudWxsLFxuXG5cdFx0XHQvLyBFcnJvciBtZXNzYWdlc1xuXHRcdFx0ZXJyb3JzOiB7XG5cdFx0XHRcdG1heEZpbGVzOiAn0J/RgNC10LLRi9GI0LXQvdC90L4g0LrQvtC70LvQuNGH0LXRgdCy0L4g0YTQsNC50LvQvtCyIHt7bWF4RmlsZXN9fSDQstC+0LfQvNC+0LbQvdGL0YUg0LTQu9GPINC30LDQs9GA0YPQt9C60LghJyxcblx0XHRcdFx0bWF4RmlsZXNTZWxlY3Q6ICfQnNC+0LbQvdC+INCy0YvQsdGA0LDRgtGMINC10YnQtSB7e2ZpbGVDb3VudH19INGE0LDQudC7L9GE0LDQudC70L7QsicsXG5cdFx0XHRcdG1heFNpemU6ICfQoNCw0LfQvNC10YAg0YTQsNC50LvQsCB7e2ZpbGVOYW1lfX0g0L/RgNC10LLRi9GB0LjQuyDQvNCw0LrRgdC40LzQsNC70YzQvdGL0Lkg0YDQsNC30LzQtdGAIHt7bWF4U2l6ZX19IE1iJyxcblx0XHRcdFx0aW52YWxpZFR5cGU6ICfQndC10LLQtdGA0L3Ri9C5INGC0LjQvyDRhNCw0LnQu9CwIHt7ZmlsZU5hbWV9fS4g0JTQu9GPINC30LDQs9GA0YPQt9C60Lgg0YDQsNC30YDQtdGI0LXQvdGLOiB7e2ZpbGVUeXBlfX0nLFxuXHRcdFx0XHRpbnZhbGlkRXh0ZW5zaW9uOiAn0J3QtdCy0LXRgNC90L7QtSDRgNCw0YHRiNC40YDQtdC90LjQtSDRhNCw0LnQu9CwIHt7ZmlsZU5hbWV9fS4g0KDQsNC30YDQtdGI0LXQvdGLINGB0LvQtdC00YPRjtGJ0LjQtToge3tmaWxlRXh0ZW5zaW9ufX0nXG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvLyBkZWZhdWx0IHRlbXBsYXRlc1xuXHRcdHRlbXBsYXRlczoge1xuXHRcdFx0aW5wdXQ6IFsnPGRpdiBjbGFzcz1cImdmdS13cmFwXCI+Jyxcblx0XHRcdFx0XHRcdCc8bGFiZWwgZm9yPVwie3tpZH19XCIgY2xhc3M9XCJnZnUtbGFiZWxcIj4nLFxuXHRcdFx0XHRcdFx0XHQnPHNwYW4gY2xhc3M9XCJnZnUtdGV4dFwiPjwvc3Bhbj4nLFxuXHRcdFx0XHRcdFx0XHQnPGlucHV0IHR5cGU9XCJmaWxlXCIgaWQ9XCJ7e2lkfX1cIiBjbGFzcz1cImdmdS1pbnB1dFwiPicsXG5cdFx0XHRcdFx0XHQnPC9sYWJlbD4nLFxuXHRcdFx0XHRcdCc8L2Rpdj4nXS5qb2luKCcnKSxcblx0XHRcdFxuXHRcdFx0cHJvZ3Jlc3M6IFsnPGRpdiBjbGFzcz1cImdmdS1yb3ctcHJvZ3Jlc3NcIj4nLFxuXHRcdFx0XHRcdFx0XHQnPHVsIGNsYXNzPVwiZ2Z1LXByb2dyZXNzLWluZm9cIj4nLFxuXHRcdFx0XHRcdFx0XHRcdCc8bGkgY2xhc3M9XCJnZnUtcHJvZ3Jlc3MtbmFtZVwiPnt7bmFtZX19PC9saT4nLFxuXHRcdFx0XHRcdFx0XHRcdCc8bGkgY2xhc3M9XCJnZnUtcHJvZ3Jlc3Mtc2l6ZVwiPnt7c2l6ZX19IE1iPC9saT4nLFxuXHRcdFx0XHRcdFx0XHQnPC91bD4nLFxuXHRcdFx0XHRcdFx0XHQnPGEgaHJlZj1cIiNcIiBjbGFzcz1cImdmdS1wcm9ncmVzcy1kZWxcIj7QvtGC0LzQtdC90LjRgtGMPC9hPicsXG5cdFx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiZ2Z1LXByb2dyZXNzLXN0YXRlXCI+PC9kaXY+Jyxcblx0XHRcdFx0XHRcdCc8L2Rpdj4nXS5qb2luKCcnKVxuXHRcdH0sXG5cdFx0Ly8gZXh0ZW5kIGN1c3RvbSBvcHRpb25zIGZyb20gY29tcG9uZW50XG5cdFx0ZXh0ZW5kOiBmdW5jdGlvbihvYmopIHtcblx0XHRcdHN0b3JlLnNldChvYmouaWQsICQuZXh0ZW5kKHt9LCBHVS5kZWZhdWx0cywgb2JqKSk7XG5cdFx0fVxuXHR9KTtcblx0XG5cdCQuZXh0ZW5kKEdVLnByb3RvdHlwZSwge1xuXHRcdC8qXG4gICAgICAgICAqIEFkZCBidXR0b25zIGV2ZW50IGhhbmRsZXJcbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCBpbml0XG4gICAgICAgICAqL1xuXHRcdGluaXRCdG5zOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciAkYnV0dG9uID0gJChkb2N1bWVudC5ib2R5KS5maW5kKCdbZGF0YS1nZnUtYnRuPScrdGhpcy5vcHRpb25zLmlkKyddJyk7XG5cdFx0XHRcdFxuXHRcdFx0aWYoJGJ1dHRvbi5sZW5ndGgpIHtcblx0XHRcdFx0JGJ1dHRvbi5vbignY2xpY2suZ2Z1LnNlbmQnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0aWYoZSkgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmKHRoaXMucHJvY2Vzc0NvdW50ID4gMCkge1xuXHRcdFx0XHRcdFx0dGhpcy4kZmlsZS5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xuXHRcdFx0XHRcdFx0dGhpcy4kZmlsZS5wYXJlbnQoJ2xhYmVsJykuYWRkQ2xhc3MoJ29mZicpO1xuXHRcdFx0XHRcdFx0dGhpcy54aHIuc2VuZCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fS5iaW5kKHRoaXMpKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdC8qXG4gICAgICAgICAqIEFkZCBpbnB1dCBmaWxlcyBpbiB1cGxvYWQgcXVldWVcbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCBhZGRGaWxlc1xuICAgICAgICAgKi9cblx0XHRhZGRGaWxlczogZnVuY3Rpb24gKGUpIHtcblx0XHRcdC8vIFRPRE8g0YPQtNCw0LvQtdC90LjQtSDQuNC3INC+0YfQtdGA0LXQtNC4INC/0YDQuCDRgdCx0YDQvtGB0LVcblx0XHRcdGlmIChlLnRhcmdldC52YWx1ZSA9PT0gJycpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR2YXIgZmlsZXMgPSBzbGljZS5hcHBseShlLnRhcmdldC5maWxlcyk7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdHRoaXMudmFsaWRhdGUoZmlsZXMpO1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XG5cdFx0XHRcdGUudGFyZ2V0LnZhbHVlID0gbnVsbDtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR0aGlzLmZpbGVBcnIgPSB0aGlzLmZpbGVBcnIuY29uY2F0KGZpbGVzKTtcblx0XHRcblx0XHRcdHRoaXMuZmlsZUdvQXdheSgpO1xuXHRcdFx0ZS50YXJnZXQudmFsdWUgPSBudWxsO1xuXHRcdH0sXG5cdFx0LypcbiAgICAgICAgICogVmFsaWRhdGUgZmlsZXNcbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCB2YWxpZGF0ZVxuXHRcdCAqIEBwYXJhbSBmaWxlcyBmaWxlIG9iamVjdCBmcm9tIGlucHV0XG4gICAgICAgICAqL1xuXHRcdHZhbGlkYXRlOiBmdW5jdGlvbihmaWxlcykge1xuXHRcdFx0dmFyIGZMZW5ndGggPSBmaWxlcy5sZW5ndGgsXG5cdFx0XHRcdG8gPSB0aGlzLm9wdGlvbnMsXG5cdFx0XHRcdGZDb3VudCA9IHRoaXMuY291bnRlciArIGZMZW5ndGg7XG5cdFx0XHRcblx0XHRcdGlmKG8ubWF4RmlsZXMgIT09IG51bGwgJiYgby5tYXhGaWxlcyA8IGZMZW5ndGgpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKF9oLnRlbXBsYXRlKG8uZXJyb3JzLm1heEZpbGVzLCBvLm1heEZpbGVzKSk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGlmKG8ubWF4RmlsZXMgIT09IG51bGwgJiYgby5tYXhGaWxlcyA8IGZDb3VudCkge1xuXHRcdFx0XHR2YXIgdG90YWwgPSBvLm1heEZpbGVzIC0gdGhpcy5jb3VudGVyO1xuXHRcdFx0XHR2YXIgZXJyID0gX2gudGVtcGxhdGUoby5lcnJvcnMubWF4RmlsZXNTZWxlY3QsIHtcblx0XHRcdFx0XHRmaWxlQ291bnQ6IHRvdGFsLnRvU3RyaW5nKClcblx0XHRcdFx0fSk7XG5cdFx0XHRcdFxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0W10uZm9yRWFjaC5jYWxsKGZpbGVzLCBmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRcdC8vIHZhbGlkYXRlIHNpemVcblx0XHRcdFx0aWYgKG8ubWF4U2l6ZSAhPT0gbnVsbCAmJiAoKGZpbGUuc2l6ZSAvIDEwMjQpIC8gMTAyNCA+IG8ubWF4U2l6ZSkpIHtcblx0XHRcdFx0XHR2YXIgZXJyID0gX2gudGVtcGxhdGUoby5lcnJvcnMubWF4U2l6ZSwge1xuXHRcdFx0XHRcdFx0ZmlsZU5hbWU6IGZpbGUubmFtZSwgXG5cdFx0XHRcdFx0XHRtYXhTaXplOiBvLm1heFNpemUudG9TdHJpbmcoKVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihlcnIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyB2YWxpZGF0ZSB0eXBlXG5cdFx0XHRcdGlmIChvLmFjY2VwdEV4dGVuc2lvbiAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdHZhciBleHQgPSBmaWxlLm5hbWUudG9Mb2NhbGVMb3dlckNhc2UoKS5zcGxpdCgnLicpWzFdO1xuXHRcdFx0XHRcdGlmICghfm8uYWNjZXB0RXh0ZW5zaW9uLmluZGV4T2YoZXh0KSkge1xuXHRcdFx0XHRcdFx0dmFyIGVyciA9IF9oLnRlbXBsYXRlKG8uZXJyb3JzLmludmFsaWRFeHRlbnNpb24sIHtcblx0XHRcdFx0XHRcdFx0ZmlsZU5hbWU6IGZpbGUubmFtZSwgXG5cdFx0XHRcdFx0XHRcdGZpbGVFeHRlbnNpb246IG8uYWNjZXB0RXh0ZW5zaW9uLmpvaW4oJywgJylcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdC8vIHZhbGlkYXRlIHR5cGVcblx0XHRcdFx0aWYgKG8uYWNjZXB0VHlwZSAhPT0gbnVsbCAmJiAhfm8uYWNjZXB0VHlwZS5pbmRleE9mKGZpbGUudHlwZSkpIHtcblx0XHRcdFx0XHR2YXIgZXJyID0gX2gudGVtcGxhdGUoby5lcnJvcnMuaW52YWxpZFR5cGUsIHtcblx0XHRcdFx0XHRcdFx0ZmlsZU5hbWU6IGZpbGUubmFtZSwgXG5cdFx0XHRcdFx0XHRcdGZpbGVUeXBlOiBvLmFjY2VwdFR5cGUuam9pbignLCAnKVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0dGhpcy5jb3VudGVyKys7XG5cdFx0XHR9LmJpbmQodGhpcykpO1xuXHRcdH0sXG5cdFx0XG5cdFx0LypcbiAgICAgICAgICogUHJlcGFyZSBhbmQgc2VuZCBmaWxlc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAbWV0aG9kIGZpbGVHb0F3YXlcbiAgICAgICAgICovXG5cdFx0ZmlsZUdvQXdheTogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyICRwcm9ncmVzc0JveCwgc2VuZEZpbGU7XG5cdFx0XHRcblx0XHRcdC8vIGdldCBwbGFjZSBmb3IgYXBwZW5kIHByb2dyZXNzIGJhclxuXHRcdFx0JHByb2dyZXNzQm94ID0gdGhpcy5nZXRQcm9ncmVzc1BsYWNlKCk7XG5cdFx0XHRcblx0XHRcdHdoaWxlKHNlbmRGaWxlID0gdGhpcy5maWxlQXJyLnNoaWZ0KCkpIHtcblx0XHRcdFx0dmFyICRwcm9ncmVzcyA9IF9oLnRlbXBsYXRlKEdVLnRlbXBsYXRlcy5wcm9ncmVzcywge1xuXHRcdFx0XHRcdG5hbWU6IHNlbmRGaWxlLm5hbWUsXG5cdFx0XHRcdFx0c2l6ZTogTWF0aC5jZWlsKChzZW5kRmlsZS5zaXplIC8gMTAyNCkgLyAxMDI0KVxuXHRcdFx0XHR9KTtcblx0XHRcdFx0XG5cdFx0XHRcdHRoaXMueGhyLmNyZWF0ZVF1ZXVlKFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGZpbGU6IHNlbmRGaWxlLCBcblx0XHRcdFx0XHRcdG9wdDogdGhpcy5vcHRpb25zLCBcblx0XHRcdFx0XHRcdHByb2dyZXNzOiAkKCRwcm9ncmVzcykuYXBwZW5kVG8oJHByb2dyZXNzQm94KSwgXG5cdFx0XHRcdFx0XHRjYjogdGhpcy5maWxlVXBsb2FkLmJpbmQodGhpcylcblx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHRcdFxuXHRcdFx0XHR0aGlzLnByb2Nlc3NDb3VudCsrO1xuXHRcdFx0XHQkcHJvZ3Jlc3MgPSBudWxsO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLmF1dG9TdGFydCkge1xuXHRcdFx0XHR0aGlzLiRmaWxlLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG5cdFx0XHRcdHRoaXMuJGZpbGUucGFyZW50KCdsYWJlbCcpLmFkZENsYXNzKCdvZmYnKTtcblx0XHRcdFx0dGhpcy54aHIuc2VuZCgpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0LypcbiAgICAgICAgICogUHJlcGFyZSBhbmQgc2VuZCBmaWxlc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAbWV0aG9kIGdldFByb2dyZXNzUGxhY2Vcblx0XHQgKiBAcmV0dXJuIERPTSBvYmplY3RcbiAgICAgICAgICovXG5cdFx0Z2V0UHJvZ3Jlc3NQbGFjZTogZnVuY3Rpb24oKSB7XG5cdFx0XHQvL1RPRE8g0YDQtdC+0YDQs9Cw0L3QuNC30L7QstCw0YLRjFxuXHRcdFx0aWYgKHRoaXMub3B0aW9ucy5wcm9ncmVzc0JveCkgcmV0dXJuICQoZG9jdW1lbnQpLmZpbmQoJy5nZnUtcHJvZ3Jlc3MtYm94Jyk7XG5cdFx0XHRcdFxuXHRcdFx0dmFyICRwcm9ncmVzc0JveCA9IHRoaXMuJHJvdy5maW5kKCcuZ2Z1LXByb2dyZXNzJyk7XG5cdFx0XHRyZXR1cm4gKCRwcm9ncmVzc0JveC5sZW5ndGgpID8gJHByb2dyZXNzQm94XHQ6IHRoaXMuJHJvdztcblx0XHR9LFxuXHRcdFxuXHRcdGZpbGVVcGxvYWQ6IGZ1bmN0aW9uKHJlcywgcHJvZ3Jlc3NCYXIpIHtcblx0XHRcdGlmKHByb2dyZXNzQmFyICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0dmFyICRkZWxldGVCdG4gPSBwcm9ncmVzc0Jhci5maW5kKCcuZ2Z1LXByb2dyZXNzLWRlbCcpO1xuXHRcdFx0XHQvLyEmIFxuXHRcdFx0XHRpZigkZGVsZXRlQnRuLmxlbmd0aCkge1xuXHRcdFx0XHRcdCRkZWxldGVCdG5cblx0XHRcdFx0XHRcdC5vZmYoJ2NsaWNrLmdmdS5hYm9ydCcpXG5cdFx0XHRcdFx0XHQudGV4dCgn0YPQtNCw0LvQuNGC0YwnKVxuXHRcdFx0XHRcdFx0Lm9uKCdjbGljay5nZnUuZGVsZXRlJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRcdFx0XHRpZihlKSBlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0XHRcdC8vIHVwZGF0ZSBjb3VudGVyIGZvciB1bmRpc2FibGVkIGlucHV0XG5cdFx0XHRcdFx0XHRcdHRoaXMuY291bnRlci0tO1xuXHRcdFx0XHRcdFx0XHR0aGlzLiRmaWxlLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXHRcdFx0XHRcdFx0XHR0aGlzLiRmaWxlLnBhcmVudCgnbGFiZWwnKS5yZW1vdmVDbGFzcygnb2ZmJyk7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0cHJvZ3Jlc3NCYXIucmVtb3ZlKCk7XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR9LmJpbmQodGhpcykpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmKCEhLS10aGlzLnByb2Nlc3NDb3VudCkgcmV0dXJuO1xuXG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLm1heEZpbGVzID09PSBudWxsIHx8IHRoaXMuY291bnRlciA8IHRoaXMub3B0aW9ucy5tYXhGaWxlcykge1xuXHRcdFx0XHR0aGlzLiRmaWxlLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXHRcdFx0XHR0aGlzLiRmaWxlLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdvZmYnKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gQ2FsYmFjayDQstGB0LUg0YTQsNC50LvRiyDQt9Cw0LPRgNGD0LbQtdC90Ytcblx0XHR9XG5cdH0pO1xuXHRcblx0XG5cdCQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY29tcG9uZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2dlbmEtdXBsb2FkJyk7XG5cdFx0XG5cdFx0W10uZm9yRWFjaC5jYWxsKGNvbXBvbmVudHMsIGZ1bmN0aW9uIChjb21wb25lbnQpIHtcblx0XHRcdHZhciB0ZW1wbGF0ZSA9IGNvbXBvbmVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1yZWw9XCJpbnB1dFwiXScpO1xuXG5cdFx0XHR0ZW1wbGF0ZSA9IF9oLnRlbXBsYXRlKFxuXHRcdFx0XHR0ZW1wbGF0ZS5sZW5ndGhcblx0XHRcdFx0PyB0ZW1wbGF0ZVswXS5pbm5lckhUTUxcblx0XHRcdFx0OiBHVS50ZW1wbGF0ZXMuaW5wdXQsIGNvbXBvbmVudC5pZCk7XG5cdFx0XHRcblx0XHRcdHRlbXBsYXRlID0gJCh0ZW1wbGF0ZSk7XG5cdFx0XHRcblx0XHRcdCQoY29tcG9uZW50KS5yZXBsYWNlV2l0aCh0ZW1wbGF0ZSk7XG5cdFx0XHQkLmRhdGEodGVtcGxhdGUsICdnZW5hVXBsb2FkZXInLCBuZXcgR1UodGVtcGxhdGUsIGNvbXBvbmVudC5pZCkpO1xuXHRcdFx0XG5cdFx0XHR0ZW1wbGF0ZSA9IG51bGw7XG5cdFx0fSk7XG5cdH0pO1xuXHRcbn0pKGRvY3VtZW50LCB3aW5kb3csIGpRdWVyeSk7XG4iXX0=
