/* $Id: LiveContent/ui/skins/base/js/lcCore.js 1.103 2014/04/14 20:04:34GMT milind Exp  $ */

// ==========================================
//	UI State Manager -
//
//		- used to aggregate events to all components / modules
// 		- also maintains a 'computed' hash, which can be augmented by 'computation functions'
//			- incoming values into the hash are run through all computation functions, and then a "statechange" event is thrown
//
// ==========================================
function StateManager() {
	this.computed = {};
	this.computeFunctions = new Array();
};

StateManager.prototype = {
	get: function(name) { return this.computed[name] },
	setOptions: function(options) {
		for(var i in options) {
			this.computed[i] = options[i];
		}
		$.ajaxSetup({
		  headers: {ajax: "true"},
		  statusCode: {
		    222: function() {
				window.location.reload();
		    }
		  }
		});
		this.compute();
	},

	addComputation: function(func) {
		if(typeof func == "function") {
			this.computeFunctions.push(func);
		}
	},

	compute: function() {
		for(var i = 0; i < this.computeFunctions.length; i++) {
			var computeResult = this.computeFunctions[i](this);
			for(var key in computeResult) {
				this.computed[key] = computeResult[key];
			}
		}
		$(CVPortal.State).trigger("statechange", [this.computed]);
	}
}

// ==========================================
//	User Preference Object -
//
//		- not persisted to the server
//		- cookie based hash of values
//
// ==========================================
function UserPrefs() {
	this.prefs = {};

	if (typeof(localStorage) == 'undefined' ) {
		// if local storage is not supplied, use a cookie:
		var cookieVal = CVPortal.readCookie("UserPrefs");
		if(cookieVal) { this.prefs = $.evalJSON(cookieVal); }
	} else {
		try {
			var lsVal = localStorage.getItem("UserPrefs");
			if(lsVal) { this.prefs = $.evalJSON(lsVal); }
		} catch (e) { }
	}

	$(CVPortal.State).bind("UserPrefs:changePref", {UserPrefs: this}, function(event, data) {
		if(data) event.data.UserPrefs.set(data.name, data.value);
	});
}

UserPrefs.prototype = {
	onChange: function() {
		$(CVPortal.State).trigger("UserPrefs:onChangePref", [this.prefs]); // if anyone is generically listening for changes
	},

	// accessors to the hash:
	set: function(name, value) {
		this.prefs[name] = value;			  					 // update the hash

		if (typeof(localStorage) == 'undefined' ) {
			// if local storage is not supplied, use a cookie:
			CVPortal.createCookie("UserPrefs", $.toJSON(this.prefs), 30); 	 // store any changes to our cookie
		} else {
			try {
				localStorage.setItem("UserPrefs", $.toJSON(this.prefs));
			} catch (e) { }
		}
		$(CVPortal.State).trigger("UserPrefs:onChangePref", [this.prefs]); // if anyone is generically listening for changes
	},

	get: function(name, defaultValue) {
		var ret = this.prefs[name];
		if(typeof(ret) == "undefined") {
			if(typeof(defaultValue) == "undefined") {
				ret = null;
			}
			else {
				this.set(name,defaultValue);
				ret = this.prefs[name];
			}
		}
		return ret;
	}
};

// ==========================================
//	SCT Service Wrapper function and prototype
//
//  Wraps calls shared by LiveContent,
//  Trisoft, etc.  Same function calls,
//  but different function contents.
//
// ==========================================

/*
	Usage examples:
	window.SCTsw = new SCTServiceWrapper();
	SCTsw.initialize({});
	alert(SCTsw.version);
	SCTsw.getLiveContentBaseURL();
*/

function SCTServiceWrapper() {
	this.version = "1.0";
}

SCTServiceWrapper.prototype = {

	/*	===============
		Initialize
		===============
	*/
	//Options should be a JSON object:  {} if empty.
	initialize: function(options) {
		// currently does nothing
	},

	/*	===============
		URL context
		===============
	*/
	getLiveContentBaseURL: function() {
		return(CVPortal.getBaseURL());
	},

	getLiveContentURLwithBaseParams : function(xql) {
		return(CVPortal.getURLwithBaseParams(xql));
	},

	fetchSkinImage: function(fn) {
		return CVPortal.fetchSkinImage(fn);
	},

	/*	===============
		Browser context
		===============
	*/
	getBrowserType : function(){
		//returns IE, MOZ, or STANDARDS
		return(CVPortal.getBrowserType());
	},

	isMobile : function(){
		return CVPortal.panelFactory.getPanel(CVPortal.panelFactory.safePanelIds[0]).mobile;
	},

	/*	===============
		User context
		===============
	*/
	getUser : function(){
		return(CVPortal.meta.get("user"));
	},

	/*	===============
		Doc context
		===============
	*/

	getCurrentDocId : function() {
		if ( CVPortal.components.lcContent.currentDoc ) {
			return(CVPortal.components.lcContent.currentDoc.id);
		} else {
			return "";
		}
	},
	getPubLang : function() {
		return(CVPortal.meta.get("pub.lang"));
	},

	getPubIdWithVersion : function() {
		return(CVPortal.meta.get("pub.pubid"));
	},

	// Publications not published from Trisoft should return "".
	getPubIdWithoutVersion : function() {
		if (CVPortal.meta.get("pub.langversion.trisoft.basename")) {
			return(CVPortal.meta.get("pub.langversion.trisoft.basename"));
		} else {
			return "";
		}
	},

	getPubVersion : function() {
		if (CVPortal.meta.get("pub.langversion.version")) {
			return(CVPortal.meta.get("pub.langversion.version"));
		} else {
			return "";
		}
	},

	getTSPubId: function () {
		if (CVPortal.meta.get("pub.langversion.trisoft.fmapid.lng")) {
			return(CVPortal.meta.get("pub.langversion.trisoft.fmapid.lng"));
		} else {
			return "";
		}
	},

	getTSImageLanguages: function () {
		if (CVPortal.meta.get("pub.langversion.trisoft.fishfallbacklngimages.lng")) {
			return(CVPortal.meta.get("pub.langversion.trisoft.fishfallbacklngimages.lng"));
		} else {
			return "";
		}
	},

	getTSImageResolutions: function () {
		if (CVPortal.meta.get("pub.langversion.trisoft.outputformat.fishresolutions")) {
			return(CVPortal.meta.get("pub.langversion.trisoft.outputformat.fishresolutions"));
		} else {
			return "";
		}
	},

	getTSTopicId : function() {
		if (CVPortal.components.lcContent.currentDoc.trisoft_topic_ishref) {
			return CVPortal.components.lcContent.currentDoc.trisoft_topic_ishref;
		} else {
			return "";
		}
	},

	getTSTopicLngref : function() {
		if (CVPortal.components.lcContent.currentDoc.trisoft_topic_ishlngref) {
			return CVPortal.components.lcContent.currentDoc.trisoft_topic_ishlngref;
		} else {
			return "";
		}
	},

	getTSTopicLang : function() {
		if (CVPortal.components.lcContent.currentDoc.trisoft_topic_doclang) {
			return(CVPortal.components.lcContent.currentDoc.trisoft_topic_doclang);
		} else {
			return "";
		}
	},

	getTSTopicVersion : function() {
		if (CVPortal.components.lcContent.currentDoc.trisoft_topic_version) {
			return(CVPortal.components.lcContent.currentDoc.trisoft_topic_version);
		} else {
			return "";
		}
	},

	getTSTopicInternalRevision : function() {
		if (CVPortal.components.lcContent.currentDoc.trisoft_topic_fishrevctr) {
			return(CVPortal.components.lcContent.currentDoc.trisoft_topic_fishrevctr);
		} else {
			return "";
		}
	},

	/*	============================
		Comment context (in a topic)
		============================
	*/

	// Option may be show, hide, or null (empty).
	toggleCommentPane : function(option) {
		CVPortal.components.lcContent.toggleCommentingPane(option);
		var doccontentwrapper = $(".doc_content_wrapper");
		var doccontentwidth = doccontentwrapper.innerWidth();
		if ($("#xform_footer").is(":visible")) {
			doccontentwrapper.css("width", doccontentwrapper.attr("data-width"));
			$(".ui-topic-title").css("max-width", doccontentwidth - 140);
			if ($.browser.msie){
				var previewwrapperwidth = $(".preview_area_wrapper").css("min-width");
				$(".preview_area_wrapper").width(previewwrapperwidth);
			}
		} else {
			if ($.browser.msie) {
				$(".preview_area_wrapper").css("width", "");
			}
			$(".ui-topic-title").css("max-width", "");
			$(".doc_content_wrapper").css("width", "");
		}
		if (window.SplitterCmntPane) {
			window.SplitterCmntPane.resizePanel();
		}
	},

	getCommentingIdentifiers : function() {
		return(CVPortal.meta.get("commenting.identifiers"));
	},
	
	getPollingFreqSecs: function() {
		var secs = CVPortal.meta.get("commenting.polling.freq.secs");
		var defSecs = 30;
		
		if (typeof(secs) == "undefined" || ! secs) {
			secs = defSecs;
		}
		// CVPortal.warn("WEF: polling interval in secs="+secs);
		return(secs);
	},

	/*	======================================
		Comment context (in the comment table)
		======================================
	*/

	defineStateManager : function() {
		return CVPortal.State;
	},

	stateAddComputation : function(value) {
		CVPortal.State.addComputation(value);
	},

	stateCompute : function() {
		CVPortal.State.compute();
	},

	hideLoadingIndicator: function() {
		// Increase the time to test the loading indicator 
		// (checked in version should always be 0)
		setTimeout(function() {
			$('#loading-div').fadeOut(200, function() {
				$(this).remove();
			});
		}, 0);
	},

	showLoadingIndicator: function(options) {
        var loadingDiv = $("<div id='loading-div' />");
        var loadingPicture = SCTsw.fetchSkinImage("loading48.gif");
        loadingDiv.html("<div class=\"loading-icon\"><img src=\"" + loadingPicture + "\" alt=\"\" /></div>");
        $("body").append(loadingDiv);
		loadingDiv.fadeIn(400);
	},

	/*	===============
		Permissions

		Comment (XForm) permissions:
			"Use XForms" 			= permission to view comments
			"Create public XForms" 	= permission to add a comment / reply to a comment
			"Change XForm Status" 	= permission to change comment status
			"Manage XForms" 		= permission to delete a comment

		===============
	*/

	hasThisPermission : function(perm) {
		return(CVPortal.checkPermission(perm));
	},

	checkPermissions : function(elem) {
		CVPortal.checkPermissions(elem);
	},

	/*	===============
		Messages
		===============
	*/

	getResource : function(msg) {
		return(CVPortal.getResource(msg));
	},

	/*	===============
		LC API methods
		===============
	*/

	// Added callback function because of cross domain requests of Trisoft to LC (SCT-Commenting)
	// XDomainRequest does not support synchronous calls, so a callback function is added (asynchronous calls are performed)
	// http://msdn.microsoft.com/en-us/library/ie/cc288060%28v=vs.85%29.aspx
	ajaxPostXMLData : function(url, xml, callbackCompleted) {
		CVPortal.ajaxPostXMLData(url, xml, callbackCompleted);
	},

	pollingOn: function() {
		// start polling the server for new comments from the backbone collection
		// poll the server every 10 seconds for changes
		// first render the collection
		if (typeof (CommentSetCollection) == "undefined") {
			return;
		}
		var milliSecs = (this.getPollingFreqSecs()) * 1000;
		CommentSetCollection.bindPollingClick();
		CommentSetCollection.fetch({
			interval: milliSecs,
			add: true,
			success: function() {
				window.CommentSetTopicViewObj.render();
				window.CommentSetTopicViewObj.completeInitialRender();
				// Collapse all commends if the collapsed state was set previously
				if ($(".ui-comment-expand-all").is(":visible")) {
					window.CommentSetTopicViewObj.collapseAllCmnts();
				}
				// Add listener that check if all images are loaded in the comment pane
				$('#xform_footer').waitForImages(function() {
					// All images are loaded in the comment pane (resize panel)
					if (window.SplitterCmntPane) {
						window.SplitterCmntPane.resizePanel();
					}
				});
			}
		});

		CommentSetCollection.stream({
			interval: milliSecs,
			add: true
		});
		// bind modelAdded function so that it gets called each time any user adds a comment to a given topic from any browser session to reset pollinginterval timer for all
		CommentSetCollection.bind('add',CommentSetCollection.modelAdded,CommentSetCollection);

	},

	pollingOff: function() {
		if (typeof (CommentSetCollection) == "undefined") {
			return;
		}
		CommentSetCollection.unBindPollingClick();
		CommentSetCollection.unstream();
		CommentSetCollection.unbind('add');
	},

	prepareDropDowns: function() {
		CVPortal.components.lcCommon.prepareDropDowns();
	},

	prepareDateFilter: function() {
		CVPortal.components.lcCommentTable.prepareDateFilter();
	},

	_fixEvent: function(event) {
		return (CVPortal._fixEvent(event));
	},

	currentLang: function() {
		return(CVPortal.currentLang);
	},

	warn: function(msg) {
		CVPortal.warn(msg);
	}
};

// ==========================================
//	Global Portal Object
//
//		- root object for all components, panels and helper objects
//
// ==========================================
function CV_Portal() {
	CVPortal = this;
	//LOAD COMPONENTS:
	this.componentName = "Portal";
	this.components = new Object();
	this.meta =	new lcMeta();
	this.help =	new lcHelp();

	// create the state manager:
	this.State = new StateManager();
	this.Prefs = new UserPrefs();
	this.Prefs.onChange();

	// optionally, load PanelFactory and ControlFactory
	if(window["CV_panelFactory"]) this.panelFactory = new CV_panelFactory();

	//Get a date object for all:
	this.date = new Date();

	// init the ajax object for UTF-8
	$.ajaxSetup({"contentType": "application/x-www-form-urlencoded;charset=utf-8"});

	// log our success:
	this.info("SDL LiveContent Initiated");
}

CV_Portal.prototype  = {
	/*********************
	* Four different simple debugging methods:
	*
	* --> REDIRECT TO lcDebugger()
	*
	**********************/
	info:  function(message) { try { if(typeof console != "undefined") console.info(message);  } catch(e) {} },
	warn:  function(message) { try { if(typeof console != "undefined") console.warn(message);  } catch(e) {} },
	error: function(message) { try { if(typeof console != "undefined") console.error(message); } catch(e) {} },
	debug: function(message) { try { if(typeof console != "undefined") console.debug(message); } catch(e) {} },
	/*********************
	* Use timeStart(message) and timeEnd(message) to wrap code you want check for excecution time.
	*	CVPortal.timeStart("message one");
	*	(...some code to be timed here...)
	*	CVPortal.timeEnd("message one");
	* Outputs to IE, FF and Chrome debug console in milli seconds.
	* timeStart() timeEnd() pairs can be nested but message must be unique for each pair. 
	* Output example: "142ms message one" 
	**********************/
	timeStart:  function(message) {
		var startTime = (new Date()).getTime();
		if (typeof(this.startTimers) == "undefined") {
			this.startTimers = {};
		}
		this.startTimers[message] = startTime;
	},
	timeEnd:  function(message) {
		var msg;
		if(typeof(this.startTimers[message]) != "undefined") {
			var endTime = (new Date()).getTime();
			var lapse = endTime - this.startTimers[message];
			delete this.startTimers[message];
			msg = lapse + "ms " + message;
		}
		else {
			msg = "NO STARTTIME FOUND IN HASH";
		}
		try {
			if(typeof console != "undefined") console.warn(msg);
		} catch(e) {}
	},

	/***********************
	* Utility:
	* Forming URLs:
	************************/
	getUIURL: function() {
		var ret = this.getBaseURL() + "web/ui.xql";
		return ret;
	},

	getBaseURL: function() {
		return this.meta.get("rel_app_url");
	},

	getV2URL: function(realm) {
		if(realm.length) {
			var u = this.meta.get("rel_app_url") + "v2/";
			for(var index in realm) {
				if(index != realm.length - 1) {
					u += encodeURIComponent(realm[index]) + "/";
				} else {
					u += encodeURIComponent(realm[index]);
					break;
				}
			}
			return u;
		} else {
			return this.meta.get("rel_app_url")  + "v2/" + encodeURIComponent(realm) + "/";
		}
	},

	getAbsURLwithBaseParams: function(url) {
		return window.location.protocol + "//" + window.location.host + this.getURLwithBaseParams(url);
	},

	getURLwithBaseParams: function(url) {
		var leader = "?";
		if(url.indexOf("?") != -1) {
			leader = "&";
		}
		var ret =  this.meta.get("server_url") + url;
		ret += leader + "c=t";
		return ret;
	},

	/****************************
	*
	* Resource Loading Utilities
	*
	*****************************/
	fetchSkinFile: function(fn) { 	return this.getUIURL() + "?action=html&resource=" + fn + "&unique=" + (new Date().getTime()); },
	fetchSkinImage: function(fn) {	return this.getBaseURL() + "ui/img/" + fn;	},
	fetchScript: function(fn) {		return this.getBaseURL() + "ui/js/" + fn; },
	fetchStyle: function(fn) { 		return this.getUIURL() 	 + "?action=style&resource=" + fn; },
	fetchConfig: function(fn) {  	return this.getBaseURL() + "ui/config/" + fn + "?unique=" + (new Date().getTime()); },

	/*****************************
	*
	* Browser Type Detection: Functions to differentiate between Firefox and IE:
	*
	*****************************/
	getBrowserType: function() {
		if($.browser.msie) { return "IE";
		} else if ($.browser.mozilla) { return "MOZ";
		} else {
			// assume SAFARI / CHROME => "STANDARDS" compliant browsers
			return "STANDARDS";
		}
	},

	// returns true  if this browser is in the default "mobile" list
	checkMobileBrowser: function() {
		var browserType = navigator.userAgent.toLowerCase();
		if( browserType.match(/Android/i) ||
			browserType.match(/iPad/i) ||
			browserType.match(/iPhone/i) ||
			browserType.match(/iPod/i)){
			return true; 	// this is mobile
		} else {
			return false; 	// this is NOT mobile
		}
	},

	/*****************************
	*
	* Browser Detection: Functions to differentiate between IE, Firefox, Chrome, Opera, Safari and iPad:
	*
	*****************************/
	getBrowser: function() {
		var browserType = navigator.userAgent.toLowerCase();

		if (browserType.indexOf("msie")!=-1) return "msie";
		else if (browserType.indexOf("firefox")!=-1) return "firefox";
		else if (browserType.indexOf("chrome")!=-1) return "chrome";//should be befor Safari check!!!
		else if (browserType.indexOf("opera")!=-1) return "opera";
		else if (browserType.indexOf("ipad")!=-1) return "ipad";//should be befor Safari check!!!
		else if (browserType.indexOf("safari")!=-1) return "safari";
		else return "STANDARDS";
	},

	/****************************
	*
	*  Events: Cross Browser event handling:
	*
	*****************************/
	_fixEvent: function(evt) { // returns the event that called this function:
	    return (evt) ? evt : ((window.event) ? window.event : "No Event Located.");
	},

	eventGetElement: function(evt) { // get the Source Element from an Onclick event!
		evt = CVPortal._fixEvent(evt);
		if(evt.target) {
			return (evt.target.nodeType == 3) ? evt.target.parentNode : evt.target;
		} else {
			return evt.srcElement;
		}
	},

	cancelEventBubble: function (e) {
		e = CVPortal._fixEvent(e);
		// alert("CANCELING BUBBLE!");
		if (!e) var e = window.event;
		e.cancelBubble = true;
		if (e.stopPropagation) e.stopPropagation();
		return e;
	},

	// checks an keystroke in a field and then calls its evaluation function if it is an Enter.
	redirectEnter: function(event, targetFunc) {
		var evt = CVPortal._fixEvent(event);
		if(evt.keyCode=="13")	{
			 eval(targetFunc);
		}
	},

	/*********************************
	*
	* XML Compatibility functions for cross browser use:
	*
	*
	***********************************/
	// send an AJAX call with XML post data:
	ajaxPostXMLData: function(url, xmlString, callbackCompleted) {
		//alert("POSTING: " + xmlString);
		if(CVPortal.getBrowserType() == "MOZ") {
			//send the ajax with the post data:
			var httpRequest = new XMLHttpRequest();
			httpRequest.open('POST', url, true);
			httpRequest.onreadystatechange = function() { if (httpRequest.readyState == 4) { if(callbackCompleted) callbackCompleted(httpRequest); }};
			httpRequest.setRequestHeader("Content-Type", "application/xml");
			httpRequest.send(xmlString);
		} else if(CVPortal.getBrowserType() == "IE") {
			xmlDOM = new ActiveXObject("Microsoft.XMLDOM");
			xmlDOM.async = false;
			xmlDOM.loadXML(xmlString);
			// Send the current selection
			var objHTTP = new ActiveXObject("microsoft.XMLHTTP") ;
		    objHTTP.open('POST', url, true) ;
			objHTTP.onreadystatechange = function() { if (objHTTP.readyState == 4) { if(callbackCompleted) callbackCompleted(objHTTP); }};
			objHTTP.send(xmlDOM);
			// alert(objHTTP.responseText);
		} else {
			var obj;
			$.ajax({
				type: "POST",
				url: url,
				data: {xml: xmlString},
				dataType: "xml",
				cache: false,
				async: true,
				complete: function(xhr, textStatus) {
					obj = xhr;
					if(callbackCompleted) callbackCompleted(xhr);
				}
			});
		}
	},

	// get text from a node in a cross-browser compat-way
	getNodeText: function(xmlNode) { // Return text from an XML Node
		return $(xmlNode).text();
	},

	/**********************
	*
	* Client Sizing and Information
	*
	***********************/
	getClientHeight: function() {
		if(this.getBrowserType() == "IE") {
			return document.documentElement.offsetHeight;
		} else if(this.getBrowserType() == "MOZ" || this.getBrowserType() == "STANDARDS") {
			return window.innerHeight;
		} else {
		 	CVPortal.warn(" Failed determine supported browser when fetching client height.  " + CVPortal.getBrowserType());
		 	return document.body.offsetHeight; //  adefault ?
		}
	},

	getClientWidth: function() {
		if(this.getBrowserType() == "IE") {
			return document.documentElement.offsetWidth;
		} else if(this.getBrowserType() == "MOZ" || this.getBrowserType() == "STANDARDS") {
			return window.innerWidth;
		} else {
			CVPortal.warn(" Failed determine supported browser when fetching client width.  " + CVPortal.getBrowserType());
			return document.body.offsetWidth;
		}
	},

	// a wrapper for resizing the client:
	clientResize: function() {
		CVPortal.panelFactory.refreshClientSize();
		CVPortal.panelFactory.applyVariedDimensions();
		$(CVPortal.State).trigger("lc:clientResize");
	},

	/***********************************
	*
	* Basic Component Loading and Extending:
	*
	************************************/
	loadComponents: function(setName) {
		// CVPortal.debug(" {Portal} *** Loading All Components ***");
		var portal = this;
		var startDate = new Date();

		if(! window.LiveContentComponents ) {
			CVPortal.error(" {CVPortal} [ FATAL ] Unable to load page components!");
			alert(CVPortal.getResource("msg.missingresource"));
			return;
		}

		for(var index in window.LiveContentComponents) {
			try {
				var comp = window.LiveContentComponents[index];
				//load each component:
				var compObject = CVPortal.extendComponent(new cvBaseComponent(comp.id), new window[comp.id]());

				// store each property
				for(var propIndex in comp.props) {
					var prop = comp.props[propIndex];
					compObject.setProp(prop.name, prop.value);
				}

				//
				// EXTENSIONS:
				// for each item that has an @extension attribute, extend our component
				if(window[comp.id + "_extension"]) {
					compObject = CVPortal.extendComponent(compObject, new window[comp.id+ "_extension"]());
				}

				//
				// Connect VIRTUAL TARGETS
				for(var itemIndex in comp.panels) {
					var item = comp.panels[itemIndex];
					compObject.vPanels[item.virtual] = item.target;
				}

				portal.components[comp.id] = compObject;
			} catch(e) {
				// the component does not exist, its function is not declared!
				CVPortal.error(" {Portal} Failed to load component from basic declaration: " + comp.id);
				CVPortal.error(" {Portal} Failed to load on exception: " + e);
			}
		}

		CVPortal.debug(" {Portal} Loading all components took " + (new Date() - startDate) + " MS");
		// Init all of the components that have been registered:
		var initDate = new Date();
		for(var compObject in CVPortal.components) {
			CVPortal.components[compObject].init();
			CVPortal.components[compObject].extensionInit();
		}
		CVPortal.debug(" {Portal} Initiating all components took " + (new Date() - initDate) + " MS");

		// see if there is a language selector on the page to build:
		this.buildLanguageSelector();
	},

	buildLanguageSelector: function(context) {
		// ***********************
		// if a language selector is present on the page, then fill it in with options / values
		// + if it has already been filled in (there are <option> children), do not repeat.
		// ***********************
		$("select[name='app.language']", context).each(function() {
			var select = this;
			$(this).remove("option");
			$.ajax({
				url: CVPortal.getURLwithBaseParams("ui.xql?action=langs"),
				type: "GET",
				dataType: "xml",
				success: function(xml) {
					$("option", xml).each(function() {
						var value = $(this).attr('value');
						var text = $(this).text();
						var selected = "";
						if(CVPortal.currentLang == value) selected = " selected='selected' ";
						$(select).append("<option value='" + value + "' "+selected+" lcuistring='lang."+value+"'>" + text + "</option>");
					});
					select.value = CVPortal.currentLang;
				}
			});
		});
	},

	//
	// Extend two pre-existing components (mash them together!)
	extendComponent: function(comp, ext) {
		var newC = {};
		$.extend(newC, comp, ext);
		return newC;
	},

	/**************************************
	*
	*   LOCALIZATION / INTERNATIONALIZATION
	* 	-load Resource Bundles
	*	-retrieve resources
	*
	**************************************/
	selectLanguage: function(event) {
		var elem = CVPortal.eventGetElement(event);
		CVPortal.setLanguage($(elem).val());
	},

	setLanguage: function(lang) {
		// store the choice in a cookie, so even login prompt is in new lang
		this.createCookie("LangPref", lang);
		//alert("setting cookie: Langpref" + " to " + lang);

		// first load the new resource bundle:
		CVPortal.meta.set("language", lang);
		CVPortal.loadResources(lang);

		var url = CVPortal.getURLwithBaseParams("session.xql") + "&action=set_lang&lang="+lang+"&context=app.lang";
		$.ajax( {
			type: "POST",
			url: url,
			dataType: "xml",
			success: function(xml) {
				// set, assumed.
			}
		});
		
		// store the language into the database preferences file:
		var xml = "<lcform type='system' fid='preference' docid='"+CVPortal.meta.get("user")+"' name='preference' status=''><language>"+lang+"</language></lcform>"

		// Write the new comment (or the new reply) to the database,
		// then get the name, created, and modified values from the response.
		var url = CVPortal.getURLwithBaseParams("xforms.xql?action=write&fid=preference");
		CVPortal.ajaxPostXMLData(url, xml);
		
		// find all lcui:string elements and switch them to the new language:
		$("*[lcuistring]").each(function() {
			if(this.tagName == "INPUT") {
				if($(this).attr("lcuidefault") == "true") {
					if(this.defaultValue == this.value || this.value == "") {
						this.value = CVPortal.getResource($(this).attr("lcuistring"));
					}
					this.defaultValue = CVPortal.getResource($(this).attr("lcuistring"));
				} else if($(this).attr("lcuistring")) {
					$(this).val(CVPortal.getResource($(this).attr("lcuistring")));
				}
			} else if(this.tagName == "OPTION" && $(this.parentNode).attr("name") == "app.language") {
				$(this).html(CVPortal.getResource($(this).attr("lcuistring")) + " ("+this.value+")");
			} else if(this.tagName == "IMG") {
				this.src = CVPortal.fetchSkinImage(CVPortal.getResource($(this).attr("lcuistring")));
			} else if(this.tagName == "HEAD") {
				// no NOT break the head tag..
			} else {
				$(this).html(CVPortal.getResource($(this).attr("lcuistring")));
			}
		});

		$("*[lcuialt]").each(function() {
			$(this).attr("alt", CVPortal.getResource($(this).attr("lcuialt")));
			$(this).attr("title", CVPortal.getResource($(this).attr("lcuialt")));
		});

		// make sure the page title gets changed:
		// Issue 670: set document title from meta tag
		var title_meta = CVPortal.meta.get("window.title")

		//only set the window title if the page has provided a localized title (for example, publication pages do not provide this)
		if(title_meta) {
			var title = CVPortal.getResource(title_meta);
			// alert("setting document title, value= " + title);
			document.title = title;
		}

		// fire off a set languag event:
		$(CVPortal.State).trigger("lc:changeLanguage");

	},

	translateContent: function(context) {
		// find all lcui:string elements and switch them to the new language:
		$("*[lcuistring]", context).each(function() {
			if(this.tagName == "INPUT") {
				if($(this).attr("lcuidefault") == "true") {
					if(this.defaultValue == this.value || this.value == "") {
						this.value = CVPortal.getResource($(this).attr("lcuistring"));
					}
					this.defaultValue = CVPortal.getResource($(this).attr("lcuistring"));
				} else if($(this).attr("lcuistring")) {
					$(this).val(CVPortal.getResource($(this).attr("lcuistring")));
				}
			} else if(this.tagName == "OPTION" && $(this.parentNode).attr("name") == "app.language") {
				$(this).html(CVPortal.getResource($(this).attr("lcuistring")) + " ("+this.value+")");
			} else if(this.tagName == "IMG") {
				this.src = CVPortal.fetchSkinImage(CVPortal.getResource($(this).attr("lcuistring")));
			} else if(this.tagName == "HEAD") {
				// no NOT break the head tag..
			} else {
				$(this).html(CVPortal.getResource($(this).attr("lcuistring")));
			}
		});
	},

	loadResources: function(lang) {
		// CVPortal.debug(" {Portal} *** Loading Resources for language: " + lang  +" ***");
		var startDate = new Date();


		var url = this.getURLwithBaseParams("ui.xql?action=lang&lang=" + lang);
		var port = this;
		$.ajax({
			type: "GET",
			url: url,
			dataType: "json",
			async: false,
			cache: false,
			error: function() {
				CVPortal.error("Failed to load language resource: " + lang);
				alert(CVPortal.getResource("error.failedLanguageLoad") + ": " + lang);
			},
			success: function (jsonObj) {
				// ***********************
				// directly use the JSON object provided by the server:
				// ***********************
				port.currentLang = lang;
				port.resources = jsonObj;
				CVPortal.debug(" {Portal} Initiating all language resource took " + (new Date() - startDate) + " MS");
			}
		});
	},

	getResource: function(name) {
		var value = "Undefined";
		if(CVPortal.resources[name]) {
			value = CVPortal.resources[name];
		}
		return value;
	},

	// ================================================
	// 	UI - functions
	// ================================================
	// creates a <image> tag from a filename, and inserts the @title and @alt from the alt param
	createImage: function(fileName, altName, className) {
		var str = "<img src='"+CVPortal.fetchSkinImage(fileName)+"' alt='"+CVPortal.getResource(altName)+"' title='"+CVPortal.getResource(altName)+"' class='"+className+"'>";
		return str;
	},

	// switch a switch-ready image:
	switchImg: function(pimg) {
		var lcswitch = $(pimg).attr("switchfile");
		if(lcswitch) {
			var lcsrc = $(pimg).attr("file");
			pimg.src = CVPortal.fetchSkinImage(lcswitch);
			// execute the switch:
			$(pimg).attr("switchfile", lcsrc);
			$(pimg).attr("file", lcswitch);
			if($(pimg).attr("lcuiswitchalt")) {
				var tAlt = $(pimg).attr("lcuialt");
				$(pimg).attr("lcuialt", $(pimg).attr("lcuiswitchalt"));
				$(pimg).attr("lcuiswitchalt", tAlt);
				$(pimg).attr("title", CVPortal.getResource($(pimg).attr("lcuialt")));
				$(pimg).attr("alt", CVPortal.getResource($(pimg).attr("lcuialt")));
			}
		}
	},

	checkPermission: function(permission) {
		var uauth = permission.toUpperCase().replace(/\s+/g, "");
		var perms = CVPortal.meta.get("lc.identity.permissions");
		if(perms.indexOf(uauth) != -1) {
			return true;
		} else {
			return false;
		}
	},

	// hide admin tools div into current window
	hideAdminToolDiv: function(elem) {
		if(elem) {
			if ($(".widgetTable .adminToolItem:visible", elem).length <= 0) {
				$(".adminTools", elem).hide();
			}
		}
	},

	checkPermissions: function(elem) {
		var comp = this;
		if(elem) {
			// check permissions on any objects within the TOC HTML
			$("*[lcuiperm]", elem).each(function() {
				if(comp.checkPermission($(this).attr("lcuiperm"))) {
					// hide admin tools and XML Views for mobile devices
					if (CVPortal.panelFactory.getPanel(CVPortal.panelFactory.safePanelIds[0]).mobile) {
						var sClass = $(this).attr("class");
						if (($(this).attr("lcuiperm").toLowerCase().trim().indexOf("view source xml") != -1 ) || 
							(sClass != null && typeof(sClass) != "undifined" && 
							 sClass.toLowerCase().trim().indexOf("admintoolitem") != -1)) { 
							$(this).hide();
						} else {
							$(this).show();
						}
					} else {
						$(this).show();
					}
				} else {
					$(this).hide();
				}
			});
			// permissions may change what is visible on the screen:
			$(elem).trigger("resize");
		}
	},
	/***********************
	* Utility:
	* Checking Forms for Safe Name Strings:
	************************/
	validateFormName: function(str) {
		var regex = /[\'\"&#\?\+\*%\|<>:]/;
		if (str.search(regex) != -1)
			return false;
		var ws = /\s/g;
		var strMT = str.replace(ws, "");
		if (strMT == "")
			return false;
		return true;
	},

	/***********************
	* Utility:
	* Checking Config for Safe Name Strings:
	************************/
	validateConfigName: function(str) {
		var regex = /[\'\"&#\?\+\*%\|<>]/;
		if (str.search(regex) != -1)
			return false;
		var ws = /\s/g;
		var strMT = str.replace(ws, "");
		if (strMT == "")
			return false;
		return true;
	},

	/***********************
	* Utility:
	* Checking for Safe Publication Name Strings:
	************************/
	validatePubName: function(str) {
		var regex = /[\'\"&#\?\+\*%\|<>:]/;
		if (str.search(regex) != -1)
			return false;
		var ws = /\s/g;
		var strMT = str.replace(ws, "");
		if (strMT == "")
			return false;
		return true;
	},

	// ============================================================
	//
	//    		COOKIE HANDLING IN JS
	//
	// ============================================================
	createCookie: function(name,value,days) {
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		} else {
			var expires = "";
		}
		document.cookie = name+"="+value+expires+"; path=/";
	},

	readCookie: function(name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') { c = c.substring(1,c.length); }
			if (c.indexOf(nameEQ) == 0) { return c.substring(nameEQ.length,c.length); }
		}
		return null;
	},

	eraseCookie: function(name) {
		createCookie(name,"",-1);
	}
};


function lcMeta() {
	//Array of all registered MetaData objects:
	this.metaData = new Object();
	this.metaLength = 0;
	this.componentName = "MetaFactory";
}

lcMeta.prototype = {
	// retreive all meta data from a single page instance:
	loadMetaData: function() {
		var mF = this;
		var startDate = new Date();
		$("meta").each(function() {
			mF.metaData[$(this).attr("name")] = this.getAttribute("CONTENT");
			mF.metaLength++;
		});
		CVPortal.debug(" {Meta} Loading metadata took " + (new Date() - startDate) + " MS");
	},
	// retreive a Meta Value by ID
	get : function(metaId) {
		if(this.metaData[metaId]) {
			return this.metaData[metaId];
		} else {
			if(metaId == "language") {
				return "en"; // ALWAYS ASSUME ENGLISH, never return language = null;
			}
			return null;
		}
	},
	// set a meta Value by ID:
	set : function(metaId, metaValue) {
		if(! this.metaData[metaId]) {
			this.metaLength++;
		}
		this.metaData[metaId] = metaValue;
	},
	// return the length of the meta "array"
	metaCount: function() {
		return this.metaLength;
	},

	metaDebug: function() {
		CVPortal.info(" {META} ** Meta Factory Debug Dump **");
		for(var i in this.metaData) {
			if(this.metaData[i] == "") {
				CVPortal.warn("      [" + i + " > " + this.metaData[i] + "]");
			} else {
				CVPortal.debug("      [" + i + " > " + this.metaData[i] + "]");
			}
		}
		CVPortal.info(" {META} ** Completed Meta Factory Debug Dump **");
	},
	// load metadata from a chunk of HTML:
	loadMetaDataFromChunk: function(chunk) {
		var mF = this;
		var tStamp = new Date();
		CVPortal.debug(" {META} Loading meta data from new xhtml chunk.");
		$(chunk).children("meta").each(function() {
			if(! mF.metaData[$(this).attr("name")]) {
				mF.metaLength++;
			}
			mF.metaData[$(this).attr("name")] = this.getAttribute("CONTENT");
			CVPortal.debug(" {META} Loading Meta value from chunk: " + this.id + " > " + this.getAttribute("CONTENT"));
		});
	},

	/**************************************
	*
	*   Get URL Parameter
	* 	-pull a parameter off the URL string by name
	*
	**************************************/
	getUrlParam: function(name) {
	  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	  var regexS = "[\\?&]"+name+"=([^&#]*)";
	  var regex = new RegExp( regexS );
	  var results = regex.exec( location.href );
	  if( results == null ) {
	    // try a secondary method, if we are asking for docid:
	    if(name == "docid" && location.href.indexOf("/content/") != -1) {
	    	var bits = location.href.split('/');
	    	var contentPos = 0;
	    	for(var i in bits) {
	    		if(bits[i] == "content") {
	    			contentPos = i;
	    		}
	    	}
	    	if(bits.length >= parseInt(contentPos,10) + 4) {
	    		myBits = bits[parseInt(contentPos,10)+3];
	    		if(myBits.indexOf("?") != -1) {
	    			myBits = myBits.substr(0, myBits.indexOf("?"));
	    		}
				return myBits;
	    	} else {
	    		return "";
	    	}
	    } else {
	    	return "";
	    }

	  } else {
	    return results[1];
	  }
  }
};

/***************************************/
/*      XyEnterprise, copyright 2009  */
/*      cvHelpFactory.js version 4.0   */
/*      XYTAGGED, dated 9/22/2009    */
/***************************************/
function lcHelp() {
	// The single window that we want to keep open for help:
	this.helpWindow = null;
	this.componentName = "HelpFactory";
}

lcHelp.prototype = {
	processHelpButtons: function(context) {
		return;
		// checks the meta factory
		// calls hide or show on the provided context:
		// CVPortal.debug("Processing hide/show context sensitive help buttons.");
		if( CVPortal.meta.get("META_USER_HIDE_HELP_BTN") == null){
			if(CVPortal.meta.get("META_CONFIG_HELP_BTN") == 0) {
				this.hideHelpBtn(context);
			} else {
				this.showHelpBtn(context);
			}
		} else {
			if( CVPortal.meta.get("META_USER_HIDE_HELP_BTN") == 1){
				this.hideHelpBtn(context);
			} else {
				this.showHelpBtn(context);
			}
		}
	},

	showHelpBtn: function(context) {
		if(context != null ){
			$(".lcHelpButton",context).show();
		} else {
			$(".lcHelpButton").show();
		}
	},

	hideHelpBtn: function(context) {
		if(context != null) {
			$(".lcHelpButton",context ).hide();
		} else {
			$(".lcHelpButton").hide();
		}
	}
};

//
//  THE PANEL FACTORY
//
//

function CV_panelFactory() {
	// Panel Information
	this.componentName = "PanelFactory";
	this.id = "PanelFactory";
	this.panels = new Object();
	this.panels.length = 0;
	this.safePanelIds = new Array();  // A Document-Order list of IDs read from panels.xml

	//resize records:
	this.resizeRecords = new Object();
}

CV_panelFactory.prototype = {
	/*******************************
	*
	* SIMPLEST - Load Panel list:
	* -reads HTML dom looking for lc_panel="1" attributes
	* 	creates panels from each
	* -FIXED WIDTH only, does not attempt to do resizing or any dynamic sizing
	********************************/
	fixedLoadPanels: function(setName) {
		var fac = this;
		$("*[lc_panel='1']").each(function() {
			var p = fac.addPanel(this.id, null);
			p.className = this.getAttribute("class");

		});
		fac.refreshClientSize();
		$(window).bind("resize", function() { CVPortal.panelFactory.refreshClientSize(); });
		$(window).bind("orientationchange", function() { CVPortal.panelFactory.refreshClientSize(); });

	},

	/*******************************
	*
	* Load Panel list:
	* -reads panels.xml
	* -interprets widths, heights, and relations--creating the DIV elements as needed
	********************************/
	loadPanels: function(setName) {
		// CVPortal.debug(" {Panels} *** Loading All Panels ***");
		var pFac = this;
		var startDate = new Date();

		// Establish our Client Size
		pFac.refreshClientSize();

		$("*[data-panel='true']").each(function() {
			//
			//create the actual panel and add it to our panel array:
			// --does not have an element yet:
			var panel = pFac.addPanel($(this).attr("id"), this);
			pFac.safePanelIds.push(panel.id);  // store this ID immediately in our document-order list of panels:

			// HEIGHT AND WIDTH:
			// 1) set panel.height and panel.width (for applyVariedDimensions)
			panel.width = $(this).data("panel-width");
			panel.height = $(this).data("panel-height");

			//
			// attach a parent panel if it exists
			if($(this).data("panel-parent")) {
				panel.setParent($(this).data("panel-parent"));
			} else {
				panel.setParent(null); // set our parent to null as we are a top level element
			}
		});

		// force all the panels to resize themselves:
		pFac.applyVariedDimensions();
		// set up the trigger for WINDOW RESIZE to RESIZE all PANELS:
		$(window).bind("resize", function() { CVPortal.clientResize(); });
		$(window).bind("orientationchange", function () { $(window).trigger("resize"); });
		// report load time
		CVPortal.debug(" Loading and building all panels took " + (new Date() - startDate) + " MS");
	},

	createFakeStub: function() {
		// creates a fake stub panel object that keeps components from breaking:
			//otherwise, create a new control:
			return new CV_panel("fake_stub", this, null);
	},

	destroy: function() { },

	// *******************************************************
	//  Initiate Resize Handles and resizing panels:
	// *******************************************************
	initResize: function() {
		var pFac = this;
		// CVPortal.debug(" {Panels} Panel factory initiating resizing panels:");

		for(var i = 0; i < pFac.safePanelIds.length; i++) { //in pFac.panels) {
			// NOTE: Only thinking of one level deep here... no consideration for nested * panels...
			var panel = pFac.getPanel(pFac.safePanelIds[i]);

			if(panel.relation) {
				var rTarget = panel.relation.target;
				var orient = panel.relation.orient;

				//grab the actual panels:
				var primary = pFac.getPanel(panel.id);
				var secondary = pFac.getPanel(rTarget);
				// starting H / W:
				var startWidth = primary.width;
				var startHeight = primary.height;
				// track our parent panel:
				var parentPanel = pFac.getPanel(primary.getParent());

				// Create the OPTIONS object:
				var options = {
					side1: primary.id,
					side2: secondary.id,
					outline: true,
					resizeToWidth: true,
					type: orient
				};

				// Create the Splitter:
				$(parentPanel.getElement()).splitter( options );

				// Set our starting H / W:
				if(orient == "v") {
					/* *****
						#43123 - RtL panel arrangement (allow the primary panel to have *)
					****** */
					if(startWidth == "*") {
						var secWidth = parseInt(secondary.width,10);
						var fullWidth = pFac.getPanel(primary.parent).getPanelWidth();
						var primWidth = fullWidth - secWidth;
						$(parentPanel.getElement()).trigger("resize", [parseInt(primWidth,10)]);
					} else {
						$(parentPanel.getElement()).trigger("resize", [parseInt(startWidth,10)]);
					}
					if(primary.width == "0") {
						primary.collapsed = 1;
						$(parentPanel.getElement()).children(".hsplitbar, .vsplitbar").addClass("resize_disabled");
					}
				} else if(orient == "h") {
					$(parentPanel.getElement()).trigger("resize", [parseInt(startHeight,10)]);
					if(primary.height == "0") {
						primary.collapsed = 1;
						$(parentPanel.getElement()).children(".hsplitbar, .vsplitbar").addClass("resize_disabled");
					}
				}
				pFac.resizeRecords[secondary.id] = pFac.createResizeRecord(primary, secondary, orient);
			}
		}
	},

	expandPanel:function(id, resetIfZero) {
		var pFac = this;
		var primary = this.getPanel(id);
		var secondary = this.getPanel(primary.relation.target);

		//ensure that the primary and secondary panels are both visible:
		if($(primary.element).css("display") == "none") { $(primary.element).css("display", "block"); }
		if($(secondary.element).css("display") == "none") { $(secondary.element).css("display", "block"); }


		// ***************************************************
		// retrieve Resize Record
		var rr = this.getResizeRecord(secondary.id);
		// CVPortal.debug("{Resize} Retrieved resize record for " + primary.id + " vs. " + secondary.id);

		$(rr.parentPanel.getElement()).children(".hsplitbar, .vsplitbar").removeClass("resize_disabled");
		if(rr.orient == "v") {
			// CVPortal.debug("{Resize} Resizing a vertical set of panels");
			if(resetIfZero && rr.primWidth == 0) {   // Some Panels Start as 0... if primWidth == 0, set to half parent width
				// CVPortal.debug("{Resize} Resetting the panels to half the size of the parent");
				rr.primWidth = parseInt(rr.parentPanel.getPanelWidth(), 10) / 2;
				rr.secWidth = parseInt(rr.parentPanel.getPanelWidth(), 10) / 2;
			}
			primary.collapsed = 0;
			$(rr.parentPanel.getElement()).trigger("resize", [rr.primWidth]);
		} else {
			// CVPortal.debug("{Resize} Resizing a horizontal set of panels");
			if(resetIfZero && rr.primary.height == 0 && rr.prevReset != 1)  {  // Some Panels Start as 0... if primHeight == 0, set to half parent height
				// CVPortal.debug("{Resize} Resetting the panels to half the size of the parent");
				rr.primHeight = parseInt(rr.parentPanel.getPanelHeight(), 10) / 2;
				rr.secHeight = parseInt(rr.parentPanel.getPanelHeight(), 10) / 2;
				rr.prevReset = 1;
			}
			primary.collapsed = 0;
			$(rr.parentPanel.getElement()).trigger("resize", [rr.primHeight]);
		}
	},

	collapsePanel: function(id) {
		// get the two panels:
		var primary = this.getPanel(id);
		var secondary = this.getPanel(primary.relation.target);
		// ***************************************************
		// create a resize record to remember the SIZES:
		var rr = this.updateResizeRecord(primary, secondary);
		$(rr.parentPanel.getElement()).trigger("resize", [0]);
		primary.collapsed = 1;
		$(rr.parentPanel.getElement()).children(".hsplitbar, .vsplitbar").addClass("resize_disabled");
	},

	// ***************************************************************
	//		RESIZE RECORD HANDLING:
	// ***************************************************************
	getResizeRecord: function(id) {
		var rr = this.resizeRecords[id];
		if(rr == null) { return {}; }
		return rr;
	},

	updateResizeRecord: function(primary, secondary, orient) {
		var rr = this.resizeRecords[secondary.id];
		// update orient:
		if(orient) { rr.orient = orient; }
		// update PANEL DIMENSIONS:
		rr.primHeight = primary.getPanelHeight();	// PRIMARY
		rr.primWidth = primary.getPanelWidth();
		rr.secHeight = secondary.getPanelHeight();	// SECONDARY
		rr.secWidth = secondary.getPanelWidth();
		return rr;
	},

	createResizeRecord: function(primary, secondary, orient) {
		var rr = {};
		// PANEL POINTERS:
		rr.primary = primary;
		rr.secondary = secondary;
		rr.parentPanel = CVPortal.panelFactory.getPanel(primary.getParent());	// track our parent panel:
		// set RESIZE flags:
		primary.resized = true;
		secondary.resized = true;
		// PANEL DIMENSIONS:
		rr.primHeight = primary.getPanelHeight();		// PRIMARY
		rr.primWidth = primary.getPanelWidth();
		rr.secWidth = secondary.getPanelWidth();		// SECONDARY
		rr.secHeight = secondary.getPanelHeight();
		// remember our orientation
		rr.orient = orient;
		return rr;
	},

	flipPanels: function(id) {
		// get the two panels:
		var primary = this.getPanel(id);
		var secondary = this.getPanel(primary.relation.target);
		// ***************************************************
		// create a resize record to remember the SIZES:
		var rr = this.getResizeRecord(secondary.id);

		// Unbind RESIZE and REMOVE either splitbar CHILDREN
		$(rr.parentPanel.getElement()).unbind("resize");
		$(rr.parentPanel.getElement()).children(".hsplitbar").remove();
		$(rr.parentPanel.getElement()).children(".vsplitbar").remove();

		var orient = "v";
		if(rr.orient == "v") { orient = "h"; }
		rr.orient = orient; // set the Resize Record to remember the ORIENT

		// Create the NEW OPTIONS object:
		var options = {
			side2: secondary.id,
			side1: primary.id,
			outline: true,
			resizeToWidth: true,
			type: orient
		};

		// Create the Splitter and fix any lingering (non-)0px TOP problems
		$(rr.parentPanel.getElement()).splitter( options );
		if(orient == "v"){
			$(primary.getElement()).css("top", "0px");
			$(secondary.getElement()).css("top", "0px");
		} else {
			$(primary.getElement()).css("left", "0px");
			$(secondary.getElement()).css("left", "0px");
		}
	},

	//
	//  ASSIGNING VARIED HEIGHTS and WIDTHS to elements with * as h / w:
	//
	applyVariedDimensions: function(forced) {
		if(!forced) { forced = false; }
		var pFac = this;
		// CVPortal.debug(" {Panels} Panel factory assigning values to all (*) widths and heights");
		// WINDOWS WIDTH and HEIGHT and OFFSET for RELATIVE elements
		pFac.refreshClientSize(); // make sure we get this every time
		var calcH = pFac.height;
		var calcW = pFac.width;
		var calcTop = 0;
		var calcLeft = 0;

		// CVPortal.debug(" {Panels} Starting Varied W / H (" + calcH + " / " + calcW + ")");
		var varied = new Array(); // keep a list of the (*) H/W panels
		// ******************************************************************************************************************
		//  PASS 1 (of 2) on the panels, first to calculate all the H/W and T/L
		// 	-second pass sets all the H/W and T/L
		for(var i = 0; i < pFac.safePanelIds.length; i++) { //in pFac.panels) {
			// NOTE: Only thinking of one level deep here... no consideration for nested * panels...
			var p = pFac.getPanel(pFac.safePanelIds[i]);

			if(p.width != "*" && p.width != "na") { // if no width will be set (na) or the width will be set in Pass 2 (*)...
				if(p.resized != true) {		// if the panel has never been resized, then:
					p.setPanelWidth(null);  // use the internal width value (from panels.xml)
				}
				if(p.width != "100%") { //  p.getParent() == null -- PROCESS CHILDREN TOO
					// CVPortal.debug(" {Panels} W: Panel " + p.id + " is modifying the varied width: " + parseInt(p.getPanelWidth(), 10));
					calcW -= parseInt(p.getPanelWidth(), 10);		// mark this as a varied width
					calcLeft += parseInt(p.getPanelWidth(), 10);	// record this for left-bearing offsets (UNUSED)
				}
			}
			if(p.height != "*" && p.height != "na") { // if no height will be set (na) or the height will be set in Pass 2 (*)...
				if(p.resized != true) {			// if the panel has never been resized, then :
					p.setPanelHeight(null); 	// use the internal height value
				}
				if(p.height != "100%" && p.height != 0) { // && p.getParent() === null -- PROCESS CHILDREN TOO) {
					// CVPortal.debug(" {Panels} H: Panel " + p.id + " is modifying the varied height: " + parseInt(p.getPanelHeight(), 10));
					calcH -= parseInt(p.getPanelHeight(), 10);
					// calculate the "TOP" for offset elements:
					calcTop += parseInt(p.getPanelHeight(), 10);
					if(CVPortal.getBrowserType() == "MOZ") {
						calcTop += parseInt($(p.getElement()).css("margin-top"), 10);
						calcTop += parseInt($(p.getElement()).css("margin-bottom"), 10);
						calcTop += parseInt($(p.getElement()).css("margin-bottom"), 10);
					}
				}
			} else {
				p.calcTop = calcTop;
			}
			// store each panels offsets:
			p.calc_offSetTop = calcTop;
			p.calc_offSetLeft = calcLeft;
			//CVPortal.debug(" {panels} Left " + p.calc_offsetLeft + " TOP: " + p.calc_offSetTop);
		}
		// ******************************************************************************************************************
		// PASS 2, set * W / H
		// CVPortal.debug(" {Panels} Calcuated Varied W / H (" + calcH + " / " + calcW + ")");
		for(var i = 0; i < pFac.safePanelIds.length; i++) { //in pFac.panels) {
			// NOTE: Only thinking of one level deep here... no consideration for nested * panels...
			var panel = pFac.getPanel(pFac.safePanelIds[i]);
			// If the object used Varied Height, size it to the new calculated varied H / W
			if(panel.height == "*" && panel.resized != true) { // if this has NOT been resized...
				// CVPortal.debug(" {Panels} Setting Height of * Panel " + panel.id + " to " + calcH);
				calcH = panel.setPanelHeight(calcH + "px");
				// alert("GOING TO SET HEIGHT: " + pFac.safePanelIds[i] + " with height: " + calcH + " results in : " + panel.getPanelHeight());
			} else if(panel.height == "*" && panel.resized == true) { // if this has NOT been resized...
				// sometimes, we need to force the resize operation:
				calcH = panel.setPanelHeight(calcH + "px");
			}
			if(panel.width == "*" && (typeof(panel.resized) == "undefined" || panel.resized != true)) { // if this has NOT been resized...
				// CVPortal.debug(" {Panels} Setting Width of * Panel " + panel.id + " to " + calcW);
				calcW = panel.setPanelWidth(calcW + "px");
				// alert("GOING TO SET WIDTH: " + pFac.safePanelIds[i] + " with width: " + calcW + " results in : " + panel.getPanelWidth());
			} else if(panel.width == "*" && panel.resized == true) {
				/* *****
					#43123 - RtL panel arrangement (allow the primary panel to have *)
				****** */
				var rr = this.getResizeRecord(panel.id);
				var fullWidth = pFac.getPanel(panel.parent).getPanelWidth();
				var primWidth = parseInt(rr.primWidth, 10);
				var secWidth = fullWidth - primWidth;
				calcW = panel.setPanelWidth(secWidth + "px");
				//$(parentPanel.getElement()).trigger("resize", [parseInt(primWidth,10)]);
				//CVPortal.debug("Maybe a chance to resize : " + panel.id + " who has width of " + panel.width + " = " + panel.getPanelWidth());
			}
			$(panel.getElement()).trigger("resize");
		}
	},

	/*******************************
	*
	* Manipulate the Panel List:
	*
	********************************/
	addPanel: function(id, element) {
		var p;
		if(this.panels[id]) {
			//make sure the existing control points to the proper object!
			p = this.panels[id];
			if(element) { p.setElement(element); }
		} else {
			//otherwise, create a new control:
			p = new CV_panel(element, this);

			// add this panel the panel's array:
			this.panels[id] = p;
			this.panels.length++;
			// CVPortal.debug(" {Panels} Created new panel: " + id + ", panels array at length " + this.panels.length);
		}
		return p;
	},

	//  SAFE CONTROL FUNCTIONS:
	//    - components should call these safe functions against the factory
	//    - if the CTRL exists, the factory will pass the call through
	//    - if not, then no harm is done, and no worry of expcetions.
	setContent: function(id) {
		var p = this.getPanel(id);
		if(p) { p.setContent(); }
	},

	cleanContent: function(id) {
		var p = this.getPanel(id);
		if(p) { p.clean(); }
	},

	getPanel: function(id, component) {
		if(this.panels[id]) {
			// register each component that shares a panel
			if(component) {
				this.panels[id].registerSharedComponent(component);
			}
			return this.panels[id];
		} else {
			CVPortal.warn(" {Panel} Panel Factory searched for panel " + id + " and it was not found.  Returned 'undefined'");
			return null;
		}
	},

	refreshClientSize: function() {
		// Client Size information:
		this.height = CVPortal.getClientHeight();
		this.width = CVPortal.getClientWidth();
		// CVPortal.info(" {Panel} Requested: Client Size (width: " + this.width + ", height: " + this.height + ")");
	},

	setLanguage: function(lang) {
		// Search the Entire DOM... performance issue?
		$("*[cvResTag='1']").each(function() {
			var resName = this.getAttribute("cvResName");
			$(this).html(CVPortal.getResource(resName));
		});
	}
};


// ====================================================
//
//
//  THE Panels it creates and controls
//
// ====================================================
function CV_panel(element, factory) {
	// Set up our metadata and pointers:
	var panel = this;
	this.element = element;
	this.factory = factory;
	this.parent = null;
	this.panelType = "";
	this.resizeHandler = "";

	// decide early and remember if this panel is display to a mobile device:
	this.mobile = CVPortal.checkMobileBrowser();

	//for shared components:
	this.sharedComps = {};
	this.sharedLast = "";

	// drop out for fake-stubs
	if(element == null) { return; }

	// store the ID:
	this.id=element.id;

	// if there is a registered relation:
	if($(element).data("panel-relation-target")) {
		panel.relation = new Object();
		panel.relation.target = $(element).data("panel-relation-target");
		panel.relation.orient = $(element).data("panel-relation-orient");
	}

	$(element).children("div.panel-shared[id='self']").each(function() {
		panel.sharedComps["self"] = this;
		// $(this).addClass(panel.element.className); //.getAttribute("class"));
	});
}

CV_panel.prototype = {
	// set our internal information:
	setContent: function(element, component) {
		if(component) {
			if( ! this.sharedComps[component])
				this.registerSharedComponent(component);

			$(this.sharedComps[component]).get(0).innerHTML = "";
			$(this.sharedComps[component]).html(element);

			//add help button proccesing here...
			CVPortal.help.processHelpButtons(this.sharedComps[component]);
			// select the actual component:
			this.selectShared(component);
		} else {
			if(this.element) {
				$(this.element).get(0).innerHTML = "";
				$(this.element).html(element);
				//add help button proccessing here...
				CVPortal.help.processHelpButtons(this.element);
			} else {
				this.errorNoElement();
			}
		}
		if(this.element) {
			$(this.element).trigger("resize");
		}
	},

	clean: function(component) {
		if(component) {
			$(this.sharedComps[component]).get(0).innerHTML = "";
		} else {
			$(this.element).get(0).innerHTML = "";
		}
	},

	setPanelHeight: function(h, repeated) {
		// alert(this.id + " .. IN HEIGHT: " + h + " => " + this.height);
		if(h == null) {
			h = this.height;
		}
		if(this.element && h != "*" && h != "na") {
			if((CVPortal.getBrowserType() == "MOZ" || CVPortal.getBrowserType() == "SAFARI") && typeof(h) != "string") {
				// CVPortal.warn(" {Panels} Setting panel height in Firefox, appending a PX to : " + h);
				h = h + "px";
			}
			if(CVPortal.getBrowserType() == "MOZ" && typeof(h) == "string" && h.indexOf('px') != -1) {
				var height = parseInt(h, 10);
				var bL = parseInt($(this.element).css("border-top-width"), 10);
				var bR = parseInt($(this.element).css("border-bottom-width"), 10);
				var pR = parseInt($(this.element).css("padding-top"), 10);
				var pL = parseInt($(this.element).css("padding-bottom"), 10);
				var mR = parseInt($(this.element).css("margin-top"), 10);
				var mL = parseInt($(this.element).css("margin-bottom"), 10);
				height -= bL + bR + pR + pL + mR + mL;
				//CVPortal.warn("In mozilla height set, starting with " + parseInt(h, 10) + " and end with " + height);
				if(this.parent && repeated != true) {
					var parentPanel = this.factory.getPanel(this.parent);
					var bL = parseInt($(parentPanel.element).css("border-top-width"), 10);
					var bR = parseInt($(parentPanel.element).css("border-bottom-width"), 10);
					var pR = parseInt($(parentPanel.element).css("padding-top"), 10);
					var pL = parseInt($(parentPanel.element).css("padding-bottom"), 10);
					var mR = parseInt($(parentPanel.element).css("margin-top"), 10);
					var mL = parseInt($(parentPanel.element).css("margin-bottom"), 10);

					var mirror = bL + bR + pR + pL + mR + mL;
					height -= (mirror / 2);
				}
				//alert("Firefox Height check (" + this.id + "): initial H: " + parseInt(h, 10) + " modified H: " + height);
				if(height < 0) { height = 0; }
				h = height + "px";
			}

			// special mozilla processing to get the document (full_page, height = 100%) to full size
			if((CVPortal.getBrowserType() == "MOZ" || CVPortal.getBrowserType() == "STANDARDS") && this.parent == null && h == "100%") {
				this.factory.refreshClientSize();
				h = this.factory.height + "px";
				$(this.element).css("height", h);
				//$(this.element).height(this.factory.height);
			} else {
				if (typeof(h) == "number") {
					h = h + "px";
				}
				$(this.element).css("height", h);
				//$(this.element).height(h);
			}

			// if a panel is a shared panel, then we need to assure that all shared component spaces are given the same dimensions:
			for(var i in this.sharedComps) {
				//$(this.sharedComps[i]).height($(this.element).height());
				// CVPortal.info(" {Shared Panels} " + i + " set height: " + $(this.sharedComps[i]).height());
			}
			//alert(this.id + " ... " + $(this.element).height());
			return parseInt(h, 10);
		} else {
			this.errorNoElement();
		}
	},

	setPanelWidth: function(w, repeated) {
		if(w == null) {
			w = this.width;
		}
		if(this.element && w != "*" && w != "na") {
			if(w == "100%" ) {
				if(this.parent) {
					//alert("Width as Parent: " + $(this.factory.getPanel(this.parent).getElement()).css("width"));
					$(this.element).css("width", $(this.factory.getPanel(this.parent).getElement()).css("width"));
				} else {
					//alert("WIDTH FULL! " + CVPortal.panelFactory.width);
					$(this.element).css("width", CVPortal.panelFactory.width);
				}
			 } else {
				if(CVPortal.getBrowserType() == "MOZ" && typeof(w) != "string") {
					//CVPortal.warn(" {Panels} Setting panel width in Firefox, appending a PX to : " + w);
					w = w + "px";
					if (typeof(w) == "number") {
						w = w + "px";
					}
					$(this.element).css("width", w);
				}
				if(typeof(w) == "string" &&  w.indexOf('px') != -1) {
					var origW = w;
					var width = parseInt(w, 10);
					//alert("GOING IN WIDTH: " + width);
					var bL = parseInt($(this.element).css("border-left-width"), 10);
					var bR = parseInt($(this.element).css("border-right-width"), 10);
					var pR = parseInt($(this.element).css("padding-left"), 10);
					var pL = parseInt($(this.element).css("padding-right"), 10);
					var temp = bL + bR + pR + pL;
					//alert("REDUCTION VALUE: " + temp);
					width -= temp;
					//alert("FINAL OUT: " + width);
					if(this.parent && repeated != true) {
						var parentPanel = this.factory.getPanel(this.parent);
						var bL = parseInt($(parentPanel.element).css("border-left-width"), 10);
						var bR = parseInt($(parentPanel.element).css("border-right-width"), 10);
						var pR = parseInt($(parentPanel.element).css("padding-left"), 10);
						var pL = parseInt($(parentPanel.element).css("padding-right"), 10);
						var mR = parseInt($(parentPanel.element).css("margin-left"), 10);
						var mL = parseInt($(parentPanel.element).css("margin-right"), 10);

						var mirror = bL + bR + pR + pL + mR + mL;
						//width -= (mirror / 2);
						width -= mirror;
					}
					if(width < 0) { width = 0; }
					//CVPortal.warn("Firefox Width check: panel ID = " + this.id + ", starting with " + w + " and end with " + width);
					w = width + "px";
					if (typeof(w) == "number") {
						w = w + "px";
					}
					$(this.element).css("width", w);
					w = origW;
				}
				return parseInt(w, 10);
			 }
			// if a panel is a shared panel, then we need to assure that all shared component spaces are given the same dimensions:
			for(var i in this.sharedComps) {
				$(this.sharedComps[i]).width($(this.element).width());
				// CVPortal.info(" {Shared Panels} " + i + " set width: " + $(this.sharedComps[i]).width());
			}
		} else {
			this.errorNoElement();
		}
	},

	getPanelHeight: function(outer) {
		if(this.element) {
			if(CVPortal.getBrowserType() == "MOZ" && outer != true) {
				return $(this.element).innerHeight();
			} else {
				return $(this.element).outerHeight({ margin: true });
			}
		} else {
			this.errorNoElement();
			return 0;
		}
	},

	getPanelWidth: function() {
		if(this.element) {
			return $(this.element).outerWidth({ margin: true });
		} else {
			this.errorNoElement();
			return 0;
		}
	},

	//
	// Element Controllers:
	getElement: function(component) {
		// if this is a shared panel, make sure to return the proper element:
		if(component) {
			return this.sharedComps[component];
		} else {
			//otherwise use the default element:
			if(this.element) {
				return this.element;
			} else {
				this.errorNoElement();
				return null;
			}
		}
		return null;
	},

	setElement: function(element) {
		this.element = element;
		return this.element;
	},

	errorNoElement: function () {
		CVPortal.error(" Encountered panel " + this.id + " without a registered element!");
	},

	//
	// Parerntal Controllers
	setParent: function(p) { // Set the Parent Panel's ID
		this.parent = p;
	},
	getParent: function() { // Get the Parent Panel's ID
		return this.parent;
	},

	loadTmpl: function(tmpl, async, component) {
		var panel = this;
		var tmpl = CVPortal.fetchSkinFile(tmpl);
		$.ajax( {
			type: "GET",
			url: tmpl,
			dataType: "html",
			async: async,
			error: function() {
				CVPortal.error(" Failed to load panel template ");
			},
			success: function(html) {
				panel.setContent(html, component);
				// CVPortal.info("    {Panels} Loaded template into the panel " + panel.id + " for component: " + component);
			}
		});
	},

	/**********************
	*
	* Helper functions to avoid ever needing to access a panel's element:
	*
	***********************/
	registerSharedComponent: function(component) {
		if(!component) component = "self";
		if(this.element) {
			if($("div.cvSharedComp[id='"+component+"']", this.element).length > 0) {
				return;
			}
			// Append the new element for storage in this panel:  (and hide it!)
			$(this.element).append("<div class='cvSharedComp' id='" + component + "' style='display:none;'>&nbsp</div>");
			var panel = this; // store
			// store our new element in a simple hash so that when a component wants to access this panel, it gets this <div/>
			$("#" + component, this.element).each(function() {
				panel.sharedComps[component] = this;
				$(this).addClass(panel.element.className); //.getAttribute("class"));
			});
		} else {
			this.errorNoElement();
		}
	},

	selectShared: function(component) {
		if(this.sharedComps[component]) {
			for(var i in this.sharedComps) {
				if(i != component) {
					this.sharedComps[i].style.display = "none";
				}
			}
			// update the two part history trail--current and the last shared comp:
			this.sharedComps[component].style.display = ""; //("normal");
			if(this.sharedLast != this.sharedCurrent) {
				this.sharedLast = this.sharedCurrent;
			}
			this.sharedCurrent = component;
		}
	},

	unselectShared: function(component) {
		if(this.sharedComps[component]) {
			for(var i in this.sharedComps) {
				// blank all shared component spaces
				this.sharedComps[i].style.display = "none";
			}
			if(this.sharedLast != "") {
				this.sharedComps[this.sharedLast].style.display = ""; //("normal");
				// update the two part history trail--current and last shared comp:
				var temp = this.sharedCurrent;
				this.sharedCurrent = this.sharedLast;
				this.sharedLast = temp;
			}
		} else {
			CVPortal.error(" {Panels} Component " + component + " tried to unSelect a shared component with which it has not registered.");
		}

	},

	refresh: function(component) {
		if(this.sharedComps[component]) {
			// nothing needed
		}
	},

	scrollToTop: function() {
		this.element.scrollTop = 0;
		for(i in this.sharedComps) {
			//CVPortal.warn("CHecking overflow: " + $(this.sharedComps[i]).css("overflow"));
			if($(this.sharedComps[i]).css("overflow") == "hidden") {
				// CVPortal.warn("trying to scroll UP the inner_content");
				$(".inner_content", this.sharedComps[i]).each(function() {
					this.scrollTop = 0;
				});
			}
			this.sharedComps[i].scrollTop = 0;
		}

	},

	scrollToElement: function(component, e) {
		if(this.sharedComps[component]) {
			// determine the offset parent (this object must be position = relative, absolute, fixed
			var topParent = $(e).offsetParent().get(0);
			var moved = false;
			var count = 0;
			while(count < 10 && !moved && topParent != null){
				count++;
				// move that object to scroll position = 0
				var startPos  = $(topParent).scrollTop();
				$(topParent).scrollTop(0);
				// calculate our objects position within the scrolling area
				var targetOffset = $(e).position().top;
				
				// account in our scrolling for the TOP_NAV_BARs
				$(".top_nav_bar, .ui-topic-title-wrapper", topParent).each(function() 
				{
					targetOffset -= $(this).outerHeight({ margin: true });
				});
				
				// directly scroll the scrolling area to the offset
				$(topParent).scrollTop(targetOffset);
				var newPos = $(topParent).scrollTop();
				if(startPos == newPos && topParent != $(topParent).offsetParent().get(0))
				{
					topParent = $(topParent).offsetParent().get(0);
					moved = false;
				}else{
					moved = true;
				}
			}
		}
	}
};

function cvBaseComponent(id) {
	// The single debugging window:
	this.componentName = "Base LiveContent DITA Component";

	this.props = new Object();
	this.vPanels = new Object();

	// set our ID:
	this.id = id;
}

cvBaseComponent.prototype = {
	// empty init:
	init: function() { },

	// empty init:
	extensionInit: function() {
		// empty init for extensions
	},

	destroy: function() {
		//delete some stuff...
		//alert("destroying... " + this.id);
	},

	// empty destroy for extensions:
	extensionDestroy: function() { },

	//get a property:
	getProp: function(id) {
		return this.props[id];
	},

	//set a prop:
	setProp: function(id, val) {
		this.props[id] = val;
	},

	// start and stop HTTP Heartbeat - 
	// this can be used to insure that an HTTP session does not die during a long-running HTTP call:
	startHeartbeat: function() {
		var comp = this;
		$.ajax({
			url: CVPortal.getURLwithBaseParams("session.xql") +"&action=status",
			type: "POST",
			dataType: "xml",
			async: false,
			cache: false,
			success: function(xml) {
				var func = "CVPortal.components." + comp.id + ".startHeartbeat();";
				comp.heartbeatTimer = setTimeout(func, 60000);
			}
		});
	}, 
	
	stopHeartbeat: function() {
		clearTimeout(this.heartbeatTimer);	
	},

	//
	// VIRTUALS -> REALS
	// Searching VIRTUAL Panel and Controls List:
	getVirtualPanel: function(virtual) {
		if(this.vPanels[virtual]) {
			var p = CVPortal.panelFactory.getPanel(this.vPanels[virtual], this.id);
			if(p == null) {
				return CVPortal.panelFactory.createFakeStub();
			} else{
				return p;
			}
		} else {
			CVPortal.error(" {Base Component} Failed to locate the virtual panel " + virtual + " for component " + this.id +". Returning fake panel.");
			return CVPortal.panelFactory.createFakeStub();
		}
	}
};