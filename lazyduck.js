/**
 * Radio / Check can use array of values
 * $("#select").setV('A'); sets its value to A
 * input, select, textarea All
 **/
$.fn.setV = function(value, byForce) {
	var self = this;

	// -- Invalid selector
	if(0 == self.length) {
		return false;
	}

	// -- Stop set it!
	var readonly = self.attr('readonly');
	var disabled = self.attr('disabled');

	if(readonly || disabled) {
		if(!byForce)
			return false;
	}

	var tagName = self.get(0).tagName.toLowerCase();
	var type = tagName;

	if('input' == tagName)
		type = self.attr("type");

	if('hidden' == type || 'text' == type || 'textarea' == type || 'date' == type) {
		self.val(value);
		return true;
	} else if('select' == type) {
		var selected = false;
		self.val(value);

		self.find('option').each(function() {
			var selfOption = $(this);
			var isSame = value == selfOption.val();
			selfOption.attr('selected', isSame);

			if(true === isSame) {
				selected = true;
			}
		});

		return selected;
	} else if('radio' == type || 'checkbox' == type) {
		var checked = false;
		self.each(function() {
			var selfChk = $(this);
			var isSame = false;
			if('object' == typeof value) {
				// -- Testing I dont know why I did toString() here
				//isSame = (-1 != _.indexOf(value.toString(), selfChk.val())); // -- Find it from the list
				isSame = (-1 != _.indexOf(value, selfChk.val())); // -- Find it from the list
			} else {
				isSame = (value == selfChk.val());
			}

			if(true === isSame) {
				checked = true;
			}

			selfChk.prop('checked', isSame);
		});

		return checked;
	}

	return false;
};

/**
 * { k : key, v: value }
 * false
 * v can be undefined
 * singular : hidden, text, textarea, select, radio
 * plurals : checkbox
 */
$.fn.getV = function(byForce) {
	var self = this;

	// -- Invalid selector
	if(0 == self.length) {
		return false;
	}

	var tagName = self.get(0).tagName.toLowerCase();
	var name = self.attr('name');
	var value = false;
	var type = tagName;
	var dataType = self.attr('data-type');

	if('input' == tagName)
		type = self.attr("type");

	var disabled = self.attr('disabled');
	if(!disabled || byForce) {
		if ('hidden' == type || 'text' == type || 'textarea' == type || 'select' == type) {
			value = self.val();
		} else if ('radio' == type) {
			for(var i = 0; i < self.length; i ++) {
				var item = self.get(i);

				item = $(item);

				// -- DataType update
				if(item.attr('data-type')) {
					dataType = item.attr('data-type');
				}

				if(item.is(":checked")) {
					value = item.attr('value');
					break;
				}
			}
		} else if ('checkbox' == type) {
			value = [];
			self.each(function() {
				var item = $(this);

				// -- DataType update
				if(item.attr('data-type')) {
					dataType = item.attr('data-type');
				}

				if(item.is(":checked")) {
					value.push(item.attr('value'));
				}
			});
		}
	}

	// -- DataType Parse
	if(dataType && value) {
		if(_.isObject(value)) {
			_.each(value, function(v, k) {
				if('int' == dataType) {
					v = parseInt(v);
				} else if('float' == dataType) {
					v = parseFloat(v);
				} else if('boolean' == dataType) {
					v = eval(v);
				}

				value[k] = v;
			});
		} else {
			if ('int' == dataType) {
				value = parseInt(value);
			} else if ('float' == dataType) {
				value = parseFloat(value);
			} else if ('boolean' == dataType) {
				value = eval(value);
			}
		}
	}

	return {
		k: name,
		v: value
	};
};

/**
 * Get Value form
 * var page = $("#form").getVF('page');
 *
 **/
$.fn.getVF = function(name, byForce) {
	var found = this.find('[name="' + name + '"]');
	var result = found.getV(byForce);
	if(result)
		return result.v;

	return false;
};

/**
 * Get Object from child with name
 * var pageObj = $("#form").getF('page');
 **/
$.fn.getF = function(name) {
	var found = this.find('[name="' + name + '"]');
	return found;
};

/**
 * Set value form
 * $("#form").setVF('page', 10);
 **/
$.fn.setVF = function(name, value) {
	var found = this.find('[name="' + name + '"]');
	if(0 == found.length) {
		// -- Create one
		var hidden = String.format('<input type="hidden" name="{0}" value="{1}" />', name, value);
		this.append(hidden);
	} else {
		found.setV(value);
	}
};

/**
 * Validate input's pattern and title attribute
 */
$.fn.validateInputPattern = function() {
	var me = $(this);
	var name = me.attr('name');
	var regex = me.attr('pattern');
	var title = me.attr('title');
	var value = me.val();
	var required = me.attr('required');

	var ret = {
		success: true,
		message: 'Success',
		jqObj: me
	};

	// -- Pattern, title
	if(regex && 0 < regex.length) {
		try {
			regex = new RegExp(regex);
		} catch(e) {
			ret.success = false;
			ret.message = name + ' : invalid pattern ' + e;
			return ret;
		}

		var result = regex.exec(value);

		if(null == result || result[0] != result.input) {
			if(!title || 0 == title.length)
				title = name + ' : invalid input! ' + me.attr('pattern');

			ret.success = false;
			ret.message = title;
			return ret;
		}
	}

	// -- Required, title
	if(required && 0 < required.length && 0 == value.length) {
		if(!title || 0 == title.length)
			title = name + ' : required but empty';

		ret.success = false;
		ret.message = title;

		return ret;
	}

	return ret;
};

$.fn.toJSON = function(validate, includeEmpty) {
	var jq = this;

	// -- Result
	var obj = {};
	var multipart = false;

	// -- validate Default true
	if(_.isUndefined(validate)) {
		validate = true;
	}

	// -- Multipart Check
	var enctype = jq.attr('enctype');
	if(enctype && 0 < enctype.length) {
		multipart = true;
	}

	jq.find("input, select, textarea").each(function() {
		// -- Just Copy it
		var self = $(this);
		var tagName = self.get(0).tagName.toLowerCase();
		var type = tagName;
		if('input' == tagName)
			type = self.attr("type");
		var name = self.attr("name");

		// -- disabled / submit Ignore
		if(self.attr("disabled") || 'submit' == type)
			return;

		var save = true;
		// -- Filter condition
		if('checkbox' == type || 'radio' == type) {
			if(!self.is(":checked")) {
				save = false;
			}
		} else if(validate && ('text' == type || 'select' == type || 'textarea' == type)) {
			var pResult = self.validateInputPattern();
			if (!pResult.success) {
				alert(pResult.message);
				pResult.jqObj.focus();
				obj = false;
				return false;
			}
		} else if('hidden' == type) {
			save = true;
		}

		// -- Ignored to save
		if(!save) {
			return;
		}

		// -- Values
		var val = self.val();
		if((val && 0 < val.length && typeof(name) != 'undefined') || includeEmpty) {

			// -- [] as array type
			if(-1 != name.indexOf('[]')) {
				name = name.replace('[]', '');

				// -- Multipart separator : ,
				if(multipart) {
					val = encodeURIComponent(val);
				}

				var arr = obj[name];
				if(arr)
					arr.push(val);
				else {
					arr = [val];
					obj[name] = arr;
				}
			} else {
				// -- Normal
				obj[name] = val;
			}

		}
	});

	return obj;
};

/**
 * Easy access to the JQ Object
 * var form = new LDForm($("#form");
 * form.debug(); // -- to see the list of properties
 * form.page = 10;
 * form.pageObj.attr('disabled', true);
 * form.obj.submitAjaxV1(function(success, data) {} ); // to Access JQObject
 *
 * // -- JQ Version
 * var form = $("#form").LDForm();
 *
 * @param JQObj
 * @constructor
 */
var LDForm = function(JQObj) {
	this.obj = null;

	this.listNames = [];

	if(JQObj)
		this.invoke(JQObj);
};

LDForm.prototype.invoke = function(JQObj) {
	var me = this;
	this.obj = JQObj;

	if(this.obj) {
		this.obj.find('input, select, textarea').each(function() {
			var self = $(this);
			var name = self.attr('name');

			// -- Ignore
			if(_.isEmpty(name))
				return;

			// -- Define getter / setter
			me.addProp(name);
		});

		// -- Where class = LD, provide easy access with 'nameObj' like img / div tag
		this.obj.find('.LD').each(function() {
			var self = $(this);
			var name = self.attr('name');

			// -- Ignore
			if(_.isEmpty(name))
				return;

			// -- Define getter / setter
			me.addProp(name);
		});
	}
};

// -- Define getter / setter, I dont know how to delete it!
LDForm.prototype.addProp = function(name) {
	// -- Duplicated - Radio / Checkbox can
	if(-1 != _.indexOf(this.listNames, name))
		return false;

	// -- Define getter / setter - Value
	Object.defineProperty(this, name, {
		get: function() {
			return this.obj.getVF(name);
		},
		set: function(value) {
			return this.obj.setVF(name, value);
		}
	});

	var nameObj = name + "Obj";
	// -- Define getter - JQObject
	Object.defineProperty(this, nameObj, {
		get: function() {
			return this.obj.getF(name);
		}
	});

	// -- Save names
	this.listNames.push(name);

	return true;
};

// -- Clear the values
LDForm.prototype.clear = function() {
	this.obj.find('input, textarea, select').each(function() {
		var self = $(this);
		var type = self.attr('type');

		if('submit' != type) {
			self.val('');
		}
	});
};

// -- Submit object
LDForm.prototype.submit = function() {
	if(this.obj) {
		this.obj.submit();
	} else {
		console.error("invalid JQObject");
	}
};

LDForm.prototype.debug = function() {
	console.log(this.listNames);
};

// -- Creates LDForm object from this object
$.fn.LDForm = function() {
	var ldForm = new LDForm(this);
	return ldForm;
};

var LDArea = function(JQObj) {
	this.obj = null;
	this.dataSource = null;
	this.onItemCB = null;

	this.ATTR_TEMPLATE = 'data-template';

	/**
	 * item : list item or data template
	 * error : error template
	 * @type {{}}
	 */
	this.template = {};

	if(JQObj)
		this.invoke(JQObj);
};

LDArea.prototype.invoke = function(JQObj) {
	var me = this;
	this.obj = JQObj;

	var strTemplate = this.obj.attr(this.ATTR_TEMPLATE);
	if(!strTemplate) {
		console.info("Template is not set when area is initializing");
		return false;
	}

	// -- Template as Array or Object
	var firstStr = strTemplate[0];
	if('{' == firstStr) {
		this.template = JSON.parse(strTemplate);

	} else if('[' == firstStr) {
		/*
		 * Order
		 * [0] : item
		 * [1] : empty
		 */
		var t = JSON.parse(strTemplate);
		this.template.item = t[0];
		this.template.empty = t[1];
	} else {
		// -- Just as template item
		this.template.item = strTemplate;
	}

	_.each(this.template, function(selector, key) {
		me.template[key] = _.template($(selector).html());
	});
};

/**
 * Where data is object
 * getPage()
 * getList()
 * getData()
 * isEmpty()
 * @param data
 */
LDArea.prototype.setDataSource = function(data, doNotRender, cbOnItem) {
	this.dataSource = data;

	if(cbOnItem) {
		this.setOnItem(cbOnItem);
	}

	if(true !== doNotRender) {
		this.render();
	}
};

/**
 * Clear the whole child
 * @returns {boolean}
 */
LDArea.prototype.clear = function() {
	if(!this.obj) {
		console.error("LDArea.clear : obj is empty");
	}

	this.obj.empty();
	return true;
};

/**
 * Internal / externalfunction
 * clear + add with html
 * @param html
 */
LDArea.prototype.set = function(html) {
	this.clear();
	this.add(html);
};

/**
 * Internal / external function
 * add only
 * @param html
 */
LDArea.prototype.add = function(html) {
	if(!this.obj) {
		console.error("LDArea.add : invalid obj");
		return false;
	}

	this.obj.append(html);
};

LDArea.prototype.renderItem = function(item, key, list) {
	if(this.onItemCB) {
		item = this.onItemCB(item, key, list);
	}

	if(!this.template.item) {
		console.error("LDArea.render : template.item is invalid");
		return false;
	}

	// -- Render
	var str = this.template.item({item: item, key: key, list: list});
	return str;
};

LDArea.prototype.renderData = function(data) {
	if(!this.template.item) {
		console.error("LDArea.render : template.item is invalid");
		return false;
	}

	// -- Render
	var str = this.template.item({item: data, key: 0, list: data});
	return str;
};

// -- For each area Object extend this!!
LDArea.prototype.render = function() {
	var me = this;
	var list = this.dataSource.getList();
	var data = this.dataSource.getData();

	// -- If empty?
	if(this.dataSource.isEmpty()) {
		// -- Only when its first page
		if(this.template.empty) {
			var result = this.template.empty();

			if(1 == this.dataSource.getPage()) {
				this.set(result);
			}
		}

		return;
	}

	if(list) {
		// -- List Item
		var result = '';
		_.each(list, function (item, key, list) {
			var html = me.renderItem(item, key, list);
			result = result + html;
		});

		// -- Depends on page set / add
		if (1 == this.dataSource.getPage()) {
			this.set(result);
		} else {
			this.add(result);
		}
	} else if(data) {
		this.set(me.renderData(data));
	}
};

/**
 * Render with empty template
 */
LDArea.prototype.setEmpty = function() {
	if(this.template && this.template.empty) {
		this.set(this.template.empty());
	}
};

/**
 * Where cb(item, key, list)
 * @param cb
 */
LDArea.prototype.setOnItem = function(cb) {
	if(_.isFunction(cb)) {
		this.onItemCB = cb;
	} else {
		console.error("Invalid Callback Type it should be function");
	}
};

var LDDataSource = function() {
	this.list = null;
	this.data = null;
	this.page = 1;
};

LDDataSource.prototype.getPage = function() {
	return this.page;
};

LDDataSource.prototype.getList = function() {
	return this.list;
};

LDDataSource.prototype.at = function(index) {
	if(!this.list)
		return false;

	return this.list[index];
};

LDDataSource.prototype.setList = function(list) {
	this.list = list;
};

LDDataSource.prototype.getData = function() {
	return this.data;
};

LDDataSource.prototype.setData = function(data) {
	this.data = data;
};

LDDataSource.prototype.isEmpty = function() {
	if(this.list) {
		if(0 == this.list.length)
			return true;
		return false;
	}

	if(!this.data)
		return true;

	return false;
};



// -- Create basic list dataSource
var LDD = {};
LDD.list = function(list) {
	var LDD = new LDDataSource();
	LDD.setList(list);

	return LDD;
};

LDD.data = function(data) {
	var LDD = new LDDataSource();
	LDD.setData(data);

	return LDD;
};


LazyDuck = function() {
	this.prefix = "LD";
	this.postForm = "Form";
	this.postArea = "Area";
	this.postTemplate = "Template";

	this.DATA_NAME = 'data-name';

	// -- Callback when invoke has done, usually used when module
	this.cbOnAfterInvoke = null;

	// -- List of extended Object types
	this.listTypes = [];
};

LazyDuck.prototype.invoke = function(options) {
	var me = this;

	// -- Options
	if(options) {
		if(options.prefix) {
			this.prefix = options.prefix;
		}

		if(options.postForm) {
			this.postForm = options.postForm;
		}

		if(options.postArea) {
			this.postArea = options.postArea;
		}

		if(options.postTemplate) {
			this.postTemplate = options.postTemplate;
		}
	}

	var classForm = '.' + this.prefix + this.postForm;
	var classArea = '.' + this.prefix + this.postArea;
	var classTemplate = '.' + this.prefix + this.postTemplate;

	// -- LDForm
	$(classForm).each(function() {
		var self = $(this);
		var id = self.attr('id');
		var name = self.attr(me.DATA_NAME);

		if(name)
			id = name;

		me[id] = self.LDForm();
	});

	// -- LDArea
	$(classArea).each(function() {
		var self = $(this);
		var id = self.attr('id');
		var name = self.attr(me.DATA_NAME);

		if(name)
			id = name;

		me[id] = self.LDArea();
	});

	// -- LDTemplate
	$(classTemplate).each(function() {
		var self = $(this);
		var id = self.attr('id');
		var name = self.attr(me.DATA_NAME);

		if(name)
			id = name;

		me[id] = _.template(self.html());
	});

	// -- User custom types
	_.each(this.listTypes, function(type) {
		var classSelector = '.' + me.prefix + type.postfix;
		$(classSelector).each(function() {
			var self = $(this);
			var id = self.attr('id');
			var name = self.attr(me.DATA_NAME);

			if(name)
				id = name;

			me[id] = type.fn(self);
		})
	});

	// -- Callback
	if(this.cbOnAfterInvoke) {
		setTimeout(function() {
			me.cbOnAfterInvoke(me);
		}, 1)

	}
};

LazyDuck.prototype.addType = function(options) {
	if(!options.postfix || !options.fn) {
		console.error('LazyDuck.addType requires postfix and fn');
		return false;
	}

	this.listTypes.push(options);
	return true;
};

// -- Register callback
LazyDuck.prototype.setOnInvoke = function(cb) {
	this.cbOnAfterInvoke = cb;
};

/**
 * Recommended way to create LazyDuck another instance
 * @returns {LazyDuck}
 */
LazyDuck.prototype.createInstance = function() {
	var instance = new LazyDuck();

	// -- Copy attributes
	instance.listTypes = this.listTypes;

	return instance;
};

var LD = new LazyDuck();

// -- Creates LDArea object from this object
$.fn.LDArea = function() {
	var ldArea = new LDArea(this);
	return ldArea;
};

// -- TemplateEx
_.mixin({
	templateEx: function(str) {
		var IF_LINE = "data-if-line";
		var regIf = /data-if-line=('([^']*)')|("([^"]*)")/;
		if(-1 < str.search(IF_LINE)) {
			var lines = str.split('\n');
			_.each(lines, function(line, k) {
				var result =  line.match(regIf);
				if(!result) {
					return;
				}

				var q = result[2];
				var dq = result[4];
				result = q ? q : dq;

				var conditionLine = String.format('<% if({0}) { %> {1} <% } %>', result, line);
				line = conditionLine;
				lines[k] = line;
			});

			var fullLine = lines.join('\n');
			// -- Print, Debug
			return _.template(fullLine);
		}

		// -- Not found
		return _.template(str);
	},

	/**
	 * get Average of the array values
	 * @param arr
	 */
	average: function(arr) {
		return _.reduce(arr, function(memo, num) {
				return memo + num;
			}, 0) / (arr.length === 0 ? 1 : arr.length);
	}
});

/*
 <form id="formSave" method="post" action="url" data-confirm="Really?" data-post="areaResult">

 use id, method, action, [data-confirm], [data-before-submit], [data-post]
 callback success, failure

 $("#formSave").submitAjax(function(data) {
 console.log(data);
 }, function(err) {
 console.log("ERR");
 }
 }, true, {
 showLoading: function() { showLoading(); },
 hideLoading: function() { hideLoading(); },
 dataExtend: function(data) {
 if(data) {
 data.getDataSource = function() {
 return data.list;
 };

 data.isEmpty = function() {
 try {
 if(!data.list)
 return true;

 if(0 < data.list.length)
 return false;
 return true;
 }
 catch(e) {
 return true;
 }
 };

 data.getPage = function() {
 return data.page.page;
 };
 }

 return data;
 }
 });

 data-before-submit: "onBeforeSubmit(data)"
 its called right after grabForm and if result is 'false' it stops!!
 you can manipulate data here!

 */

$.fn.submitAjax = function(success, failure, submitNow, opt) {
	var me = (this);
	me.off('submit'); // -- should remove the event

	me.submit(function(event) {
		event.preventDefault();

		var url = me.attr('action');
		var type = me.attr('method');
		var data = me.toJSON();

		// -- Validation failed
		if(!data)
			return;

		// -- Before submit callback
		var beforeSubmit = me.attr('data-before-submit');
		if(beforeSubmit && 0 < beforeSubmit.length) {
			var ret = eval(beforeSubmit);
			if(false === ret) {
				return false;
			}
		}

		var message = me.attr('data-confirm');
		if(message && 0 < message.length) {
			if(!confirm(message)) {
				return false;
			}
		}

		if(!type)
			type = "get";

		if(opt && opt.showLoading)
			opt.showLoading();

		$.ajax({
			type: type,
			url: url,
			data: data,
			dataType: 'JSON',
			success: function(data) {
				if(opt && opt.hideLoading)
					opt.hideLoading();

				if(success) {
					// -- data extend, Better define at V1 for every project
					if(opt && opt.dataExtend) {
						success(opt.dataExtend(data));
					} else {
						success(data);
					}
				} else {
					//alert("Success but callback not found");
					console.log("SubmitAjax Success", data);
				}
			},
			error: function(err) {
				if(opt && opt.hideLoading)
					opt.hideLoading();

				if(failure) {
					failure(err);
				} else {
					//alert("Failure but callback not found" + err);
					console.error("SubmitAjax Error", err);
				}
			}
		});

		return false;
	});

	if(submitNow)
		me.submit();

	return true;
};

$.fn.submitConfirm = function() {
	var me = (this);
	me.off('submit'); // -- should remove the event

	me.submit(function(event) {

		var message = me.attr('data-confirm');
		if(message && 0 < message.length) {
			if(!confirm(message)) {
				event.preventDefault();
				return false;
			}
		}

		return true;
	});

	return true;
};