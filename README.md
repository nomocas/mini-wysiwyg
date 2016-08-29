# mini-wysiwyg

Absolutly minimal wysiwyg and its menu.

- Allow only bold, italic, ordered list, unordered list, and link.
- Based on contentEditable. No text-area. In-place edition.
- Produce clean (and homogeneous between browsers) html output.
- icon set could be easily changed. default : font-awesome.
- avaiable as CommonJS or UMD module
- +- 2.7 Ko Minified/Gzipped


It was made because :
- 99,99 % of the time, we only need a few set of actions and not a full editor that produces ugly and complexe html
- and almost all other wysiwyg are really really heavy for just doing that. This one could not be lighter.


Known bugs :
- Firefox and p tags : executing createLink and list (ordered or not) as p child don't work and throw a NS_ERROR : 
	=> work around : use anything else than a p tag as editable element.


Well tested in Chrome, Safari and Firefox.


## Example

Take a look in example folder.

## Usage

```javascript
var MiniWysiwyg = require('mini-wysiwyg');

// add menu somewhere
document.body.appendChild(MiniWysiwyg.menu().el);

// make a node editable
var node = document.querySelector('...');
node.setAttribute('contenteditable', true); // togggle contenteditable to allow edition and menu handling.
var wysiwyg = new MiniWysiwyg(node); // instanciate a wysiwyg for each editable node

// for the moment : only update on blur (which clean html before firing event)
wysiwyg.on('update', function(e) {
	console.log('wysiwyg update :', e.detail.value);
});

```

It's avaiable as global MiniWysiwyg in the browser when UMD module is loaded from script tags.

### Replacer

You could define a replacement function to cast produced nodes to what-ever-you-want node.

Example that cast B and I tags to spans with custom classes.
```javascript
Wysiwyg.replacer = function(node) {
	switch (node.tagName) {
		case 'B':
			var newNode = document.createElement('span');
			newNode.classList.add('my-bold');
			return newNode;
		case 'I':
			var newNode = document.createElement('span');
			newNode.classList.add('my-italic');
			return newNode;
	}
	return; // no replacement will be done.
};
```

### Custom icon set 

Example with current icon set.
```javascript
var iconsSet = {
	undo: '<i class="fa fa-undo"></i>',
	redo: '<i class="fa fa-repeat"></i>',
	bold: '<i class="fa fa-bold"></i>',
	italic: '<i class="fa fa-italic"></i>',
	insertUnorderedList: '<i class="fa fa-list-ul"></i>',
	insertOrderedList: '<i class="fa fa-list-ol"></i>',
	createLink: '<i class="fa fa-link"></i>',
	unlink: '<i class="fa fa-unlink"></i>'
};

// Then, on wysiwyg-menu instanciation
var menu = MiniWysiwyg.menu({
	iconsSet:iconsSet
});
document.body.appendChild(menu.el);
```

## API

Statics :

- Wysiwyg.menu(opt) : return (and produce on first call) the menu manager (a singleton)
- Wysiwyg.destroyMenu() : destroy menu (including manager and dom's elements)
- Wysiwyg.update() : check value change on currently focused editable node : dispatch update event if changed.
- Wysiwyg.format(actionName) : apply specified action  (bold, italic, ...) to current selection in any contentEditable node.
- Wysiwyg.cleanHTML(node) : Clean inner HTML of provided node (to avoid differences from browsers implementations).

Instance :

- wysiwyg.update() : check value change : dispatch update event if changed.
- wysiwyg.html(htmlString) : set html content. If no htmlString is provided : return current html (after clean).
- wysiwyg.destroy() : destroy wysiwyg instance and remove binded events. Lets editable node in dom's tree
- wysiwyg.clean() : force clean.
- wysiwyg.format(actionName)

Menu manager :

- menu.hide()
- menu.show()
- menu.showAnchorManager()
- menu.hideAnchorManager()
- menu.moveToSelection() : move menu near current selection


## Licence

The [MIT](http://opensource.org/licenses/MIT) License

Copyright (c) 2016 Gilles Coomans <gilles.coomans@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.