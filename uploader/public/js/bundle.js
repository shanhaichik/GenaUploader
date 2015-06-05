(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/media/5b8c33bd-b0bc-468a-b4a8-bde993bcb4bf/www/uploader/public/dev/uploader.js":[function(require,module,exports){
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
},{}]},{},["/media/5b8c33bd-b0bc-468a-b4a8-bde993bcb4bf/www/uploader/public/dev/uploader.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL21lZGlhLzViOGMzM2JkLWIwYmMtNDY4YS1iNGE4LWJkZTk5M2JjYjRiZi93d3cvdXBsb2FkZXIvcHVibGljL2Rldi91cGxvYWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypqc2xpbnQgbm9tZW46IHRydWUqL1xuKGZ1bmN0aW9uICgkLCBkb2N1bWVudCwgd2luZG93KSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UsXG5cdFx0dG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuXHRcdGdldEtleXMgPSBPYmplY3Qua2V5cyxcblx0XHRoYXNPd24gPSBPYmplY3QuaGFzT3duUHJvcGVydHksXG5cdFx0XyA9IHt9O1xuXG5cdF8uaXNVbmRlZmluZWQgPSBmdW5jdGlvbiAoYXJnKSB7XG5cdFx0cmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xuXHR9O1xuXHRfLmlzRnVuY3Rpb24gPSBmdW5jdGlvbiAoeCkge1xuXHRcdHJldHVybiB0b1N0cmluZy5jYWxsKHgpID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xuXHR9O1xuXHRfLmlzT2JqZWN0ID0gZnVuY3Rpb24gKHgpIHtcblx0XHRyZXR1cm4gdHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGw7XG5cdH07XG5cdF8uaXNBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG5cdFx0cmV0dXJuIHRvU3RyaW5nLmNhbGwoeCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG5cdH07XG5cdF8uaGFzT3duID0gZnVuY3Rpb24gKG9iaiwga2V5KSB7XG5cdFx0cmV0dXJuIG9iaiAhPT0gbnVsbCAmJiBoYXNPd24uY2FsbChvYmosIGtleSk7XG5cdH07XG5cdF8udGVtcGxhdGUgPSBmdW5jdGlvbiAodGVtcGxhdGUsIGRhdGEpIHtcblx0XHRyZXR1cm4gdGVtcGxhdGUucmVwbGFjZSgvXFw8fihbXFx3XFwuXSopXFx+Pi9nLCBmdW5jdGlvbiAoc3RyLCBrZXkpIHtcblx0XHRcdHZhciBrZXlzID0ga2V5LnNwbGl0KFwiLlwiKSxcblx0XHRcdFx0dmFsdWUgPSBkYXRhW2tleXMuc2hpZnQoKV0gfHwgZGF0YTtcbiAgICAgICAgICAgIFtdLmZvckVhY2guY2FsbChrZXlzLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHZhbHVlID0gdmFsdWVbdGhpc107XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkgPyBcIlwiIDogKF8uaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZS5qb2luKCcnKSA6IHZhbHVlKTtcblx0XHR9KTtcblx0fTtcblx0Xy5leHRlbmQgPSBmdW5jdGlvbiAob2JqKSB7XG5cdFx0aWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG5cdFx0dmFyIHNvdXJjZSwgcHJvcDtcblx0XHRmb3IgKHZhciBpID0gMSwgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdFx0XHRzb3VyY2UgPSBhcmd1bWVudHNbaV07XG5cdFx0XHRmb3IgKHByb3AgaW4gc291cmNlKSB7XG5cdFx0XHRcdGlmIChfLmhhc093bihzb3VyY2UsIHByb3ApKSB7XG5cdFx0XHRcdFx0b2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cdF8uaXNCYWRJRSA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgX3VhID0gbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLFxuXHRcdFx0X21zaWUgPSAoL21zaWUvaS50ZXN0KF91YSkgJiYgIS9vcGVyYS9pLnRlc3QoX3VhKSB8fCAvdHJpZGVudFxcLy9pLnRlc3QoX3VhKSksXG5cdFx0XHRfdiA9IChfdWEubWF0Y2goLy4rKD86bWV8b3h8b258cnZ8aXR8ZXJhfG9wcnxpZSlbXFwvOiBdKFtcXGQuXSspLykgfHwgWzAsICcwJ10pWzFdO1xuXG5cdFx0cmV0dXJuIChfbXNpZSAmJiBfdi5zcGxpdCgnLicpWzBdIDwgMTApO1xuXHR9O1xuXHRfLnN1cHBvcnQgPSAoZnVuY3Rpb24gKHdpbmRvdykge1xuXHRcdHZhciBzdXBwb3J0ID0ge307XG5cblx0XHQvLyBXaGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIHVwbG9hZGluZyBmaWxlcyB3aXRoIFhNTEh0dHBSZXF1ZXN0XG5cdFx0c3VwcG9ydC54aHIgPSAhIXdpbmRvdy5Gb3JtRGF0YSAmJiAhIXdpbmRvdy5YTUxIdHRwUmVxdWVzdCAmJiAndXBsb2FkJyBpbiBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuXHRcdC8vIFdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgc2VsZWN0aW5nIG11bHRpcGxlIGZpbGVzIGF0IG9uY2Vcblx0XHRzdXBwb3J0Lm11bHRpcGxlID0gISF3aW5kb3cuRmlsZUxpc3QgJiYgJ211bHRpcGxlJyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXG5cdFx0Ly8gV2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBkcm9wcGluZyBmaWxlcyB0byB0aGUgZHJvcCB6b25lXG5cdFx0dmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdHN1cHBvcnQuZHJvcCA9ICdvbmRyYWdzdGFydCcgaW4gZGl2ICYmICdvbmRyb3AnIGluIGRpdiAmJiAhIXdpbmRvdy5GaWxlTGlzdDtcblxuXHRcdHJldHVybiBzdXBwb3J0O1xuXHR9KHdpbmRvdykpO1xuXG5cdC8qXG5cdCAqIERPTSBoZWxwZXJzXG5cdCAqL1xuXHRfLnBhcnNlWE1MID0gZnVuY3Rpb24gKGRhdGEpIHtcblx0XHR2YXIgeG1sLCB0bXA7XG5cdFx0aWYgKCFkYXRhIHx8IHR5cGVvZiBkYXRhICE9PSBcInN0cmluZ1wiKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdFx0dHJ5IHtcblx0XHRcdGlmICh3aW5kb3cuRE9NUGFyc2VyKSB7IC8vIFN0YW5kYXJkXG5cdFx0XHRcdHRtcCA9IG5ldyBET01QYXJzZXIoKTtcblx0XHRcdFx0eG1sID0gdG1wLnBhcnNlRnJvbVN0cmluZyhkYXRhLCBcInRleHQvaHRtbFwiKTtcblx0XHRcdH0gZWxzZSB7IC8vIElFXG5cdFx0XHRcdHhtbCA9IG5ldyBBY3RpdmVYT2JqZWN0KFwiTWljcm9zb2Z0LlhNTERPTVwiKTtcblx0XHRcdFx0eG1sLmFzeW5jID0gXCJmYWxzZVwiO1xuXHRcdFx0XHR4bWwubG9hZFhNTChkYXRhKTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHR4bWwgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdGlmICgheG1sIHx8IHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInBhcnNlcmVycm9yXCIpLmxlbmd0aCkge1xuXHRcdFx0Ly9kaXJ0eSBoYWNrIGZvciB0ZW1wbGF0ZXMgaW5zZXJ0IGZyb20gcGFnZSwgU29ycnlcblx0XHRcdHZhciBlcnIgPSB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJwYXJzZXJlcnJvclwiKTtcblx0XHRcdGVyclswXS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVyclswXSk7XG5cdFx0fVxuXHRcdC8vIGhhY2sgZm9yIGNzcyBhcHBseVxuXHRcdHZhciB0ZW1wID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHR0ZW1wLmFwcGVuZENoaWxkKHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnZGl2JylbMF0pO1xuXHRcdHJldHVybiB0ZW1wO1xuXHR9O1xuXG5cdF8ucmVwbGFjZVdpdGggPSBmdW5jdGlvbiAoZWwsIGh0bWwpIHtcblx0XHR2YXIgcGFyZW50O1xuXHRcdGlmICgocGFyZW50ID0gZWwucGFyZW50Tm9kZSkgJiYgdHlwZW9mIGh0bWwgPT09ICdvYmplY3QnKSBwYXJlbnQucmVwbGFjZUNoaWxkKGh0bWwsIGVsKTtcblx0XHRyZXR1cm4gaHRtbDtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBUZW1wIHN0b3JlIG9iamVjdFxuXHQgKi9cblx0dmFyIFN0b3JlID0ge1xuXHRcdF9zdG9yZTogW10sXG5cdFx0Z2V0OiBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHJldHVybiAgdGhpcy5fc3RvcmVbaWRdO1xuXHRcdH0sXG5cdFx0c2V0OiBmdW5jdGlvbiAoaWQsIGNvbXBvbmVudCkge1xuXHRcdFx0dGhpcy5fc3RvcmVbaWRdID0gY29tcG9uZW50O1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogIENyZWF0ZSBuZXcgdGFncyBpbiBJRSA8IDEwXG5cdCAqL1xuXHRpZiAoXy5pc0JhZElFKSB7XG5cdFx0ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcblx0XHRkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdnZW5hLXVwbG9hZCcpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBYSFIgY2xhc3Ncblx0ICpcblx0ICogQHBhcmFtIG9wdGlvbnNcblx0ICovXG5cdHZhciBYSFIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5xdWV1ZSA9IFtdO1xuXHR9O1xuXG5cdFhIUi5wcm90b3R5cGUgPSB7XG5cdFx0YWRkOiBmdW5jdGlvbiAoZmlsZXMpIHtcblx0XHRcdHRoaXMucXVldWUucHVzaChmaWxlcyk7XG5cdFx0fSxcblx0XHRcblx0XHRnZXRDb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5xdWV1ZS5sZW5ndGg7XHRcblx0XHR9LFxuXHRcdFxuXHRcdHNlbmRYSFI6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0XHRkYXRhID0gdGhpcy5xdWV1ZS5zaGlmdCgpO1xuXHRcdFx0XHRcblx0XHRcdGlmKCFkYXRhKSB7XG5cdFx0XHRcdHRoaXMueGhyID0gbnVsbDtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR2YXIgeGhyID0gdGhpcy54aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKSxcblx0XHRcdFx0cHJvZ3Jlc3MgPSBkYXRhLnByb2dyZXNzLnF1ZXJ5U2VsZWN0b3IoJy5nZnUtcHJvZ3Jlc3Mtc3RhdGUnKVxuXHRcdFx0XHRcdFxuXHRcdFx0aWYoIXByb2dyZXNzKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdDYW5cXCd0IGZpbmQgY2xhc3MgZ2Z1LXByb2dyZXNzLXN0YXRlIGZvciBwcm9ncmVzcyBiYXInKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0eGhyLnVwbG9hZC5vbnByb2dyZXNzID0gIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdHZhciBwZXJjZW50ID0gMCwgXG5cdFx0XHRcdFx0cG9zaXRpb24gPSBlLmxvYWRlZCB8fCBlLnBvc2l0aW9uLCBcblx0XHRcdFx0XHR0b3RhbCA9IGUudG90YWwgfHwgZS50b3RhbEZpbGVTaXplO1xuXG5cdFx0XHRcdGlmIChlLmxlbmd0aENvbXB1dGFibGUpIHtcblx0XHRcdFx0XHRpZihwcm9ncmVzcykge1xuXHRcdFx0XHRcdFx0cGVyY2VudCA9IE1hdGguY2VpbChwb3NpdGlvbiAvIHRvdGFsICogMTAwKTtcblx0XHRcdFx0XHRcdHByb2dyZXNzLnN0eWxlLndpZHRoID0gcGVyY2VudCsnJSc7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdC8vIFRPRE8gZXJyb3IgY2FsbGJhY2sgNDA0XG5cdFx0XHR4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRpZih0aGlzLnJlYWR5U3RhdGUgPT0gNCkge1xuXHRcdFx0XHRcdGlmKHRoaXMuc3RhdHVzID09IDIwMCkge1xuXHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0dmFyIHJlc3BvbnNlID0gSlNPTi5wYXJzZSh0aGlzLnJlc3BvbnNlKTtcblx0XHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdFx0dmFyIGVyciA9IHtcblx0XHRcdFx0XHRcdFx0XHRzdGF0dXM6ICfQntGI0LjQsdC60LAg0L7QsdGA0LDQsdC+0YLQutC4INC+0YLQstC10YLQsCcsXG5cdFx0XHRcdFx0XHRcdFx0ZGF0YTogJ9Ce0YLQstC10YIg0YHQtdGA0LLQtdGA0LA6IFsnK3RoaXMucmVzcG9uc2VUZXh0KyddJ1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Ly8gY2FsbCB1cGxvYWQgY2FsbGJhY2tcblx0XHRcdFx0XHRcdGRhdGEuY2IocmVzcG9uc2UpO1xuXHRcdFx0XHRcdFx0Ly8gY2hhbmdlIGRlbCBidXR0b24gc3RhdGVcblx0XHRcdFx0XHRcdHZhciBidG4gPSBkYXRhLnByb2dyZXNzLnF1ZXJ5U2VsZWN0b3IoJy5nZnUtcHJvZ3Jlc3MtZGVsJyk7XG5cdFx0XHRcdFx0XHRcdGJ0bi5zZXRBdHRyaWJ1dGUoJ3VwbG9hZCcsIHRydWUpXG5cdFx0XHRcdFx0XHRcdGJ0bi50ZXh0Q29udGVudCA9ICfRg9C00LDQu9C40YLRjCc7XG5cdFx0XHRcdFx0XHQvLyBzZW5kIG5leHQgZmlsZVxuXHRcdFx0XHRcdFx0c2VsZi5zZW5kWEhSKCk7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdGJ0biA9IG51bGw7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHZhciBlcnIgPSB7XG5cdFx0XHRcdFx0XHRcdHN0YXR1czogJ9Ce0YjQuNCx0LrQsCDQvtGC0LLQtdGC0LAg0YHQtdGA0LLQtdGA0LAnLFxuXHRcdFx0XHRcdFx0XHRjb2RlOiB0aGlzLnN0YXR1cyxcblx0XHRcdFx0XHRcdFx0ZGF0YTogJ9Ce0YLQstC10YIg0YHQtdGA0LLQtdGA0LA6IFsnK3RoaXMucmVzcG9uc2VUZXh0KyddJ1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR4aHIub3BlbignUE9TVCcsIGRhdGEudXJsLCB0cnVlKTtcblx0XHRcdFxuXHRcdFx0Ly8gc2V0IGFqYXggaGVhZGVyc1xuXHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoJ1gtUmVxdWVzdGVkLVdpdGgnLCAnWE1MSHR0cFJlcXVlc3QnKTtcblx0XHRcdFxuXHRcdFx0Ly8gc2V0IGN1c3RvbSBoZWFkZXJzXG5cdFx0XHRpZihkYXRhLmhlYWRlcnMgIT09IG51bGwpIHtcblx0XHRcdFx0Zm9yKHZhciBoZWFkZXIgaW4gZGF0YS5oZWFkZXJzKSB7XG5cdFx0XHRcdFx0aWYoXy5oYXNPd24oZGF0YS5oZWFkZXJzLCBoZWFkZXIpKSB7XG5cdFx0XHRcdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIGRhdGEuaGVhZGVyc1toZWFkZXJdKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gcHJlcGVuZCBhbmQgc2VuZCBkYXRhXG5cdFx0XHR2YXIgZmQgPSBuZXcgRm9ybURhdGEoKTtcblxuXHRcdFx0ZmQuYXBwZW5kKGRhdGEubmFtZSwgZGF0YS5maWxlKTtcblxuXHRcdFx0aWYoZGF0YS5kYXRhICE9PSBudWxsKSB7XG5cdFx0XHRcdGZvcih2YXIga2V5IGluIGRhdGEuZGF0YSkge1xuXHRcdFx0XHRcdGlmKF8uaGFzT3duKGRhdGEuZGF0YSwga2V5KSkge1xuXHRcdFx0XHRcdFx0ZmQuYXBwZW5kKGtleSwgZGF0YS5kYXRhW2tleV0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVx0XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdC8vIHNlbmQgZGF0YVxuXHRcdFx0eGhyLnNlbmQoZmQpO1xuXHRcdH0sXG5cdFx0c2VuZElmcmFtZTogZnVuY3Rpb24oKSB7fSxcblx0XHRcblx0XHR4aHJBYm9ydDogZnVuY3Rpb24oKXtcblx0XHRcdGlmKHRoaXMueGhyKSB7XG5cdFx0XHRcdHRoaXMueGhyLmFib3J0KCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBDcmVhdGUgVXBsb2FkZXIgY2xhc3Ncblx0ICpcblx0ICogQHBhcmFtIG9wdGlvbnNcblx0ICovXG5cdHZhciBHVSA9IHdpbmRvdy5HVSA9IGZ1bmN0aW9uICgkcm93KSB7XG5cdFx0aWYgKCEodGhpcyBpbnN0YW5jZW9mIEdVKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBHVSgkcm93KTtcbiAgICAgICAgfVxuXHRcdFxuXHRcdHRoaXMuJGZpbGUgPSAkcm93LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJmaWxlXCJdJyk7XG5cdFx0dGhpcy5wYXJhbSA9IFN0b3JlLmdldCh0aGlzLiRmaWxlLmlkKTtcblx0XHRcblx0XHQvLyBpZiBjb21wb25lbnQgd2l0aG91dCBwYXJhbXMsIGV4dGVuZCBkZWZhdWx0c1xuXHRcdGlmICghdGhpcy5wYXJhbSkge1xuXHRcdFx0dGhpcy5wYXJhbSA9IF8uZXh0ZW5kKHt9LCBHVS5kZWZhdWx0cyk7XG5cdFx0XHR0aGlzLnBhcmFtLmlkID0gdGhpcy4kZmlsZS5pZDtcblx0XHR9XG5cdFx0XG5cdFx0Ly8gZ2V0IHhoclxuXHRcdHRoaXMueGhyID0gbmV3IFhIUigpO1xuXHRcdFxuXHRcdC8vXG5cdFx0dGhpcy5jb3VudCA9IDA7XG5cdFx0dGhpcy5wcm9jZXNzQ291bnQgPSAwO1xuXHRcdHRoaXMuZmlsZXMgPSBbXTtcblx0XG5cdFx0dGhpcy5wcmVwYXJlKCRyb3cpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBEZWZpbmUgdGhlIHN0YXRpYyBwcm9wZXJ0aWVzIG9mIFVwbG9hZGVyXG5cdCAqL1xuXHQkLmV4dGVuZChHVSwge1xuXHRcdC8qKlxuXHRcdCAqIERlZmF1bHQgdmFsdWVzXG5cdFx0ICovXG5cdFx0ZGVmYXVsdHM6IHtcblx0XHRcdC8vIGlkIG9mIGNvbXBvbmVudFxuXHRcdFx0aWQ6IG51bGwsXG5cdFx0XHQvLyBOYW1lIG9mIHRoZSBmaWxlIGlucHV0XG5cdFx0XHRuYW1lOiAnZmlsZXMnLFxuXG5cdFx0XHQvLyBEZWZhdWx0IGxhYmVsIHRleHRcblx0XHRcdHRleHQ6ICfQl9Cw0LPRgNGD0LfQuNGC0Ywg0YTQsNC50LsnLFxuXG5cdFx0XHQvLyBXaGV0aGVyIHNlbGVjdGluZyBtdWx0aXBsZSBmaWxlcyBhdCBvbmNlIGluIGFsbG93ZWRcblx0XHRcdG11bHRpcGxlOiB0cnVlLFxuXG5cdFx0XHQvLyBEaXNhYmxlIGlucHV0ICBpZiB0aGUgbnVtYmVyIG9mIGZpbGVzIGlzIHRoZSBtYXhpbXVtIG51bWJlciBvZiB1cGxvYWRlZCBmaWxlcyBvciByZXF1aXJlZCBieSB0aGUgbG9naWNcblx0XHRcdGRpc2FibGVkOiBmYWxzZSxcblxuXHRcdFx0Ly8gVGhlIG1heGltdW0gbnVtYmVyIG9mIGZpbGVzIHRoZSB1c2VyIGNhbiB1cGxvYWQgKGJ5IGRlZmF1bHQgdGhlcmUgaXMgbm8gbGltaXQpXG5cdFx0XHRtYXhGaWxlczogbnVsbCxcblxuXHRcdFx0Ly8gVGhlIG1heGltdW0gc2l6ZSBvZiBmaWxlcyB0aGUgdXNlciBjYW4gdXBsb2FkIChieSBkZWZhdWx0IHRoZXJlIGlzIG5vIGxpbWl0KVxuXHRcdFx0bWF4U2l6ZTogbnVsbCxcblxuXHRcdFx0Ly8gV2hldGhlciB0byBhdXRvbWF0aWNhbGx5IHVwbG9hZCBmaWxlcyBhZnRlciB0aGV5IHdlcmUgc2VsZWN0ZWRcblx0XHRcdGF1dG9TdGFydDogdHJ1ZSxcblxuXHRcdFx0Ly8gUmVxdWlyZWQgZmllbGQgaW4gdGhlIGZvcm0gKGJ5IGRlZmF1bHQgcmVxdWlyZWQpXG5cdFx0XHRyZXF1aXJlZDogZmFsc2UsXG5cblx0XHRcdC8vIEFycmF5IG9mIHRoZSBhY2NlcHRlZCBmaWxlIHR5cGVzLCBleC4gWydhcHBsaWNhdGlvbi94LWNkLWltYWdlJ10gKGJ5IGRlZmF1bHQgYWxsIHR5cGVzIGFyZSBhY2NlcHRlZClcblx0XHRcdGFjY2VwdFR5cGU6IG51bGwsXG5cblx0XHRcdC8vIEFycmF5IG9mIHRoZSBhY2NlcHRlZCBmaWxlIHR5cGVzLCBleC4gWydqcGcnLCAnanBlZycsICdwbmcnXSAoYnkgZGVmYXVsdCBhbGwgdHlwZXMgYXJlIGFjY2VwdGVkKVxuXHRcdFx0YWNjZXB0RXh0ZW5zaW9uOiBudWxsLFxuXG5cdFx0XHQvLyBQbGFjZSB3aGVyZSBwdXQgcHJvZ3Jlc3MgYmFyLiBDbGFzcyAuZ2Z1LXByb2dyZXNzLWJveFxuXHRcdFx0cHJvZ3Jlc3NCb3g6IGZhbHNlLFxuXG5cdFx0XHQvLyBBZGRpdGlvbmFsIGRhdGEgdG8gc2VuZCB3aXRoIHRoZSBmaWxlc1xuXHRcdFx0ZGF0YTogbnVsbCxcblxuXHRcdFx0Ly8gQWRkaXRpb25hbCBoZWFkZXJzIHRvIHNlbmQgd2l0aCB0aGUgZmlsZXMgKG9ubHkgZm9yIGFqYXggdXBsb2Fkcylcblx0XHRcdGhlYWRlcnM6IG51bGwsXG5cblx0XHRcdC8vIFVwbG9hZCBzdWNjZXNzIGNhbGxiYWNrXG5cdFx0XHRzdWNjZXNzOiBmdW5jdGlvbiAoKSB7fSxcblxuXHRcdFx0Ly8gVXBsb2FkIGZhaWwgY2FsbGJhY2tcblx0XHRcdGZhaWw6IGZ1bmN0aW9uICgpIHt9LFxuXG5cdFx0XHQvLyBUaGUgdXJsIHRvIHVwbG9hZCB0aGUgZmlsZXMgdG9cblx0XHRcdHVybDogZG9jdW1lbnQuVVJMLFxuXG5cdFx0XHQvLyBUaGUgdXJsIHRvIHJlbW92ZSB0aGUgZmlsZXNcblx0XHRcdHJlbW92ZVVybDogbnVsbCxcblxuXHRcdFx0Ly8gRXJyb3IgbWVzc2FnZXNcblx0XHRcdGVycm9yczoge1xuXHRcdFx0XHRtYXhGaWxlczogJ9Cf0YDQtdCy0YvRiNC10L3QvdC+INC60L7Qu9C70LjRh9C10YHQstC+INGE0LDQudC70L7QsiA8fm1heEZpbGVzfj4g0LLQvtC30LzQvtC20L3Ri9GFINC00LvRjyDQt9Cw0LPRgNGD0LfQutC4IScsXG5cdFx0XHRcdG1heEZpbGVzU2VsZWN0OiAn0JzQvtC20L3QviDQstGL0LHRgNCw0YLRjCDQtdGJ0LUgPH5maWxlQ291bnR+PiDRhNCw0LnQuy/RhNCw0LnQu9C+0LInLFxuXHRcdFx0XHRtYXhTaXplOiAn0KDQsNC30LzQtdGAINGE0LDQudC70LAgPH5maWxlTmFtZX4+INC/0YDQtdCy0YvRgdC40Lsg0LzQsNC60YHQuNC80LDQu9GM0L3Ri9C5INGA0LDQt9C80LXRgCA8fm1heFNpemV+PiBNYicsXG5cdFx0XHRcdGludmFsaWRUeXBlOiAn0J3QtdCy0LXRgNC90YvQuSDRgtC40L8g0YTQsNC50LvQsCA8fmZpbGVOYW1lfj4uINCU0LvRjyDQt9Cw0LPRgNGD0LfQutC4INGA0LDQt9GA0LXRiNC10L3RizogPH5maWxlVHlwZX4+Jyxcblx0XHRcdFx0aW52YWxpZEV4dGVuc2lvbjogJ9Cd0LXQstC10YDQvdC+0LUg0YDQsNGB0YjQuNGA0LXQvdC40LUg0YTQsNC50LvQsCA8fmZpbGVOYW1lfj4uINCg0LDQt9GA0LXRiNC10L3RiyDRgdC70LXQtNGD0Y7RidC40LU6IDx+ZmlsZUV4dGVuc2lvbn4+J1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Ly8gZGVmYXVsdCB0ZW1wbGF0ZXNcblx0XHR0ZW1wbGF0ZXM6IHtcblx0XHRcdGlucHV0OiBbJzxkaXYgY2xhc3M9XCJnZnUtd3JhcFwiPicsXG5cdFx0XHRcdFx0XHQnPGxhYmVsIGZvcj1cIjx+aWR+PlwiIGNsYXNzPVwiZ2Z1LWxhYmVsXCI+Jyxcblx0XHRcdFx0XHRcdFx0JzxzcGFuIGNsYXNzPVwiZ2Z1LXRleHRcIj48L3NwYW4+Jyxcblx0XHRcdFx0XHRcdFx0JzxpbnB1dCB0eXBlPVwiZmlsZVwiIGlkPVwiPH5pZH4+XCIgY2xhc3M9XCJnZnUtaW5wdXRcIiAvPicsXG5cdFx0XHRcdFx0XHQnPC9sYWJlbD4nLFxuXHRcdFx0XHRcdCc8L2Rpdj4nXS5qb2luKCcnKSxcblxuXHRcdFx0cHJvZ3Jlc3M6IFsnPGRpdiBjbGFzcz1cImdmdS1yb3ctcHJvZ3Jlc3NcIj4nLFxuXHRcdFx0XHRcdFx0XHQnPHVsIGNsYXNzPVwiZ2Z1LXByb2dyZXNzLWluZm9cIj4nLFxuXHRcdFx0XHRcdFx0XHRcdCc8bGkgY2xhc3M9XCJnZnUtcHJvZ3Jlc3MtbmFtZVwiPjx+bmFtZX4+PC9saT4nLFxuXHRcdFx0XHRcdFx0XHRcdCc8bGkgY2xhc3M9XCJnZnUtcHJvZ3Jlc3Mtc2l6ZVwiPjx+c2l6ZX4+IE1iPC9saT4nLFxuXHRcdFx0XHRcdFx0XHQnPC91bD4nLFxuXHRcdFx0XHRcdFx0XHQnPGEgaHJlZj1cIiNcIiBjbGFzcz1cImdmdS1wcm9ncmVzcy1kZWxcIj7QvtGC0LzQtdC90LjRgtGMPC9hPicsXG5cdFx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiZ2Z1LXByb2dyZXNzLXN0YXRlXCI+PC9kaXY+Jyxcblx0XHRcdFx0XHRcdCc8L2Rpdj4nXS5qb2luKCcnKVxuXHRcdH0sXG5cdFx0Ly8gZXh0ZW5kIGN1c3RvbSBvcHRpb25zIGZyb20gY29tcG9uZW50XG5cdFx0ZXh0ZW5kOiBmdW5jdGlvbiAob2JqKSB7XG5cdFx0XHRTdG9yZS5zZXQob2JqLmlkLCBfLmV4dGVuZCh7fSwgR1UuZGVmYXVsdHMsIG9iaikpO1xuXHRcdH1cblx0fSk7XG5cblx0LyoqXG5cdCAqIERlZmluZSB0aGUgbWV0aG9kc1xuXHQgKi9cblx0R1UucHJvdG90eXBlID0ge1xuXHRcdHByZXBhcmU6IGZ1bmN0aW9uKCRyb3cpIHtcblx0XHRcdC8vc2V0IGxhYmVsIHRleHRcblx0XHRcdCRyb3cucXVlcnlTZWxlY3RvcignLmdmdS10ZXh0JykudGV4dENvbnRlbnQgPSB0aGlzLnBhcmFtLnRleHQ7XG5cblx0XHRcdC8vIGNvbmZpZyBpbnB1dFxuXHRcdFx0dGhpcy4kZmlsZS5kaXNhYmxlZCA9IHRoaXMucGFyYW0uZGlzYWJsZWQ7XG5cdFx0XHR0aGlzLiRmaWxlLm5hbWUgPSB0aGlzLnBhcmFtLm5hbWU7XG5cdFx0XHR0aGlzLiRmaWxlLnJlcXVpcmVkID0gdGhpcy5wYXJhbS5yZXF1aXJlZDtcblxuXHRcdFx0aWYgKF8uc3VwcG9ydC5tdWx0aXBsZSkge1xuXHRcdFx0XHR0aGlzLiRmaWxlLm11bHRpcGxlID0gdGhpcy5wYXJhbS5tdWx0aXBsZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gcHJvZ3Jlc3MgYmFyIHBsYWNlXG5cdFx0XHRpZih0aGlzLnBhcmFtLnByb2dyZXNzQm94KSB7XG5cdFx0XHRcdHRoaXMucHJvZ3Jlc3NCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZ2Z1LXByb2dyZXNzLWJveCcpO1xuXHRcdFx0XHRcblx0XHRcdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtZ2Z1LWJ0bj0nK3RoaXMucGFyYW0uaWQrJ10nKVxuXHRcdFx0XHRcdFx0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRcdFx0XHRpZihlKSBlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0XHRcdGlmKHRoaXMucHJvY2Vzc0NvdW50ID4gMCkge1xuXHRcdFx0XHRcdFx0XHQvLyBkaXNhYmxlIGlucHV0XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zZW5kKCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKSwgZmFsc2UpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5wcm9ncmVzc0JveCA9ICRyb3cucXVlcnlTZWxlY3RvcignLmdmdS1wcm9ncmVzcycpIHx8ICRyb3c7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGFkZCBjaGFuZ2UgaGFuZGxlclxuXHRcdFx0dGhpcy4kZmlsZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLm9uQ2hhbmdlLmJpbmQodGhpcyksIGZhbHNlKTtcblx0XHR9LFxuXHRcdFxuXHRcdG9uQ2hhbmdlOiBmdW5jdGlvbihlKSB7XG5cdFx0XHR2YXIgZmlsZXMgPSBlLnRhcmdldC5maWxlcyA9PT0gdW5kZWZpbmVkIFxuXHRcdFx0XHRcdD8gKGUudGFyZ2V0ICYmIGUudGFyZ2V0LnZhbHVlIFxuXHRcdFx0XHRcdCAgID8gW3sgbmFtZTogZS50YXJnZXQudmFsdWUucmVwbGFjZSgvXi4rXFxcXC8sICcnKX1dIFxuXHRcdFx0XHRcdCAgIDogW10pIFxuXHRcdFx0XHRcdDogZS50YXJnZXQuZmlsZXM7XG5cdFx0XHRcblx0XHRcdGZpbGVzID0gc2xpY2UuY2FsbChmaWxlcyk7XG5cdFx0XHRcblx0XHRcdC8vIHRyeSB2YWxpZGF0ZSBlYWNoIGZpbGVcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHRoaXMudmFsaWRhdGUoZmlsZXMpO1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdC8vYWRkIGV2ZW50IGhhbmRsZXJcblx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcblx0XHRcdFx0ZS50YXJnZXQudmFsdWUgPSBudWxsO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdC8vIHRvdGFsIGZpbGUgY291bnRcblx0XHRcdHRoaXMuY291bnQgPSB0aGlzLmNvdW50ICsgZmlsZXMubGVuZ3RoO1xuXHRcdFx0dGhpcy5maWxlcyA9IHRoaXMuZmlsZXMuY29uY2F0KGZpbGVzKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5iZWZvcmVTZW5kKCk7XG5cdFx0XHRlLnRhcmdldC52YWx1ZSA9IG51bGw7XG5cdFx0fSxcblx0XHRcblx0XHRiZWZvcmVTZW5kOiBmdW5jdGlvbigpIHtcblx0XHRcdGlmKF8uc3VwcG9ydC54aHIpIHtcblx0XHRcdFx0dmFyIHNlbmRGaWxlO1xuXHRcdFx0XHR3aGlsZShzZW5kRmlsZSA9IHRoaXMuZmlsZXMuc2hpZnQoKSkge1xuXHRcdFx0XHRcdHZhciBpdGVtID0ge1xuXHRcdFx0XHRcdFx0ZmlsZTogc2VuZEZpbGUsIFxuXHRcdFx0XHRcdFx0dXJsOiB0aGlzLnBhcmFtLnVybCwgXG5cdFx0XHRcdFx0XHRoZWFkZXJzOiB0aGlzLnBhcmFtLmhlYWRlcnMsXG5cdFx0XHRcdFx0XHRkYXRhOiB0aGlzLnBhcmFtLmRhdGEsXG5cdFx0XHRcdFx0XHRuYW1lOiB0aGlzLnBhcmFtLm5hbWUsXG5cdFx0XHRcdFx0XHRwcm9ncmVzczogdGhpcy5nZXRQcm9ncmVzcyhzZW5kRmlsZS5uYW1lLCBzZW5kRmlsZS5zaXplKSwgXG5cdFx0XHRcdFx0XHRjYjogdGhpcy5vbkNhbGxiYWNrLmJpbmQodGhpcylcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHRoaXMueGhyLmFkZChpdGVtKTtcblx0XHRcdFx0XHR0aGlzLnByb2Nlc3NDb3VudCsrO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XG5cdFx0XHR9XG5cdFx0XG5cdFx0XHRpZiAodGhpcy5wYXJhbS5hdXRvU3RhcnQpIHtcblx0XHRcdFx0dGhpcy5zZW5kKCk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRcblx0XHRnZXRQcm9ncmVzczogZnVuY3Rpb24gKG5hbWUsIHNpemUpIHtcblx0XHRcdHZhciAkcHJvZ3Jlc3MgPSBfLnRlbXBsYXRlKEdVLnRlbXBsYXRlcy5wcm9ncmVzcywge1xuXHRcdFx0XHRuYW1lOiBuYW1lLFxuXHRcdFx0XHRzaXplOiBNYXRoLmNlaWwoKHNpemUgLyAxMDI0KSAvIDEwMjQpXG5cdFx0XHR9KTtcblx0XHRcdFxuXHRcdFx0JHByb2dyZXNzID0gXy5wYXJzZVhNTCgkcHJvZ3Jlc3MpLmZpcnN0Q2hpbGQ7XG5cdFx0XHRcblx0XHRcdCRwcm9ncmVzc1xuXHRcdFx0XHQucXVlcnlTZWxlY3RvcignLmdmdS1wcm9ncmVzcy1kZWwnKVxuXHRcdFx0XHQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0aWYoZSkgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdHZhciBzdGF0ZSA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgndXBsb2FkJyk7XG5cblx0XHRcdFx0XHQvLyBpZiBmaWxlIHVwbG9hZCBpbiBwcm9ncmVzc1xuXHRcdFx0XHRcdGlmKHN0YXRlID09PSBudWxsKSB7XG5cdFx0XHRcdFx0XHQvLyBhYm9ydCB1cGxvYWQgcmVxdWVzdFxuXHRcdFx0XHRcdFx0dGhpcy54aHIueGhyQWJvcnQoKTtcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR0aGlzLm9uQ2FsbGJhY2soKTtcblx0XHRcdFx0XHRcdC8vIHNlbmQgbmV4dCBmaWxlIGlmIGl0IGV4aXN0XG5cdFx0XHRcdFx0XHRpZih0aGlzLnhoci5nZXRDb3VudCgpKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuc2VuZCgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLmNvdW50LS07XG5cdFx0XHRcdFx0XHQvLyBhZGQgdW5kaXNhYmxlIGlucHV0XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0JHByb2dyZXNzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoJHByb2dyZXNzKTtcblx0XHRcdFx0fS5iaW5kKHRoaXMpLCBmYWxzZSk7XG5cdFx0XHRcblx0XHRcdHJldHVybiB0aGlzLnByb2dyZXNzQm94LmFwcGVuZENoaWxkKCRwcm9ncmVzcyk7XG5cdFx0fSxcblx0XHRcblx0XHRzZW5kOiBmdW5jdGlvbigpIHtcblx0XHRcdGlmKF8uc3VwcG9ydC54aHIpIHtcblx0XHRcdFx0dGhpcy54aHIuc2VuZFhIUigpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy54aHIuc2VuZElmcmFtZSh0aGlzLiRmaWxlKTtcblx0XHRcdFx0fVxuXHRcdH0sXG5cdFx0XG5cdFx0b25DYWxsYmFjazogZnVuY3Rpb24ocmVzcCkge1xuXHRcdFx0XG5cdFx0XHQvLyBhZGQgZmlsZSBzdWNjc2VjYyB1cGxvYWQgZXZlbnRcblx0XHRcdGlmKC0tdGhpcy5wcm9jZXNzQ291bnQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpZiAodGhpcy5wYXJhbS5tYXhGaWxlcyA9PT0gbnVsbCB8fCB0aGlzLmNvdW50IDwgdGhpcy5wYXJhbS5tYXhGaWxlcykge1xuXHRcdFx0XHRjb25zb2xlLmxvZygndW5kaXNhYmxlJylcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gY2FsbGJhY2sgYWxsIGZpbGVzIHVwbG9hZFxuXHRcdH0sXG5cdFx0XG5cdFx0dmFsaWRhdGU6IGZ1bmN0aW9uKGZpbGVzKSB7XG5cdFx0XHR2YXIgcGFyYW0gPSB0aGlzLnBhcmFtLFxuXHRcdFx0XHRlcnJvcnMgPSBwYXJhbS5lcnJvcnMsXG5cdFx0XHRcdGxlbmd0aCA9IGZpbGVzLmxlbmd0aCxcblx0XHRcdFx0Y291bnQgPSB0aGlzLmNvdW50ICsgbGVuZ3RoO1xuXG5cdFx0XHRpZihwYXJhbS5tYXhGaWxlcyAhPT0gbnVsbCAmJiBwYXJhbS5tYXhGaWxlcyA8IGxlbmd0aCkge1xuXHRcdFx0XHR2YXIgZXJyID0gXy50ZW1wbGF0ZShlcnJvcnMubWF4RmlsZXMsIHBhcmFtLm1heEZpbGVzKTtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGVycik7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGlmKHBhcmFtLm1heEZpbGVzICE9PSBudWxsICYmIHBhcmFtLm1heEZpbGVzIDwgY291bnQpIHtcblx0XHRcdFx0dmFyIHRvdGFsID0gcGFyYW0ubWF4RmlsZXMgLSB0aGlzLmNvdW50O1xuXHRcdFx0XHR2YXIgZXJyID0gXy50ZW1wbGF0ZShlcnJvcnMubWF4RmlsZXNTZWxlY3QsIHtcblx0XHRcdFx0XHRmaWxlQ291bnQ6IHRvdGFsLnRvU3RyaW5nKClcblx0XHRcdFx0fSk7XG5cdFx0XHRcdFxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0W10uZm9yRWFjaC5jYWxsKGZpbGVzLCBmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRcdC8vIHZhbGlkYXRlIHNpemVcblx0XHRcdFx0aWYgKHBhcmFtLm1heFNpemUgIT09IG51bGwgJiYgKChmaWxlLnNpemUgLyAxMDI0KSAvIDEwMjQgPiBwYXJhbS5tYXhTaXplKSkge1xuXHRcdFx0XHRcdHZhciBlcnIgPSBfLnRlbXBsYXRlKGVycm9ycy5tYXhTaXplLCB7XG5cdFx0XHRcdFx0XHRmaWxlTmFtZTogZmlsZS5uYW1lLCBcblx0XHRcdFx0XHRcdG1heFNpemU6IHBhcmFtLm1heFNpemUudG9TdHJpbmcoKVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihlcnIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyB2YWxpZGF0ZSB0eXBlXG5cdFx0XHRcdGlmIChwYXJhbS5hY2NlcHRFeHRlbnNpb24gIT09IG51bGwpIHtcblx0XHRcdFx0XHR2YXIgZXh0ID0gZmlsZS5uYW1lLnRvTG9jYWxlTG93ZXJDYXNlKCkuc3BsaXQoJy4nKVsxXTtcblx0XHRcdFx0XHRpZiAoIX5wYXJhbS5hY2NlcHRFeHRlbnNpb24uaW5kZXhPZihleHQpKSB7XG5cdFx0XHRcdFx0XHR2YXIgZXJyID0gXy50ZW1wbGF0ZShlcnJvcnMuaW52YWxpZEV4dGVuc2lvbiwge1xuXHRcdFx0XHRcdFx0XHRmaWxlTmFtZTogZmlsZS5uYW1lLCBcblx0XHRcdFx0XHRcdFx0ZmlsZUV4dGVuc2lvbjogcGFyYW0uYWNjZXB0RXh0ZW5zaW9uLmpvaW4oJywgJylcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdC8vIHZhbGlkYXRlIHR5cGVcblx0XHRcdFx0aWYgKHBhcmFtLmFjY2VwdFR5cGUgIT09IG51bGwgJiYgIX5wYXJhbS5hY2NlcHRUeXBlLmluZGV4T2YoZmlsZS50eXBlKSkge1xuXHRcdFx0XHRcdHZhciBlcnIgPSBfLnRlbXBsYXRlKGVycm9ycy5pbnZhbGlkVHlwZSwge1xuXHRcdFx0XHRcdFx0XHRmaWxlTmFtZTogZmlsZS5uYW1lLCBcblx0XHRcdFx0XHRcdFx0ZmlsZVR5cGU6IHBhcmFtLmFjY2VwdFR5cGUuam9pbignLCAnKVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBET00gcmVhZHksIGxldHMgYmVnaW5cblx0ICovXG5cdCQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY29tcG9uZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2dlbmEtdXBsb2FkJyk7XG5cblx0XHRbXS5mb3JFYWNoLmNhbGwoY29tcG9uZW50cywgZnVuY3Rpb24gKGNvbXBvbmVudCkge1xuXHRcdFx0dmFyIHRlbXBsYXRlID0gY29tcG9uZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXJlbD1cImlucHV0XCJdJyk7XG5cdFx0XG5cdFx0XHQvLyBnZXQgdGVtcGxhdGVcblx0XHRcdHRlbXBsYXRlID0gXy50ZW1wbGF0ZShcblx0XHRcdFx0dGVtcGxhdGUubGVuZ3RoIFxuXHRcdFx0XHRcdD8gdGVtcGxhdGVbMF0uaW5uZXJIVE1MXG5cdFx0XHRcdFx0OiBHVS50ZW1wbGF0ZXMuaW5wdXRcblx0XHRcdFx0LCBjb21wb25lbnQuaWQpO1xuXHRcdFx0XG5cdFx0XHQvLyBtYWtlIERPTSBvYmplY3Rcblx0XHRcdHRlbXBsYXRlID0gXy5wYXJzZVhNTCh0ZW1wbGF0ZSkuZmlyc3RDaGlsZDtcblx0XHRcdC8vIHJlcGxhY2Vcblx0XHRcdF8ucmVwbGFjZVdpdGgoY29tcG9uZW50LCB0ZW1wbGF0ZSk7XG5cdFx0XHRcblx0XHRcdEdVKHRlbXBsYXRlLCBjb21wb25lbnQuaWQpO1xuXHRcdH0pO1xuXHR9KTtcblxufSkoalF1ZXJ5LCBkb2N1bWVudCwgd2luZG93KTsiXX0=
