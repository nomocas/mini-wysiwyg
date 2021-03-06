// Inspired from http://codepen.io/barney-parker/pen/idjCG
// https://www.barneyparker.com/world-simplest-html5-wysisyg-inline-editor/
// more : https://developer.mozilla.org/en-US/docs/Rich-Text_Editing_in_Mozilla#Introduction

/**
 * Known bugs :
 *
 * - Firefox and p tags : executing createLink and list (ordered or not) as p child don't work and throw a NS_ERROR : 
 * 		=> work around : use anything else than a p tag as editable element.
 */

var Emitter = require('nomocas-utils/lib/emitter'),
	dom = require('nomocas-webutils/lib/elem'),
	elem = dom.elem;

// full info on actions list there : https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
// more : https://w3c.github.io/editing/execCommand.html
var defaultActions = [

	/* those below are tested and ok */

	'undo',
	'redo',
	'bold',
	'italic',
	'insertUnorderedList',
	'insertOrderedList',
	'createLink',
	'unlink'

	/* those below are untested or buggy */
	/* in fact as I just need a minimal wysiwyg : I don't need them. */
	/* if you want to try : simply uncomment. */

	// 'underline',
	// 'strikeThrough',
	// 'justifyLeft',
	// 'justifyCenter',
	// 'justifyRight',
	// 'justifyFull',
	// 'indent',
	// 'outdent',
	// 	'h1',
	// 'h2',
	// 'p',
	// 'subscript',
	// 'superscript',
];

// It uses fontawesome icons by default. could be changed by providing custom iconsSet when producing menu.
// each string value will be outputed as <i class="STRING_VALUE"></i> and each function will provide its output
var defaultIconsSet = {
	undo: '<i class="fa fa-undo"></i>',
	redo: '<i class="fa fa-repeat"></i>',
	bold: '<i class="fa fa-bold"></i>',
	italic: '<i class="fa fa-italic"></i>',
	insertUnorderedList: '<i class="fa fa-list-ul"></i>',
	insertOrderedList: '<i class="fa fa-list-ol"></i>',
	'createLink': '<i class="fa fa-link"></i>',
	'unlink': '<i class="fa fa-unlink"></i>'

	// underline: 'fa fa-underline',
	// strikeThrough: 'fa fa-strikethrough',
	// justifyLeft: 'fa fa-align-left',
	// justifyCenter: 'fa fa-align-center',
	// justifyRight: 'fa fa-align-right',
	// justifyFull: 'fa fa-align-justify',
	// indent: 'fa fa-indent',
	// outdent: 'fa fa-outdent',

	// h1: function() {
	// 	return 'h<sup>1</sup>';
	// },
	// h2: function() {
	// 	return 'h<sup>2</sup>';
	// },
	// // p: function() {
	// // 	return 'p';
	// // },
	// subscript: 'fa fa-subscript',
	// superscript: 'fa fa-superscript'
};

function moveMenuToSelection() {
	if (!Wysiwyg.menuInstance)
		return;
	Wysiwyg.menuInstance.moveToSelection();
}

/*************************************************************************
 * Wysiwyg Class
 *************************************************************************/

function Wysiwyg(editedNode) {
	this.editedNode = (typeof editedNode === 'string') ? document.querySelector(editedNode) : editedNode;
	this._value = this.editedNode.innerHTML;
	var self = this,
		willBlur = null,
		willHideMenu = null,
		blur = function(e) {
			willBlur = setTimeout(function() {
				if (Wysiwyg.currentlyFocused === self)
					Wysiwyg.currentlyFocused = null;
				self.clean();
				self.update();
			}, 10);
		},
		focus = function(e) {
			Wysiwyg.currentlyFocused = self;
			clearTimeout(willBlur);
		},
		dblclick = function(e) {
			// double click on editedNode : center menu on selection
			if (!Wysiwyg.currentlyFocused || !self.editedNode.contentEditable)
				return;
			clearTimeout(willHideMenu);
			moveMenuToSelection();
		},
		mouseUp = function() {
			if (!Wysiwyg.currentlyFocused || !self.editedNode.contentEditable)
				return;
			if (window.getSelection().toString()) {
				clearTimeout(willHideMenu);
				moveMenuToSelection();
			}
		},
		click = function() {
			if (!Wysiwyg.menuInstance || !self.editedNode.contentEditable)
				return;
			if (Wysiwyg.menuInstance.el.style.display !== 'none' && !window.getSelection().toString())
				willHideMenu = setTimeout(function() {
					Wysiwyg.menuInstance.hide();
				}, 300);
		},
		input = function(e) {
			if (e.target.innerHTML === '' || e.target.innerHTML === '<br>')
				e.target.classList.add('empty');
			else
				e.target.classList.remove('empty');
		};
	editedNode.addEventListener('focus', focus);
	editedNode.addEventListener('blur', blur);
	editedNode.addEventListener('dblclick', dblclick);
	editedNode.addEventListener('mouseup', mouseUp);
	editedNode.addEventListener('click', click);
	editedNode.addEventListener('input', input);
	this._destroyer = function() {
		editedNode.removeEventListener('focus', focus);
		editedNode.removeEventListener('blur', blur);
		editedNode.removeEventListener('dblclick', dblclick);
		editedNode.removeEventListener('mouseup', mouseUp);
		editedNode.removeEventListener('click', click);
		editedNode.removeEventListener('input', input);
	};
}

Wysiwyg.prototype = new Emitter();
// check value change : dispatch event if needed
Wysiwyg.prototype.update = function() {
	var val = this.editedNode.innerHTML;
	if (val == this._value)
		return;
	this._value = val;
	var evt = new CustomEvent('update', {
		detail: {
			value: val,
			node: this.editedNode,
			wysiwyg: this
		}
	});
	this.emit('update', evt);
};
// get or update html content. do not dispatch event
Wysiwyg.prototype.html = function(value) {
	if (!arguments.length)
		return this.editedNode.innerHTML;
	this.editedNode.innerHTML = value;
};
Wysiwyg.prototype.destroy = function(value) {
	if (this._destroyer)
		this._destroyer();
	this._destroyer = this.editedNode = null;
	this._value = '';
	if (Wysiwyg.currentlyFocused === this)
		Wysiwyg.currentlyFocused = null;
};
Wysiwyg.prototype.clean = function() {
	Wysiwyg.cleanHTML(this.editedNode);
	if (this.editedNode.innerHTML === '<br>')
		this.editedNode.textContent = '';
	return this;
};

function refocus() {
	if (Wysiwyg.currentlyFocused && Wysiwyg.currentlyFocused.editedNode !== document.activeElement)
		Wysiwyg.currentlyFocused.editedNode.focus();
}

Wysiwyg.update = function() {
	if (Wysiwyg.currentlyFocused) {
		// Wysiwyg.currentlyFocused.editedNode.blur();
		Wysiwyg.currentlyFocused.clean();
		Wysiwyg.currentlyFocused.update();
		// Wysiwyg.currentlyFocused = null;
	}
};

/**
 * apply specified action  (bold, italic, ...) to current selection in any contentEditable node.
 * @param  {String} action the action to apply
 * @return {Void}        
 */
Wysiwyg.format = function(action) {
	switch (action) {
		case 'h1':
		case 'h2':
		case 'p':
			document.execCommand('formatBlock', false, action);
			break;
		case 'createLink':
			document.execCommand('createLink', false, 'blabla'); // providing url here doesn't work
			// We need a way to force the href.
			// It seems that focus node (correctly wrapped with anchor with href at this point) 
			// will be rewrapped with another anchor (without href) somehow after.
			// Wait one ms to get final wrapping anchor.
			if (!Wysiwyg.menuInstance)
				break;

			var sel = window.getSelection(),
				focus = sel.focusNode;
			setTimeout(function() {
				var parent = focus;
				// catch 'a' before (should be an ancestor)
				while (parent && parent.tagName !== 'A')
					parent = parent.parentNode;
				if (!parent)
					return;
				parent.setAttribute('href', '');
				parent.setAttribute('target', '_blank');
				Wysiwyg.menuInstance.clearAnchorManager();
				Wysiwyg.menuInstance.showAnchorManager(parent);
			}, 1);
			break;
		default:
			document.execCommand(action, false, null);
			if (action === 'unlink')
				Wysiwyg.menuInstance.hideAnchorManager();
			break;
	}
	refocus();
};

Wysiwyg.currentlyFocused = null;

/*************************************************************************
 * Wysiwyg Menu
 *************************************************************************/

var WysiwygMenu = function(options) {
	options = options || {};
	var div = elem('div', { 'class': options.menuClass ||  'wysiwyg-menu' }),
		ul = elem('ul'),
		actions = options.actions || defaultActions;

	div.appendChild(ul);

	this.el = div;

	actions.forEach(function(action) {
		var li = elem('li'),
			button = elem('button'),
			icon = options.iconsSet || defaultIconsSet[action];
		button.innerHTML = typeof icon === 'function' ? icon(action) : icon;
		button.addEventListener('click', function(e) {
			Wysiwyg.format(action);
		});
		li.appendChild(button);
		ul.appendChild(li);
	});

	var self = this;
	var hrefInput = elem('input', { type: 'text', value: '', placeHolder: 'href (http://...)' }, null, {
			input: function(e) {
				var href = e.target.value;
				self.currentAnchor.setAttribute('href', href);
			}
		}),
		titleInput = elem('input', { type: 'text', value: '', placeHolder: 'title' }, null, {
			input: function(e) {
				var title = e.target.value;
				self.currentAnchor.setAttribute('title', title);
			}
		}),
		select = elem('select', { name: 'target' }, [
			elem('option', { value: '_blank' }, ['_blank']),
			elem('option', { value: '_self' }, ['_self'])
		], {
			change: function(e) {
				var select = e.target;
				var target = select.options[select.selectedIndex].value;
				if (self.currentAnchor)
					self.currentAnchor.setAttribute('target', target);
			}
		}),
		anchorUI = elem('div', { 'class': 'wysiwyg-anchor-ui', 'style': 'display:none;' }, [
			hrefInput,
			titleInput,
			select
		]);

	div.appendChild(anchorUI);

	this.anchorUI = anchorUI;
	this.targetSelect = select;
	this.hrefInput = hrefInput;

	var bodyClickHandler = function(e) {
			if (!Wysiwyg.menuInstance.shown())
				return;
			var menu = e.target;
			while (menu && menu !== div && (Wysiwyg.currentlyFocused ? (menu !== Wysiwyg.currentlyFocused.editedNode) : true))
				menu = menu.parentNode;
			if (!menu)
				self.hide();
		},
		mousedownHandler = function(e) {
			if (!Wysiwyg.currentlyFocused)
				return;
			var parent = e.target;
			while (parent && parent !== Wysiwyg.currentlyFocused.editedNode && parent !== div)
				parent = parent.parentNode;
			if (!parent) {
				Wysiwyg.update();
				self.hide();
			}
		};

	this.clearAnchorManager = function() {
		this.currentAnchor = null;
		hrefInput.value = '';
		titleInput.value = '';
		select.value = null;
	};

	document.body.addEventListener('click', bodyClickHandler);
	document.body.addEventListener('mousedown', mousedownHandler);

	this.destroyers = [function() {
		document.body.removeEventListener('click', bodyClickHandler);
		document.body.removeEventListener('mousedown', mousedownHandler);
	}];

	this.currentAnchorParent = null;
};

WysiwygMenu.prototype = new Emitter();

WysiwygMenu.prototype.destroy = function() {
	this.destroyers.forEach(function(d) { d(); });
	// let garbage collector do the rest
};

WysiwygMenu.prototype.moveToSelection = function() {

	var sel = window.getSelection(),
		range = sel.getRangeAt(0),
		anchor = sel.anchorNode,
		focus = sel.focusNode;

	var rect = range.getBoundingClientRect();
	this.el.style.left = (rect.left + rect.width / 2) + 'px';
	this.el.style.top = (rect.bottom + 8) + 'px';
	this.show();

	// Firefox case when doubleclick-on-word selection : 
	// as A tags should be selected precisly to be edited : anchor and focus node should be element (no pure text at start or end)
	if (anchor.nodeType === 1 && focus.nodeType === 1) // element nodes : selection offset is number of child after start (or before end)
	{
		var start = anchor.childNodes[sel.anchorOffset],
			end = focus.childNodes[sel.focusOffset - 1];
		if (start.tagName === 'A' && start === end)
			anchor = start;
	}
	// find first A : (anchor or ancestor)
	while (anchor && anchor.tagName !== 'A' && anchor !== Wysiwyg.currentlyFocused.editedNode)
		anchor = anchor.parentNode;
	if (anchor && anchor.tagName === 'A')
		Wysiwyg.menuInstance.showAnchorManager(anchor);
	else
		Wysiwyg.menuInstance.hideAnchorManager();
};
WysiwygMenu.prototype.shown = function() {
	return this.el.style.display !== 'none';
};
WysiwygMenu.prototype.show = function() {
	dom.show(this.el);
};
WysiwygMenu.prototype.hide = function() {
	this.hideAnchorManager();
	dom.hide(this.el);
};
WysiwygMenu.prototype.showAnchorManager = function(anchor) {
	this.currentAnchor = anchor;
	dom.show(this.anchorUI);
	this.currentAnchorParent = Wysiwyg.currentlyFocused;
	this.hrefInput.value = anchor.getAttribute('href') || '';
	this.targetSelect.value = anchor.getAttribute('target') || '';
};
WysiwygMenu.prototype.hideAnchorManager = function() {
	if (this.currentAnchorParent) {
		this.currentAnchorParent.clean();
		this.currentAnchorParent.update();
		this.currentAnchorParent = null;
	}
	dom.hide(this.anchorUI);
};
/*
 * Wysiwyg.menu : by default : Produce and return a tools menu as : <ul class="wysiwyg-menu"><li><button><i class="fa fa-xxx"></i></button></li>...</ul>.
 * Each 'button' tag will have its 'click' handler binded to associated action.
 * Still just to append returned 'ul' somewhere.
 * (it uses iconsSet map above to produce icons or custom output)
 */
Wysiwyg.menu = function(options) {
	if (Wysiwyg.menuInstance)
		return Wysiwyg.menuInstance;
	return (Wysiwyg.menuInstance = new WysiwygMenu(options));
};

Wysiwyg.destroyMenu = function() {
	if (!Wysiwyg.menuInstance)
		return;
	Wysiwyg.menuInstance.destroy();
	Wysiwyg.menuInstance = null;
};

/*
 * Clean produced HTML (to avoid differences from browsers implementations).
 * Provide minimal html. (no p, div or span. no empty node or node that only contain <br>. no styles.)
 * Still a (unresolved) bug : sometimes an additional <br> is added.
 */
var replacedByContent = /^(?:SPAN|P|DIV)$/,
	needBR = /^(?:P|DIV)$/;

function replaceTagByContent(child, node) {
	if (needBR.test(child.tagName)) // for div and  p : insert br before child (as div and p effect).
		node.insertBefore(elem('br'), child);

	// if there is something interesting in child
	if (child.textContent) {
		// recursion to clean sub contents before
		Wysiwyg.cleanHTML(child);

		// insert child's children before child.
		// copy childNodes because it will be emptied child by child
		var children = [].slice.call(child.childNodes);
		var lenj = children.length;
		for (var j = 0; j < lenj; ++j)
			node.insertBefore(children[j], child);
	}

	// remove div or p or span
	node.removeChild(child);
}

function cleanInnerHTML(child, node) {
	Wysiwyg.cleanHTML(child);
	// remove any style attribute
	if (child.getAttribute('style'))
		child.removeAttribute('style');
	if (Wysiwyg.replacer) {
		var newNode = Wysiwyg.replacer(child);
		if (newNode && newNode !== child) {
			node.insertBefore(newNode, child);
			var children = [].slice.call(child.childNodes);
			var lenj = children.length;
			for (var j = 0; j < lenj; ++j)
				newNode.appendChild(children[j]);
			node.removeChild(child);
		}
	}
}

Wysiwyg.cleanHTML = function(node) {
	// copy childNodes because original will be modified while looping through procedure below
	var childNodes = [].slice.call(node.childNodes),
		children, child, j, lenj;
	for (var i = 0, len = childNodes.length; i < len; ++i) {
		child = childNodes[i];

		// not for text nodes or br
		if (!child.tagName || child.tagName === 'BR')
			continue;

		// if tag should be replaced by its content (if any). 
		if (replacedByContent.test(child.tagName))
			replaceTagByContent(child, node);
		// for any other tag (but BR) :
		// if it has no text children ==> it contains a br somewhere (rule tested from FF, Chrome & Safari)
		// simply replace it with a br
		else if (!child.textContent) {
			if (child.childNodes.length)
				node.insertBefore(elem('br'), child);
			else
				console.warn('wysiwyg : child with no childNodes !!!!');
			node.removeChild(child);
		}
		// or clean inner html and remove style attribute
		else
			cleanInnerHTML(child, node);
	}
	return node;
};

module.exports = Wysiwyg;

