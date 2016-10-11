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

}());;