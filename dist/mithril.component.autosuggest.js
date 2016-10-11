/*	
	This creates a mithril autosuggest component
*/
;(function(){

var mithrilAutosuggestComponent = function(m){
	m.components = m.components || {};

	var def = function(value, defValue) {
		return typeof value !== "undefined"? value: defValue;
	},
	mAutosuggest = {
		//	Set attributes
		state: function(attrs) {
			attrs = attrs || {};
			attrs.state = attrs.state || {};
			//	Classname to prefix
			attrs.state.cName = def(attrs.state.cName, "auto-suggest");
			//	Return what to display to the user when an item has been chosen.
			attrs.state.displayValue = def(attrs.state.displayValue, function(value){
				return value;
			});
			//	Return display of an item in the dropdown
			attrs.state.decorator = def(attrs.state.decorator, function(){
				return DIV({class: attrs.state.cName + "-item"}, item);
			});
			//	Default rendering
			attrs.state.render = def(attrs.state.render, function(ctrl){
				return m('DIV', {className: attrs.state.cName}, [
					m.e('INPUT', {valueInput: ctrl.model.value}),
					m.e('DIV', {className: attrs.state.cName + "-items"}, 
						ctrl.model.matches().map(function(item) {
							return m('DIV', {
								onclick: function(){
									ctrl.model.selectedValue(item);
								}
							}, ctrl.decorator(item));
						})
					)
				]);
			});
			//	The user must specify this
			attrs.state.matcher = def(attrs.state.matcher, function(){
				return console.warn("mithrilAutosuggestComponent matcher not defined");
			});
			attrs.state.selectedValue = def(attrs.state.selectedValue, m.p());
			return attrs.state;
		},

		//  Data related items go in the model
		model: function(data){
			var me = this;
			me.data = m.p(data.data);
			me.displayValue = data.displayValue;
			me.matcher = data.matcher;
			me.render = data.render;
			me.matches = m.p([]);

			var foundMatch = false;
			me.value = m.p("").subscribe(function(value) {
				if(!foundMatch) {
					data.matcher(value, me.matches);
				} else {
					foundMatch = false;
				}
			});

			//	When we select a value, clear the matches, and set the value in teh display field
			me.selectedValue = m.p().subscribe(function(obj) {
				foundMatch = true;
				me.value(me.displayValue(obj));
				data.selectedValue(obj);
				me.matches([]);
			});
			return me;
		},

		controller: function(data) {
			var me = this,
				state = mAutosuggest.state(data);
			me.model = mAutosuggest.model(state);
			me.decorator = state.decorator;
			return me;
		},
		//  View generates html
		view: function(ctrl) {
			return ctrl.model.render(ctrl);
		}
	};

	m.components.mAutosuggest = function(args){
		//	Sensible default settings
		return m.component(mAutosuggest, args);
	};

	return m.components;
};

if (typeof module != "undefined" && module !== null && module.exports) {
	module.exports = mithrilAutosuggestComponent;
} else if (typeof define === "function" && define.amd) {
	define(function() {
		return mithrilAutosuggestComponent;
	});
} else {
	mithrilAutosuggestComponent(typeof window != "undefined"? window.m || {}: {});
}

}());;;;(function(){
	var module = null;

;//	Mithril bindings.
//	Copyright (C) 2014 jsguy (Mikkel Bergmann)
//	MIT licensed
(function(){
var mithrilBindings = function(m){
	m.bindings = m.bindings || {};

	//	Pub/Sub based extended properties
	m.p = function(value) {
		var self = this,
			subs = [],
			prevValue,
			delay = false,
			//  Send notifications to subscribers
			notify = function (value, prevValue) {
				var i;
				for (i = 0; i < subs.length; i += 1) {
					subs[i].func.apply(subs[i].context, [value, prevValue]);
				}
			},
			prop = function() {
				if (arguments.length) {
					value = arguments[0];
					if (prevValue !== value) {
						var tmpPrev = prevValue;
						prevValue = value;
						notify(value, tmpPrev);
					}
				}
				return value;
			};

		//	Allow push on arrays
		prop.push = function(val) {
			if(value.push && typeof value.length !== "undefined") {
				value.push(val);
			}
			prop(value);
		};

		//	Subscribe for when the value changes
		prop.subscribe = function (func, context) {
			subs.push({ func: func, context: context || self });
			return prop;
		};

		//	Allow property to not automatically render
		prop.delay = function(value) {
			delay = !!value;
			return prop;
		};

		//	Automatically update rendering when a value changes
		//	As mithril waits for a request animation frame, this should be ok.
		//	You can use .delay(true) to be able to manually handle updates
		prop.subscribe(function(val){
			if(!delay) {
				m.startComputation();
				m.endComputation();
			}
			return prop;
		});

		return prop;
	};

	//	Element function that applies our extended bindings
	//	Note: 
	//		. Some attributes can be removed when applied, eg: custom attributes
	//	
	m.e = function(element, attrs, children) {
		for (var name in attrs) {
			if (m.bindings[name]) {
				m.bindings[name].func.apply(attrs, [attrs[name]]);
				if(m.bindings[name].removeable) {
					delete attrs[name];
				}
			}
		}
		return m(element, attrs, children);
	};

	//	Add bindings method
	//	Non-standard attributes do not need to be rendered, eg: valueInput
	//	so they are set as removable
	m.addBinding = function(name, func, removeable){
		m.bindings[name] = {
			func: func,
			removeable: removeable
		};
	};

	//	Get the underlying value of a property
	m.unwrap = function(prop) {
		return (typeof prop == "function")? prop(): prop;
	};

	//	Bi-directional binding of value
	m.addBinding("value", function(prop) {
		if (typeof prop == "function") {
			this.value = prop();
			this.onchange = m.withAttr("value", prop);
		} else {
			this.value = prop;
		}
	});

	//	Bi-directional binding of checked property
	m.addBinding("checked", function(prop) {
		if (typeof prop == "function") {
			this.checked = prop();
			this.onchange = m.withAttr("checked", prop);
		} else {
			this.checked = prop;
		}
	});

	//	Hide node
	m.addBinding("hide", function(prop){
		this.style = {
			display: m.unwrap(prop)? "none" : ""
		};
	}, true);

	//	Toggle value(s) on click
	m.addBinding('toggle', function(prop){
		this.onclick = function(){
			//	Toggle allows an enum list to be toggled, eg: [prop, value2, value2]
			var isFunc = typeof prop === 'function', tmp, i, vals = [], val, tVal;

			//	Toggle boolean
			if(isFunc) {
				value = prop();
				prop(!value);
			} else {
				//	Toggle enumeration
				tmp = prop[0];
				val = tmp();
				vals = prop.slice(1);
				tVal = vals[0];

				for(i = 0; i < vals.length; i += 1) {
					if(val == vals[i]) {
						if(typeof vals[i+1] !== 'undefined') {
							tVal = vals[i+1];
						}
						break;
					}
				}
				tmp(tVal);
			}
		};
	}, true);

	//	Set hover states, a'la jQuery pattern
	m.addBinding('hover', function(prop){
		this.onmouseover = prop[0];
		if(prop[1]) {
			this.onmouseout = prop[1];
		}
	}, true );

	//	Add value bindings for various event types 
	var events = ["Input", "Keyup", "Keypress"],
		createBinding = function(name, eve){
			//	Bi-directional binding of value
			m.addBinding(name, function(prop) {
				if (typeof prop == "function") {
					this.value = prop();
					this[eve] = m.withAttr("value", prop);
				} else {
					this.value = prop;
				}
			}, true);
		};

	for(var i = 0; i < events.length; i += 1) {
		var eve = events[i];
		createBinding("value" + eve, "on" + eve.toLowerCase());
	}


	//	Set a value on a property
	m.set = function(prop, value){
		return function() {
			prop(value);
		};
	};

	/*	Returns a function that can trigger a binding 
		Usage: onclick: m.trigger('binding', prop)
	*/
	m.trigger = function(){
		var args = Array.prototype.slice.call(arguments);
		return function(){
			var name = args[0],
				argList = args.slice(1);
			if (m.bindings[name]) {
				m.bindings[name].func.apply(this, argList);
			}
		};
	};

	return m.bindings;
};

if (typeof module != "undefined" && module !== null && module.exports) {
	module.exports = mithrilBindings;
} else if (typeof define === "function" && define.amd) {
	define(function() {
		return mithrilBindings;
	});
} else {
	mithrilBindings(typeof window != "undefined"? window.m || {}: {});
}

}());;

}());