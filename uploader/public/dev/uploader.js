/*jslint nomen: true*/
(function ($, document, window) {
	'use strict';

	var slice = Array.prototype.slice,
		toString = Object.prototype.toString,
		getKeys = Object.keys,
		hasOwn = Object.hasOwnProperty,
		_ = {};

	_.isUndefined = function (arg) {
		return arg === void 0;
	};
	_.isFunction = function (x) {
		return toString.call(x) === '[object Function]';
	};
	_.isObject = function (x) {
		return typeof x === 'object' && x !== null;
	};
	_.isArray = function (x) {
		return toString.call(x) === '[object Array]';
	};
	_.hasOwn = function (obj, key) {
		return obj !== null && hasOwn.call(obj, key);
	};
	_.template = function (template, data) {
		return template.replace(/\<~([\w\.]*)\~>/g, function (str, key) {
			var keys = key.split("."),
				value = data[keys.shift()] || data;
            [].forEach.call(keys, function () {
				value = value[this];
			});
			return (value === null || value === undefined) ? "" : (_.isArray(value) ? value.join('') : value);
		});
	};
	_.extend = function (obj) {
		if (!_.isObject(obj)) return obj;
		var source, prop;
		for (var i = 1, length = arguments.length; i < length; i++) {
			source = arguments[i];
			for (prop in source) {
				if (_.hasOwn(source, prop)) {
					obj[prop] = source[prop];
				}
			}
		}
		return obj;
	};
	_.isBadIE = function () {
		var _ua = navigator.userAgent.toLowerCase(),
			_msie = (/msie/i.test(_ua) && !/opera/i.test(_ua) || /trident\//i.test(_ua)),
			_v = (_ua.match(/.+(?:me|ox|on|rv|it|era|opr|ie)[\/: ]([\d.]+)/) || [0, '0'])[1];

		return (_msie && _v.split('.')[0] < 10);
	};
	_.support = (function (window) {
		var support = {};

		// Whether the browser supports uploading files with XMLHttpRequest
		support.xhr = !!window.FormData && !!window.XMLHttpRequest && 'upload' in new XMLHttpRequest();

		// Whether the browser supports selecting multiple files at once
		support.multiple = !!window.FileList && 'multiple' in document.createElement('input');

		// Whether the browser supports dropping files to the drop zone
		var div = document.createElement('div');
		support.drop = 'ondragstart' in div && 'ondrop' in div && !!window.FileList;

		return support;
	}(window));

	/*
	 * DOM helpers
	 */
	_.parseXML = function (data) {
		var xml, tmp;
		if (!data || typeof data !== "string") {
			return null;
		}
		try {
			if (window.DOMParser) { // Standard
				tmp = new DOMParser();
				xml = tmp.parseFromString(data, "text/html");
			} else { // IE
				xml = new ActiveXObject("Microsoft.XMLDOM");
				xml.async = "false";
				xml.loadXML(data);
			}
		} catch (e) {
			xml = undefined;
		}
		if (!xml || xml.getElementsByTagName("parsererror").length) {
			//dirty hack for templates insert from page, Sorry
			var err = xml.getElementsByTagName("parsererror");
			err[0].parentNode.removeChild(err[0]);
		}
		// hack for css apply
		var temp = document.createElement("div");
		temp.appendChild(xml.getElementsByTagName('div')[0]);
		return temp;
	};

	_.replaceWith = function (el, html) {
		var parent;
		if ((parent = el.parentNode) && typeof html === 'object') parent.replaceChild(html, el);
		return html;
	};


	/**
	 * Temp store object
	 */
	var Store = {
		_store: [],
		get: function (id) {
			return  this._store[id];
		},
		set: function (id, component) {
			this._store[id] = component;
		}
	};

	/**
	 *  Create new tags in IE < 10
	 */
	if (_.isBadIE) {
		document.createElement('template');
		document.createElement('gena-upload');
	}

	/**
	 * Create XHR class
	 *
	 * @param options
	 */
	var XHR = function () {
		this.queue = [];
	};

	XHR.prototype = {
		add: function (files) {
			this.queue.push(files);
		},
		
		getCount: function() {
			return this.queue.length;	
		},
		
		sendXHR: function() {
			var self = this,
				data = this.queue.shift();
				
			if(!data) {
				this.xhr = null;
				return;
			}
			
			var xhr = this.xhr = new XMLHttpRequest(),
				progress = data.progress.querySelector('.gfu-progress-state')
					
			if(!progress) {
				console.log('Can\'t find class gfu-progress-state for progress bar');
			}
			
			xhr.upload.onprogress =  function (e) {
				var percent = 0, 
					position = e.loaded || e.position, 
					total = e.total || e.totalFileSize;

				if (e.lengthComputable) {
					if(progress) {
						percent = Math.ceil(position / total * 100);
						progress.style.width = percent+'%';
					}
				}
			}
			
			// TODO error callback 404
			xhr.onreadystatechange = function () {
				if(this.readyState == 4) {
					if(this.status == 200) {
						try {
							var response = JSON.parse(this.response);
						} catch (e) {
							var err = {
								status: 'Ошибка обработки ответа',
								data: 'Ответ сервера: ['+this.responseText+']'
							}
							
							console.log(err);
						}
						// call upload callback
						data.cb(response);
						// change del button state
						var btn = data.progress.querySelector('.gfu-progress-del');
							btn.setAttribute('upload', true)
							btn.textContent = 'удалить';
						// send next file
						self.sendXHR();
						
						btn = null;
					} else {
						var err = {
							status: 'Ошибка ответа сервера',
							code: this.status,
							data: 'Ответ сервера: ['+this.responseText+']'
						}
						
						console.log(err);
					}
				}
			}
			
			xhr.open('POST', data.url, true);
			
			// set ajax headers
			xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			
			// set custom headers
			if(data.headers !== null) {
				for(var header in data.headers) {
					if(_.hasOwn(data.headers, header)) {
						xhr.setRequestHeader(header, data.headers[header]);
					}
				}
			}
			
			// prepend and send data
			var fd = new FormData();

			fd.append(data.name, data.file);

			if(data.data !== null) {
				for(var key in data.data) {
					if(_.hasOwn(data.data, key)) {
						fd.append(key, data.data[key]);
					}
				}	
			}
			
			// send data
			xhr.send(fd);
		},
		sendIframe: function() {},
		
		xhrAbort: function(){
			if(this.xhr) {
				this.xhr.abort();
			}
		}
	};

	/**
	 * Create Uploader class
	 *
	 * @param options
	 */
	var GU = window.GU = function ($row) {
		if (!(this instanceof GU)) {
            return new GU($row);
        }
		
		this.$file = $row.querySelector('input[type="file"]');
		this.param = Store.get(this.$file.id);
		
		// if component without params, extend defaults
		if (!this.param) {
			this.param = _.extend({}, GU.defaults);
			this.param.id = this.$file.id;
		}
		
		// get xhr
		this.xhr = new XHR();
		
		//
		this.count = 0;
		this.processCount = 0;
		this.files = [];
	
		this.prepare($row);
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
				maxFiles: 'Превышенно колличесво файлов <~maxFiles~> возможных для загрузки!',
				maxFilesSelect: 'Можно выбрать еще <~fileCount~> файл/файлов',
				maxSize: 'Размер файла <~fileName~> превысил максимальный размер <~maxSize~> Mb',
				invalidType: 'Неверный тип файла <~fileName~>. Для загрузки разрешены: <~fileType~>',
				invalidExtension: 'Неверное расширение файла <~fileName~>. Разрешены следующие: <~fileExtension~>'
			}
		},
		// default templates
		templates: {
			input: ['<div class="gfu-wrap">',
						'<label for="<~id~>" class="gfu-label">',
							'<span class="gfu-text"></span>',
							'<input type="file" id="<~id~>" class="gfu-input" />',
						'</label>',
					'</div>'].join(''),

			progress: ['<div class="gfu-row-progress">',
							'<ul class="gfu-progress-info">',
								'<li class="gfu-progress-name"><~name~></li>',
								'<li class="gfu-progress-size"><~size~> Mb</li>',
							'</ul>',
							'<a href="#" class="gfu-progress-del">отменить</a>',
							'<div class="gfu-progress-state"></div>',
						'</div>'].join('')
		},
		// extend custom options from component
		extend: function (obj) {
			Store.set(obj.id, _.extend({}, GU.defaults, obj));
		}
	});

	/**
	 * Define the methods
	 */
	GU.prototype = {
		prepare: function($row) {
			//set label text
			$row.querySelector('.gfu-text').textContent = this.param.text;

			// config input
			this.$file.disabled = this.param.disabled;
			this.$file.name = this.param.name;
			this.$file.required = this.param.required;

			if (_.support.multiple) {
				this.$file.multiple = this.param.multiple;
			}

			// progress bar place
			if(this.param.progressBox) {
				this.progressBox = document.querySelector('.gfu-progress-box');
				
				document.querySelector('[data-gfu-btn='+this.param.id+']')
						.addEventListener('click', function(e) {
							if(e) e.preventDefault();
							if(this.processCount > 0) {
							// disable input
								this.send();
							}
						}.bind(this), false);
			} else {
				this.progressBox = $row.querySelector('.gfu-progress') || $row;
			}

			// add change handler
			this.$file.addEventListener('change', this.onChange.bind(this), false);
		},
		
		onChange: function(e) {
			var files = e.target.files === undefined 
					? (e.target && e.target.value 
					   ? [{ name: e.target.value.replace(/^.+\\/, '')}] 
					   : []) 
					: e.target.files;
			
			files = slice.call(files);
			
			// try validate each file
			try {
				this.validate(files);
			} catch (err) {
				//add event handler
				console.log(err);
				e.target.value = null;
				return;
			}
			
			// total file count
			this.count = this.count + files.length;
			this.files = this.files.concat(files);
			
			this.beforeSend();
			e.target.value = null;
		},
		
		beforeSend: function() {
			if(_.support.xhr) {
				var sendFile;
				while(sendFile = this.files.shift()) {
					var item = {
						file: sendFile, 
						url: this.param.url, 
						headers: this.param.headers,
						data: this.param.data,
						name: this.param.name,
						progress: this.getProgress(sendFile.name, sendFile.size), 
						cb: this.onCallback.bind(this)
					};
					
					this.xhr.add(item);
					this.processCount++;
				}
			} else {
			
			}
		
			if (this.param.autoStart) {
				this.send();
			}
		},
		
		getProgress: function (name, size) {
			var $progress = _.template(GU.templates.progress, {
				name: name,
				size: Math.ceil((size / 1024) / 1024)
			});
			
			$progress = _.parseXML($progress).firstChild;
			
			$progress
				.querySelector('.gfu-progress-del')
				.addEventListener('click', function(e) {
					if(e) e.preventDefault();
					var state = e.target.getAttribute('upload');

					// if file upload in progress
					if(state === null) {
						// abort upload request
						this.xhr.xhrAbort();					
						this.onCallback();
						// send next file if it exist
						if(this.xhr.getCount()) {
							this.send();
						}
					} else {
						this.count--;
						// add undisable input
					}

					$progress.parentNode.removeChild($progress);
				}.bind(this), false);
			
			return this.progressBox.appendChild($progress);
		},
		
		send: function() {
			if(_.support.xhr) {
				this.xhr.sendXHR();
			} else {
				this.xhr.sendIframe(this.$file);
				}
		},
		
		onCallback: function(resp) {
			
			// add file succsecc upload event
			if(--this.processCount) {
				return;
			}
			
			if (this.param.maxFiles === null || this.count < this.param.maxFiles) {
				console.log('undisable')
			}
			
			// callback all files upload
		},
		
		validate: function(files) {
			var param = this.param,
				errors = param.errors,
				length = files.length,
				count = this.count + length;

			if(param.maxFiles !== null && param.maxFiles < length) {
				var err = _.template(errors.maxFiles, param.maxFiles);
				throw new Error(err);
			}
			
			if(param.maxFiles !== null && param.maxFiles < count) {
				var total = param.maxFiles - this.count;
				var err = _.template(errors.maxFilesSelect, {
					fileCount: total.toString()
				});
				
				throw new Error(err);
			}
			
			[].forEach.call(files, function(file) {
				// validate size
				if (param.maxSize !== null && ((file.size / 1024) / 1024 > param.maxSize)) {
					var err = _.template(errors.maxSize, {
						fileName: file.name, 
						maxSize: param.maxSize.toString()
					});
					
					throw new Error(err);
				}
				
				// validate type
				if (param.acceptExtension !== null) {
					var ext = file.name.toLocaleLowerCase().split('.')[1];
					if (!~param.acceptExtension.indexOf(ext)) {
						var err = _.template(errors.invalidExtension, {
							fileName: file.name, 
							fileExtension: param.acceptExtension.join(', ')
						});
						
						throw new Error(err);
					}
				}
				
				// validate type
				if (param.acceptType !== null && !~param.acceptType.indexOf(file.type)) {
					var err = _.template(errors.invalidType, {
							fileName: file.name, 
							fileType: param.acceptType.join(', ')
						});
						
					throw new Error(err);
				}
			});
		}
	};

	/**
	 * DOM ready, lets begin
	 */
	$(document).ready(function () {
		var components = document.querySelectorAll('gena-upload');

		[].forEach.call(components, function (component) {
			var template = component.querySelectorAll('[data-rel="input"]');
		
			// get template
			template = _.template(
				template.length 
					? template[0].innerHTML
					: GU.templates.input
				, component.id);
			
			// make DOM object
			template = _.parseXML(template).firstChild;
			// replace
			_.replaceWith(component, template);
			
			GU(template, component.id);
		});
	});

})(jQuery, document, window);