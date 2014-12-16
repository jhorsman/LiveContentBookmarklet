/* $Id: LiveContent/ui/skins/base/js/jquery.ui.custom.js 1.40 2013/11/16 03:25:13GMT vpevunov Exp  $ */

(function($){
/******************************************
 *
 *	Custom Confirm Dialog - Custom jQuery Widget
 *	- matches SDL UX spec for confirm dialogs
 *	- provides customized options for messages, requires classes ui-modal-*
 *  
 ******************************************/

$.widget( "custom.lcdialog", {
	options: {
		callback: function() { 
			// an empty callback
		},
		checkboxes: []
	},
	
	_create: function() {
		// generate the basic HTML
		this.buildHTML();
		this.open();
	},

	buildHTML: function() {
		this.wrapper = $(document.createElement('div')).addClass("ui-modal-wrapper ui-modal-confirm ui-corner-all");
		
		// create and show the blocking panel:
		this.blocker = $(document.createElement('div')).addClass("ui-modal-blocking");
		
		// create the prompt for the confirm dialog
		if(this.options.promptIcon) this.options.promptIcon = "<img src='"+this.options.promptIcon+"'/>";
		$(this.wrapper).append("<div class='ui-modal-header'><div class='ui-modal-title'>" + this.options.promptIcon + "<span>"+ this.options.promptTitle + "</span></div></div><div class='ui-modal-body'/>");
		this.body = $(".ui-modal-body", this.wrapper).get(0);
				
		// create the body container
		var content = $(document.createElement('div')).addClass("ui-modal-content").append(this.options.promptBody);

		// mash all the HTML together
		$(this.body).append(content);
		
		// build out any checkboxes that need to be provided to the user:
		for(var i = 0; i < this.options.checkboxes.length; i++) {
			// create the div container
			var container = $(document.createElement('div')).addClass("ui-modal-content");
			var checkbox  = $(document.createElement('input'));
			$(checkbox).attr("type", "checkbox");
			
			// set up the checkbox and check it if needed:
			$(checkbox).attr("name", this.options.checkboxes[i].name);
			if(this.options.checkboxes[i].value) $(checkbox).each(function() { this.checked = true; });
			
			// insert all the HTML:
			$(container).append(checkbox);
			$(container).append(this.options.checkboxes[i].prompt);
			$(this.body).append(container);
		}
		
		// create the buttons
		var confirmBtn = $("<input type='button' class='ui-confirm-confirm' value='"+this.options.confirmMsg+"'/>");
		if(this.options.cancelMsg)
			var cancelBtn = $("<input type='button' class='ui-confirm-cancel' value='"+this.options.cancelMsg+"'/>");
		var buttons = $("<div class='ui-modal-buttons'></div>").append(confirmBtn, cancelBtn);
		
		// mash all the HTML together
		$(this.body).append(buttons);
		$("body").append(this.wrapper, this.blocker);
		
		// bind the event handlers on the two inputs:
		$(".ui-confirm-cancel", this.wrapper).bind("click", {widget: this}, function(event) { 
			event.data.widget.cancel();
		});

		$(".ui-confirm-confirm", this.wrapper).bind("click", {widget: this}, function(event) { 
			event.data.widget.confirm();
		});
		
		// bind to force resizing:
		$(window).bind("resize", {widget: this}, function(event) { 
			event.data.widget.center();
		});				
	},

	open: function() {
		$(this.blocker).show();
		$(this.wrapper).show();
		this.center();	
	},

	// ========
	// Default Functions - supers
	// ========	
    _setOption: function( key, value ) {
		this.options[ key ] = value;
	},	

	// cancel click:
	cancel: function() {
		$(this.wrapper).remove();
		$(this.blocker).remove();
		this.destroy();
	},
	
	// confirm click:
	confirm: function() {
		var optionValues = {};
		for(var i = 0; i < this.options.checkboxes.length; i++) {
			$("input[name='"+this.options.checkboxes[i].name+"']", this.body).each(function() {
				if(this.checked) optionValues[$(this).attr("name")] = true;
				else optionValues[$(this).attr("name")] = false; 
			});
		}
		this.options.callback(optionValues);
		this.cancel();
	},
	
	// =========
	// recenter the modal
	// =========
	center: function() {
		var mheight = $(this.wrapper).outerHeight(true);
		var mwidth = $(this.wrapper).outerWidth(width);
		var height = $("body").outerHeight(true);
		var width = $("body").outerWidth(true);
		
		
		// if the modal is too large, size it down:
		if(mwidth > width - 100) { 
			if(width - 100 < mwidth - 100) { 
				mwidth = width - 100;
			} else {
				mwidth = mwidth - 100;
			}
			$(this.modalBody).css({ width: mwidth });
		}
		if(mheight > height - 100) { 
			if(height - 100 < mheight - 100) { 
				mheight = height - 100;
			} else {
				mheight = mheight - 100;
			}
		}

		//CVPortal.debug("modal calculations are as follows: " + height + " / " + width + " for window, and " + mCHeight  + " / " + mCWidth+ " for modal...");
		// force the modal into the available space on the screen, and center it:
		var mH = (height - mheight) / 2
		var mW = (width - mwidth) / 2;
		$(this.wrapper).css({ top: mH, left: mW});
	},
	
	destroy: function() {
		// jquery ui 1.8 - call the base destroy function
		$.Widget.prototype.destroy.call( this );	
	}

});

/******************************************
 *
 *	Ribbon Toolbar - Custom jQuery Widget
 *	- emulates the Microsoft Ribbon UI Element
 *	- depends on a custom.statebroadcast object
 *  
 ******************************************/
$.widget( "custom.ribbon", {
	options: {
		toggled: false
	},
	
	_create: function() {
		this._bindStateChange();
		
		// bind all clickable objects within the ribbon
		this._bindToggleObject();
		this._bindClickObjects();
		this._bindHoverObjects();
		
		// process the actions set:
		this._processActions();
		
		// enable option to toggle ribbon at creation:
		if(this.options.toggled) this.toggle();
	},
	
	// ========
	// Listen to and respond to any changes to the state object
	// ========		
	_bindStateChange: function() {
		// bind to a statechange trigger
		$(this.options.StateManager).bind("statechange", {widget: this}, function(event, data) {
			// $(this.element).bind("statechange", {widget: this}, function(event, data) {
			event.data.widget.statechange(data);
		});	
	},
	
	// parse a changed state object and enable / disable actions appropriately:
	statechange: function(data) {
		for(var i in data) {
			if(this.options.actions[i] && data[i] == true) 	this.enable(i);			
			else this.disable(i);
		}
	},	
	
	// ========
	// Private Functions to control the object arrays
	// ========	
	_processActions: function() {
		if(this.options.actions) {
			var expandedActions = {};
			for(var i in this.options.actions) {
				var myElem = $("#" + i, this.element).get(0);
				expandedActions[i] = { enabled: false, func: this.options.actions[i], element: myElem};	
			}
			this.options.actions = expandedActions;
		}
	},
	
	_bindToggleObject: function() {
		var widgetObject = this;
		$(".ui-ribbon-toggle", this.element).each(function() {
			$(this).bind("click", {widget: widgetObject }, function(event) {
				event.data.widget._toggle(event, this, event.data.widget);
				$(event.data.widget.element).trigger("ribbontoggle");
			});
		});
	},
	
	_bindHoverObjects: function() {
		// link up mouse-over classes
		$(".ui-ribbon-group-subgroup-object", this.element).bind('mouseenter', {widget: this}, function(event) {
			var widget = event.data.widget;
			var id = $(this).attr("id");

			if(widget.options.actions[id] && widget.options.actions[id].enabled && !widget.options.actions[id].activated) {
				$(this).addClass("ui-ribbon-icon-active");
			}
		});		
		
		// link up mouse-out classes:
		// link up all the objects in the ribbon:
		$(".ui-ribbon-group-subgroup-object", this.element).bind('mouseleave', {widget: this}, function(event) {
			var widget = event.data.widget;
			var id = $(this).attr("id");
			
			if(widget.options.actions[id] && widget.options.actions[id].enabled && !widget.options.actions[id].activated) {
				$(this).removeClass("ui-ribbon-icon-active");
			}
		});		
		
	},
	
	_bindClickObjects: function() {
		// link up all the objects in the ribbon:
		$(".ui-ribbon-group-subgroup-object", this.element).bind('click', {widget: this}, function(event) {
			var widget = event.data.widget;
			var id = $(this).attr("id");
			
			if(widget.options.actions[id] && widget.options.actions[id].enabled) {
				widget.options.actions[id].func();
				return true;
			} else {
				return false;
			}
		});	
	},	
	
	// ========
	// Enable and Disable Ribbon Objects
	// ========
	enable: function(id) {
		if(this.options.actions[id] && this.options.actions[id].element) {
			this.options.actions[id].enabled = true;
			$(".ui-ribbon-icon-enabled", this.options.actions[id].element).show();
			$(".ui-ribbon-icon-disabled", this.options.actions[id].element).hide();
		}			
	},
	
	disable: function(id) {
		if(this.options.actions[id]) {
			this.options.actions[id].enabled = false;
			$(".ui-ribbon-icon-enabled", 	this.options.actions[id].element).hide();
			$(".ui-ribbon-icon-disabled", 	this.options.actions[id].element).show();
			$(this.options.actions[id].element).removeClass("ui-ribbon-icon-active");
		}
	},
	
	// ========
	// Activate/deactivate Ribbon objects
	// ========
	activate: function(id) {
		if(this.options.actions[id] && this.options.actions[id].element) {
			this.options.actions[id].activated = true;
			$(this.options.actions[id].element).addClass("ui-ribbon-icon-active");
		}			
	},
	
	deactivate: function(id) {
		if(this.options.actions[id]) {
			this.options.actions[id].activated = false;
			$(this.options.actions[id].element).removeClass("ui-ribbon-icon-active");			
		}
	},

	// ========
	// make the ribbon large (full size) or small (short)
	// ========	
	toggle: function() {
		this._toggle(null, $(".ui-ribbon-toggle", this.element).get(0), this);
		$(this.element).trigger("ribbontoggle");
	},
	
	_toggle: function(event, element, ui) {
		// flip the image:
		CVPortal.switchImg($("img", element).get(0));
		if(ui.options.toggled) ui.options.toggled = false; else ui.options.toggled = true;
		
		// thrown an event that we changed a preference object to the state manager:
		$(ui.options.StateManager).trigger("UserPrefs:changePref", [{"name": "ribbontoggle", "value": ui.options.toggled}]);
		
		// change the ribbon class:
		$(ui.element).toggleClass("ui-ribbon-group-minimized");
		$(".ui-ribbon-group-subgroup:gt(0) img", ui.element).each(function() {
			CVPortal.switchImg(this);
		});
	},

	// ========
	// Default Functions - supers
	// ========	
    _setOption: function( key, value ) {
		this.options[ key ] = value;
	},	
	
	destroy: function() {
		// jquery ui 1.8 - call the base destroy function
		$.Widget.prototype.destroy.call( this );	
	}
});

/******************************************
 *
 *	Drop Menu - Custom jQuery Widget 
 *	- facilitates easy hovering menus that work together (close each other)
 *  
 ******************************************/
$.widget( "custom.dropmenu", {
	options: {
		delay:       600,		
		onHover:     true,		
		onClick:     false,		
		selectable:  "",		// selector to recognize the class that can be clicked on to 'select' (such as ".ui-selectable")
		selected:    "",		// the class to apply to the currently selected item ("ui-selected")
		keepOpen:    true, 		// keeps dropdown open after clicking the item - added for compatability only. Mostly should be used with {keepOpen: false}
		dropElement: ".lc_dropdown_menu",
		position:    "below", 	// below | above | left | right
		align:       "left", 	// left | right | middle | top | bottom
		hover_active: 0
	},
	
    _create: function() {
        if(! this._isDuplicate()) {
			$(this.element).addClass("ui-dropmenu");						// mark this as already a hover
			//$(this.element).disableSelection();
			var nid = "hover_" + new Date().getTime() + "_" + Math.floor(Math.random()*1000);
			this._setOption("hover_id", nid);	// create a hover ID for tracking  
			if( ! $(this.element).attr("id")) { $(this.element).attr("id", nid); }
			if(this.options.onHover) this._bindHover();
			if(this.options.onClick) this._bindClick();
			
			// try to lcoate the drop element when init:
			this._findDropElement();
			
			// set up the selection capabilities 
			// if there are @data or the options are provided, 
			// then set the options to the values of the @data attrs
			if(this.options.selectable == "" && $(this.element).data("dropmenu-selectable")) this.options.selectable = $(this.element).data("dropmenu-selectable")
			if(this.options.selected == "" && $(this.element).data("dropmenu-selected"))  	 this.options.selected = $(this.element).data("dropmenu-selected");
			if(this.options.selectable != "") this._bindSelectable();
        } 
    },
	
	_findDropElement: function() {
		// store the drop element:
		this.dropElement = $(this.options.dropElement, this.element).get(0);
		$(this.dropElement).css("position", "absolute");		
	},
	
    _setOption: function( key, value ) {
		this.options[ key ] = value;
	},
	
    _isDuplicate: function() {
    	if($(this.element).hasClass("ui-dropmenu")) { return true; }
    	else { return false; }
    },
    
	// the class this.options.selectable controls which objects can be selected
	// and the class this.options.selected indicates which CSS class to attach when an object is "selected" (by click)
	_bindSelectable: function() {
		$(this.options.selectable, this.element).click({widget: this}, function(event) {
			$(event.data.widget.options.selectable, event.data.widget.element).each(function() { $(this).removeClass(event.data.widget.options.selected); });
			$(this).addClass(event.data.widget.options.selected);
		});
	},
	
    _bindClick: function() {
    	$(this.element).click({widget: this}, function(event) {
			if(event.data.widget.options.hover_active != 1 || event.data.widget.options.keepOpen) {
				event.data.widget.open();
				// prevent clicks from inside the widget to trigger its closing:
				return false;
			}
    	});
    	$("body").bind("click", {widget: this}, function(event) {
			// prevents the drop-down from being closed by a data-picker access
			var elem = $(event.target).get(0);
			while(elem) {
				if($(elem).hasClass("ui-datepicker-header") || $(elem).hasClass("ui-datepicker-calendar")) return false;
				elem = elem.parentNode;
			}			
    		event.data.widget.close();
    	});
    },
    
    _bindHover: function() {
    	// hover in:
    	$(this.element).mouseenter({widget: this}, function(event) {
				clearTimeout(event.data.widget.timeout);
				event.data.widget.open();
		});
		
		// hover out:
    	$(this.element).mouseleave({widget: this}, function(event) {
				event.data.widget._setOption("hover_active", 0);
				event.data.widget.timeout = setTimeout("$('#"+$(event.data.widget.element).attr("id")+"').dropmenu('close');", event.data.widget.options.delay);
		}); 
    },

	open: function() {
		if(! this.dropElement) {
			// if there is no registered drop element, check for it
			this._findDropElement();		
		}
		this._setOption("hover_active", 1);
		$(this.element).addClass("xref_hover");
		$(this.dropElement, this.element).show();
		
		// close ALL other drop-down plugins at this time:
		$('.ui-dropmenu').dropmenu('exclusiveClose', [$(this.element).attr("id")]);
	},

	testClose: function() {
		if(this.options.hover_active == 0) {
			this.close();
		}
	},
	
	// forces all other drop-downs to close to the exclusion of the current one:
	exclusiveClose: function(id) {
		if($(this.element).attr("id") != id) {
			this.close();
		}
	},

	close: function() {
		this.options.hover_active = 0;
		$(this.dropElement, this.element).hide();
		$(this.element).removeClass("xref_hover");
	},
	
	destroy: function() {
		// refuse to actually destroy this widget as this causes problems with other jQuery widgets (datepicker)
		return;
		// insure that the drop menu is closed if it is going to be destroyed for any reason:
		this.close();
		this.element.removeClass('ui-dropmenu').unbind('hover');

		// jquery ui 1.8 - call the base destroy function
		$.Widget.prototype.destroy.call( this );
	}
});

/******************************************
 *
 *	Check Box List- Custom jQuery Widget 
 *	- facilitates a list of checkboxes which may have a "Select All" option
 *  
 ******************************************/
$.widget( "custom.checkboxlist", {
	options: {
		allStringKey: "all",
		useAllKey: true
	},
	
    _create: function() {
        if(! this._isDuplicate()) {
			$(this.element).addClass("ui-checkboxlist"); // mark this as already a cboxlist
			
			if(this.options.toggleList) this._setToggleList();
			this._bindClicks();
        }
    },
    
    _setOption: function( key, value ) {
		this.options[ key ] = value;
	},
	
	_setToggleList: function() {
		this._allSelector = $(this.options.toggleList, this.element).get(0); 
		$(this.options.toggleList, this.element).bind('click', {widget: this}, function(event) {
			var widget = event.data.widget;
			if(this.checked == true) { widget.selectAll(); }
			if(this.checked == false) { widget.deselectAll() }
		});
	},
	
	_bindClicks: function() {
		var widget = this;
		$("input:checkbox", this.element).each(function() {
			if(this != widget._allSelector) {
				$(this).bind("click", { ui: widget }, function(event) {
					var widget = event.data.ui;

					// handle the ALL SELECTOR if it is set:
					if(widget._allSelector) {
						var total = widget._countCheckboxes(false);
						var checked = widget._countCheckboxes(true);
						if(total == checked) widget._allSelector.checked = true;
						else widget._allSelector.checked = false;		
					}					
				});
			}
		});
	},
	
    _isDuplicate: function() {
    	if($(this.element).hasClass("ui-checkboxlist")) { return true; }
    	else { return false; }
    },
    
    // returns either the count of checked checkboxes (checkedOnly=true), or the count of all checkboxes (checkedOnly=false)
    _countCheckboxes: function(checkedOnly) {
    	var total = 0;
    	var checked = 0;
    	var widget = this;
		$("input:checkbox", this.element).each(function() {
			if(this != widget._allSelector) total++;
			if(this.checked == true && this != widget._allSelector) checked++; 
		}); 
		if(checkedOnly == true) {
			return checked;
		} else {
			return total;
		}
    },
    
    selectAll: function() {
    	$("input:checkbox", this.element).each(function() {
    		this.checked = true;
    	});
    },
    
    deselectAll: function () {
    	$("input:checkbox", this.element).each(function() {
    		this.checked = false;
    	});    
    },

	stringify: function() {
		var str = "";
		var total = this._countCheckboxes(false);
		var checked = this._countCheckboxes(true);
		var widget = this;
		
		if(checked == total && this.options.useAllKey == true) {
			return this.options.allStringKey;
		} else {	
			$("input:checkbox", this.element).each(function() {
				if(widget._allSelector != this && this.checked == true) str += $(this).val() + ",";
			});
			return str;
		}
	},
	
	fromString: function(inString) {
		var values = inString.split(/,/);
		
		if(this.options.useAllKey == true && values[0] == this.options.allStringKey) {
			this.selectAll();
		} else {
			this.deselectAll();
			for(var i = 0; i < values.length; i++) {
				$("input:checkbox[value='"+values[i]+"']", this.element).each(function() {
					this.checked = true;
				});
			}
			
			// handle the ALL SELECTOR if it is set:
			if(this._allSelector) {
				var total = this._countCheckboxes(false);
				var checked = this._countCheckboxes(true);
				if(total == checked) this._allSelector.checked = true;
				else this._allSelector.checked = false;		
			}
		}
	},
	
	destroy: function() {
		this.element.removeClass('ui-checkboxlist');

		// jquery ui 1.8 - call the base destroy function
		$.Widget.prototype.destroy.call( this );
	}
});
}(jQuery));
/**
 * TextAreaExpander plugin for jQuery
 * v1.0
 * Expands or contracts a textarea height depending on the
 * quatity of content entered by the user in the box.
 *
 * By Craig Buckler, Optimalworks.net
 *  
 * As featured on SitePoint.com:
 * http://www.sitepoint.com/blogs/2009/07/29/build-auto-expanding-textarea-1/
 *
 * Please use as you wish at your own risk.
 */

/**
 * Usage:
 *
 * From JavaScript, use:
 *     $(<node>).TextAreaExpander(<minHeight>, <maxHeight>);
 *     where:
 *       <node> is the DOM node selector, e.g. "textarea"
 *       <minHeight> is the minimum textarea height in pixels (optional)
 *       <maxHeight> is the maximum textarea height in pixels (optional)
 *
 * Alternatively, in you HTML:
 *     Assign a class of "expand" to any <textarea> tag.
 *     e.g. <textarea name="textarea1" rows="3" cols="40" class="expand"></textarea>
 *
 *     Or assign a class of "expandMIN-MAX" to set the <textarea> minimum and maximum height.
 *     e.g. <textarea name="textarea1" rows="3" cols="40" class="expand50-200"></textarea>
 *     The textarea will use an appropriate height between 50 and 200 pixels.
 */

(function($) {

	// jQuery plugin definition
	$.fn.TextAreaExpander = function(minHeight, maxHeight) {

		var hCheck = !($.browser.msie || $.browser.opera);

		// resize a textarea
		function ResizeTextarea(e) {

			// event or initialize element?
			e = e.target || e;

			// find content length and box width
			var vlen = e.value.length, ewidth = e.offsetWidth;
			if (vlen != e.valLength || ewidth != e.boxWidth) {

				if (hCheck && (vlen < e.valLength || ewidth != e.boxWidth)) e.style.height = "0px";
				var h = Math.max(e.expandMin, Math.min(e.scrollHeight, e.expandMax));

				e.style.overflow = (e.scrollHeight > h ? "auto" : "hidden");
				e.style.height = h + "px";

				e.valLength = vlen;
				e.boxWidth = ewidth;
			}

			return true;
		};

		// initialize
		this.each(function() {

			// is a textarea?
			if (this.nodeName.toLowerCase() != "textarea") return;

			// set height restrictions
			var p = this.className.match(/expand(\d+)\-*(\d+)*/i);
			this.expandMin = minHeight || (p ? parseInt('0'+p[1], 10) : 0);
			this.expandMax = maxHeight || (p ? parseInt('0'+p[2], 10) : 99999);

			// initial resize
			ResizeTextarea(this);

			// zero vertical padding and add events
			if (!this.Initialized) {
				this.Initialized = true;
				$(this).css("padding-top", 0).css("padding-bottom", 0);
				$(this).bind("keyup", ResizeTextarea).bind("focus", ResizeTextarea);
			}
		});

		return this;
	};

})(jQuery);
/******************************************
	Watermark v3.1.3 (March 22, 2011) plugin for jQuery
	http://jquery-watermark.googlecode.com/
	Copyright (c) 2009-2011 Todd Northrop
	http://www.speednet.biz/
	Dual licensed under the MIT or GPL Version 2 licenses.
 ******************************************/
(function(a,h,y){var w="function",v="password",j="maxLength",n="type",b="",c=true,u="placeholder",i=false,t="watermark",g=t,f="watermarkClass",q="watermarkFocus",l="watermarkSubmit",o="watermarkMaxLength",e="watermarkPassword",d="watermarkText",k=/\r/g,s="input:data("+g+"),textarea:data("+g+")",m="input:text,input:password,input[type=search],input:not([type]),textarea",p=["Page_ClientValidate"],r=i,x=u in document.createElement("input");a.watermark=a.watermark||{version:"3.1.3",runOnce:c,options:{className:t,useNative:c,hideBeforeUnload:c},hide:function(b){a(b).filter(s).each(function(){a.watermark._hide(a(this))})},_hide:function(a,r){var p=a[0],q=(p.value||b).replace(k,b),l=a.data(d)||b,m=a.data(o)||0,i=a.data(f);if(l.length&&q==l){p.value=b;if(a.data(e))if((a.attr(n)||b)==="text"){var g=a.data(e)||[],c=a.parent()||[];if(g.length&&c.length){c[0].removeChild(a[0]);c[0].appendChild(g[0]);a=g}}if(m){a.attr(j,m);a.removeData(o)}if(r){a.attr("autocomplete","off");h.setTimeout(function(){a.select()},1)}}i&&a.removeClass(i)},show:function(b){a(b).filter(s).each(function(){a.watermark._show(a(this))})},_show:function(g){var p=g[0],u=(p.value||b).replace(k,b),h=g.data(d)||b,s=g.attr(n)||b,t=g.data(f);if((u.length==0||u==h)&&!g.data(q)){r=c;if(g.data(e))if(s===v){var m=g.data(e)||[],l=g.parent()||[];if(m.length&&l.length){l[0].removeChild(g[0]);l[0].appendChild(m[0]);g=m;g.attr(j,h.length);p=g[0]}}if(s==="text"||s==="search"){var i=g.attr(j)||0;if(i>0&&h.length>i){g.data(o,i);g.attr(j,h.length)}}t&&g.addClass(t);p.value=h}else a.watermark._hide(g)},hideAll:function(){if(r){a.watermark.hide(m);r=i}},showAll:function(){a.watermark.show(m)}};a.fn.watermark=a.fn.watermark||function(p,o){var t="string";if(!this.length)return this;var s=i,r=typeof p===t;if(r)p=p.replace(k,b);if(typeof o==="object"){s=typeof o.className===t;o=a.extend({},a.watermark.options,o)}else if(typeof o===t){s=c;o=a.extend({},a.watermark.options,{className:o})}else o=a.watermark.options;if(typeof o.useNative!==w)o.useNative=o.useNative?function(){return c}:function(){return i};return this.each(function(){var B="dragleave",A="dragenter",z=this,i=a(z);if(!i.is(m))return;if(i.data(g)){if(r||s){a.watermark._hide(i);r&&i.data(d,p);s&&i.data(f,o.className)}}else{if(x&&o.useNative.call(z,i)&&(i.attr("tagName")||b)!=="TEXTAREA"){r&&i.attr(u,p);return}i.data(d,r?p:b);i.data(f,o.className);i.data(g,1);if((i.attr(n)||b)===v){var C=i.wrap("<span>").parent(),t=a(C.html().replace(/type=["']?password["']?/i,'type="text"'));t.data(d,i.data(d));t.data(f,i.data(f));t.data(g,1);t.attr(j,p.length);t.focus(function(){a.watermark._hide(t,c)}).bind(A,function(){a.watermark._hide(t)}).bind("dragend",function(){h.setTimeout(function(){t.blur()},1)});i.blur(function(){a.watermark._show(i)}).bind(B,function(){a.watermark._show(i)});t.data(e,i);i.data(e,t)}else i.focus(function(){i.data(q,1);a.watermark._hide(i,c)}).blur(function(){i.data(q,0);a.watermark._show(i)}).bind(A,function(){a.watermark._hide(i)}).bind(B,function(){a.watermark._show(i)}).bind("dragend",function(){h.setTimeout(function(){a.watermark._show(i)},1)}).bind("drop",function(e){var c=i[0],a=e.originalEvent.dataTransfer.getData("Text");if((c.value||b).replace(k,b).replace(a,b)===i.data(d))c.value=a;i.focus()});if(z.form){var w=z.form,y=a(w);if(!y.data(l)){y.submit(a.watermark.hideAll);if(w.submit){y.data(l,w.submit);w.submit=function(c,b){return function(){var d=b.data(l);a.watermark.hideAll();if(d.apply)d.apply(c,Array.prototype.slice.call(arguments));else d()}}(w,y)}else{y.data(l,1);w.submit=function(b){return function(){a.watermark.hideAll();delete b.submit;b.submit()}}(w)}}}}a.watermark._show(i)})};if(a.watermark.runOnce){a.watermark.runOnce=i;a.extend(a.expr[":"],{data:function(c,d,b){return!!a.data(c,b[3])}});(function(c){a.fn.val=function(){var e=this;if(!e.length)return arguments.length?e:y;if(!arguments.length)if(e.data(g)){var f=(e[0].value||b).replace(k,b);return f===(e.data(d)||b)?b:f}else return c.apply(e,arguments);else{c.apply(e,arguments);a.watermark.show(e);return e}}})(a.fn.val);p.length&&a(function(){for(var b,c,d=p.length-1;d>=0;d--){b=p[d];c=h[b];if(typeof c===w)h[b]=function(b){return function(){a.watermark.hideAll();return b.apply(null,Array.prototype.slice.call(arguments))}}(c)}});a(h).bind("beforeunload",function(){a.watermark.options.hideBeforeUnload&&a.watermark.hideAll()})}})(jQuery,window);
/**
 * jQuery ScrollTo
 * Copyright (c) 2007-2012 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
 * Dual licensed under MIT and GPL.
 * @author Ariel Flesler
 * @version 1.4.3.1
 */
;(function($){var h=$.scrollTo=function(a,b,c){$(window).scrollTo(a,b,c)};h.defaults={axis:'xy',duration:parseFloat($.fn.jquery)>=1.3?0:1,limit:true};h.window=function(a){return $(window)._scrollable()};$.fn._scrollable=function(){return this.map(function(){var a=this,isWin=!a.nodeName||$.inArray(a.nodeName.toLowerCase(),['iframe','#document','html','body'])!=-1;if(!isWin)return a;var b=(a.contentWindow||a).document||a.ownerDocument||a;return/webkit/i.test(navigator.userAgent)||b.compatMode=='BackCompat'?b.body:b.documentElement})};$.fn.scrollTo=function(e,f,g){if(typeof f=='object'){g=f;f=0}if(typeof g=='function')g={onAfter:g};if(e=='max')e=9e9;g=$.extend({},h.defaults,g);f=f||g.duration;g.queue=g.queue&&g.axis.length>1;if(g.queue)f/=2;g.offset=both(g.offset);g.over=both(g.over);return this._scrollable().each(function(){if(e==null)return;var d=this,$elem=$(d),targ=e,toff,attr={},win=$elem.is('html,body');switch(typeof targ){case'number':case'string':if(/^([+-]=)?\d+(\.\d+)?(px|%)?$/.test(targ)){targ=both(targ);break}targ=$(targ,this);if(!targ.length)return;case'object':if(targ.is||targ.style)toff=(targ=$(targ)).offset()}$.each(g.axis.split(''),function(i,a){var b=a=='x'?'Left':'Top',pos=b.toLowerCase(),key='scroll'+b,old=d[key],max=h.max(d,a);if(toff){attr[key]=toff[pos]+(win?0:old-$elem.offset()[pos]);if(g.margin){attr[key]-=parseInt(targ.css('margin'+b))||0;attr[key]-=parseInt(targ.css('border'+b+'Width'))||0}attr[key]+=g.offset[pos]||0;if(g.over[pos])attr[key]+=targ[a=='x'?'width':'height']()*g.over[pos]}else{var c=targ[pos];attr[key]=c.slice&&c.slice(-1)=='%'?parseFloat(c)/100*max:c}if(g.limit&&/^\d+$/.test(attr[key]))attr[key]=attr[key]<=0?0:Math.min(attr[key],max);if(!i&&g.queue){if(old!=attr[key])animate(g.onAfterFirst);delete attr[key]}});animate(g.onAfter);function animate(a){$elem.animate(attr,f,g.easing,a&&function(){a.call(this,e,g)})}}).end()};h.max=function(a,b){var c=b=='x'?'Width':'Height',scroll='scroll'+c;if(!$(a).is('html,body'))return a[scroll]-$(a)[c.toLowerCase()]();var d='client'+c,html=a.ownerDocument.documentElement,body=a.ownerDocument.body;return Math.max(html[scroll],body[scroll])-Math.min(html[d],body[d])};function both(a){return typeof a=='object'?a:{top:a,left:a}}})(jQuery);
/*! waitForImages jQuery Plugin - v1.4.1 - 2012-10-12
* https://github.com/alexanderdickson/waitForImages
* Copyright (c) 2012 Alex Dickson; Licensed MIT */
(function(e){var t="waitForImages";e.waitForImages={hasImageProperties:["backgroundImage","listStyleImage","borderImage","borderCornerImage"]},e.expr[":"].uncached=function(t){if(!e(t).is('img[src!=""]'))return!1;var n=new Image;return n.src=t.src,!n.complete},e.fn.waitForImages=function(n,r,i){var s=0,o=0;e.isPlainObject(arguments[0])&&(n=arguments[0].finished,r=arguments[0].each,i=arguments[0].waitForAll),n=n||e.noop,r=r||e.noop,i=!!i;if(!e.isFunction(n)||!e.isFunction(r))throw new TypeError("An invalid callback was supplied.");return this.each(function(){var u=e(this),a=[],f=e.waitForImages.hasImageProperties||[],l=/url\(\s*(['"]?)(.*?)\1\s*\)/g;i?u.find("*").andSelf().each(function(){var t=e(this);t.is("img:uncached")&&a.push({src:t.attr("src"),element:t[0]}),e.each(f,function(e,n){var r=t.css(n),i;if(!r)return!0;while(i=l.exec(r))a.push({src:i[2],element:t[0]})})}):u.find("img:uncached").each(function(){a.push({src:this.src,element:this})}),s=a.length,o=0,s===0&&n.call(u[0]),e.each(a,function(i,a){var f=new Image;e(f).bind("load."+t+" error."+t,function(e){o++,r.call(a.element,o,s,e.type=="load");if(o==s)return n.call(u[0]),!1}),f.src=a.src})})}})(jQuery);