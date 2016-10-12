# mithril autosuggest component

This creates a autosuggest in mithril

## Install

```bash
npm install mithril.component.autosuggest
```

## Usage

First include mithril.js, and the js file:

```html
<script src="lib/mithril.js"></script>
<script src="dist/mithril.component.autosuggest.js"></script>
```

Then in your view, simply initialise the component with the required options:

```javascript
return m.components.mAutosuggest({state: {
	displayValue: o.displayValue,
	matcher: o.matcher,
	decorator: o.decorator,
	selectedValue: o.selectedValue
}});
```

You need to set the following attributes:

* **displayValue** - a function that knows how to display your value to the user, default is to show whatever you have
* **matcher** - A function that returns matches based on the given value, you must declare and define this, it receices a `value` and `callback`
* **decorator** - A method to show an item that has matched, and the user can click on.
* **selectedValue** - A property that will be set when the user selects an item from the suggestions

**Note:** See the examples directory for details

**Note2:** There is no CSS included with autosuggest - you'll need to make up your own - see the example

