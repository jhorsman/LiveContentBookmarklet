/* $Id: LiveContent/ui/skins/base/js/lcCommon.js 1.116 2014/03/27 14:28:35GMT milind Exp  $ */

/****************************
*
*  LiveContent Global JavaScript Functions
*
*****************************/

// handle SWF hotspots:
function FSCommand(com, arg) {
	CVPortal.components.lcContent.swf_hotspot(com, arg);
}

/****************************
*
*  LiveContent Common JS
*
*****************************/
function lcCommon() {
	//set name
	this.componentName = "LC Common Component";
	this.id = "lcCommon";
	this.hover_id = 0;	
}

lcCommon.prototype = {
	init: function() {	
		this.panel = this.getVirtualPanel("panel");
		this.tocPanel = this.getVirtualPanel("tocPanel");
		// do nothing on init
		this.XFormsId = ""; 	// note that there is no DIV with this ID that is currently displaying the XForms manager
		this.XFormName = "";
		this.XFormsViewAll = "";
		this.inXFormsBrowse = false;
		
		this.prepareDropDowns();
		
		// if this a login page, focus on the login element:
		$("#username").each(function() {
			this.focus();
		});

		// allow resizing if requested:
		if(this.getProp("skip_resize") != "1") {
			// provide resizing to *both* TOC and CONTENT panel
			$(this.tocPanel.getElement()).bind("resize", function() { CVPortal.components.lcCommon.resize(this); } );
			this.resize(this.tocPanel.getElement()); 
			
			$(this.panel.getElement()).bind("resize", function() { CVPortal.components.lcCommon.resize(this); } );
			this.resize(this.panel.getElement()); 
		}

		// Check that browser is a supported type else warn
		this.checkBrowserSupport();

		// initialize the tocPanel State
		CVPortal.State.setOptions({	tocPanelVisible: true });
		
		// Load table of recently viewed and edited topics, comments
		try {
			this.loadRecentTopics();		
			this.loadRecentComments();					
		} catch(e) {
			// ignore
		}		
	},
	
	resize: function(panelElement) {	
		var comp = this;
		var panel = CVPortal.panelFactory.getPanel(panelElement.id);

		// Dynamically handle the variable WIDTH in the TOC / CONTENT Panels
		$(".top_nav_bar_inner", panelElement).each(function() {
			var inner = parseInt(panel.getPanelWidth(), 10);
			$(this).css( { width: inner + "px"});
		}); 
		
		// keep an eye out for IFRAMES which need help with height:
		$("iframe", panelElement).each(function() {
			var inner = parseInt(panel.getPanelHeight(), 10) - 3;
			$(this).css( {height : inner + "px" });
		});
		
		// Dynamically handle the variable HEIGHT in the TOC / CONTENT Panels
		$(".inner_admin_menu, .inner_toc_menu, .inner_content", panelElement).each(function() {
			var inner = parseInt(panel.getPanelHeight(), 10);
			var pNode = this.parentNode;
			var sub = 0;
			$(pNode).children(".top_nav_bar, .main_nav_bars_container, .nav_bar_container").each(function() {
				 sub += $(this).outerHeight({ margin: true });
			});
			inner = inner - sub;
			if (!CVPortal.components.lcContent || CVPortal.components.lcContent.getProp("no_pubload") != "1") $(this).css( {height: inner + "px" });
		});

	},

	/***********************************
	* see if browser type is supported according to
	* semicolon-separated list in app config;
	* answer may already be in cookie
	***********************************/
	checkBrowserSupport: function() {
		var cook = CVPortal.readCookie("SupportedBrowser");
		if (cook != null) {
			return;  / * we've checked recently * /
		}
		var cook = this.createBrowserSupportCookie();
		if (cook == "false") {
			this.warnBrowser();
		}
	},

	/***********************************
	* see if browsers listed in app config include this one;
	* make cookie to record finding;
	* let it last for 30 days so we don't bug user too much;
	* if config key missing, they're not using this feature,
	* so mark cookie value "not checked".
	***********************************/
	createBrowserSupportCookie: function() {
		var userAgent = this.getUserAgent();
		var browsers = CVPortal.meta.get("browsers_supported");
		var truth;
		if (browsers == null) {
			truth = "not checked";
		} else {
			var ss;
			var found = 0;
			for (start = 0, endx = 0 ; endx != -1 ; ) {
				endx = browsers.indexOf(";", start);
				if (endx != -1) {
					ss = browsers.substring(start, endx);
				} else {
					ss = browsers.substr(start);
				}
				if (ss != "" && userAgent.indexOf(ss) != -1) {
					found = 1;
					break;
				}
				start = endx + 1;
			}
			if (found == 1) { truth = "true"; } else { truth = "false"; }
		}
		CVPortal.createCookie("SupportedBrowser", truth, 30);
		return truth;
	},

	/***********************************
	* get browser's UserAgent string
	***********************************/
	getUserAgent: function() {
		var agent=navigator.userAgent;
		return agent;
	},

	/***********************************
	* warn that browser is unsupported;
	* use short name if known
	***********************************/
	warnBrowser: function() {
		var userAgent = this.getUserAgent();
		var known = "OmniWeb;Opera;iCab;Konqueror;Camino;Netscape;Chrome;Safari;MSIE;Firefox;Mozilla";
		var ss;
		var found = 0;
		for (start = 0, endx = 0 ; endx != -1 ; ) {
			endx = known.indexOf(";", start);
			if (endx != -1) {
				ss = known.substring(start, endx);
			} else {
				ss = known.substr(start);
			}
			if (userAgent.indexOf(ss) != -1) {
				found = 1;
				break;
			}
			start = endx + 1;
		}
		if (found == 0) {
			ss = userAgent;
		}
		var msg1 = CVPortal.getResource("browser.reports");
		var msg2 = CVPortal.getResource("browser.notsupported");
		var msg3 = CVPortal.getResource("browser.moreinfo");
		alert(msg1 + " '" + ss + "'.\n\n" + msg2 + "\n\n" + msg3);
	},

	/***********************
	* Utility:
	* Checking Config for Safe Name Strings:
	************************/
	validateAlphaNumeric: function(str) {
	    if(str.match(/^\w+$/)){
	          return true;
	    }
	    return false
	},

	// =======================================================================
	//
	//  Utility for Selecting GENERIC CHECKBOX LISTS:
	//
	// =======================================================================	
	toggleCheckboxes: function(event) {
		var elem = CVPortal.eventGetElement(event);
		var cbox_group = $(elem).attr("cbox_group");
		
		if(elem.checked == true) {
			$("input[cbox_group='" + cbox_group + "']").attr("checked", true);
		} else {
			$("input[cbox_group='" + cbox_group + "']").attr("checked", false);
		}	
	},
	
	// =======================================================================
	//
	//  Utility for Switching GENERIC TAB LISTS:
	//
	// =======================================================================	
	switchTab: function(event) {
		var elem = CVPortal.eventGetElement(event);
		
		while(! $(elem).attr("tab_group")) elem = elem.parentNode;
		
		// get information about the tab to select / show:
		var tab_group = $(elem).attr("tab_group");
		var tab_id = $(elem).attr("tab_id");
		
		// change the selected tab:
		$("div[tab_group='" + tab_group + "']").removeClass("lc_tab_selected");
		$(elem).addClass("lc_tab_selected");
		$("div[tab_content='" + tab_group + "']").hide();
		$("#" + tab_id).show(); 
	},

	// =======================================================================
	//
	//  write an XML audit event to the server:
	//
	// =======================================================================	
	updateAudit: function(xmlstr) {
		var url = CVPortal.getURLwithBaseParams("audit.xql") + "&action=update";

		$.ajax({
			type: "POST",
			url: url,
			data: {xml: xmlstr},
			dataType: "xml",
			cache: false,
			async: true
		});
	},

	// =======================================================================
	//
	//  get a XQuery understandable date
	//
	// =======================================================================	
	getStandardDate: function() {	 
		 var currentDate = new Date();
		 // YYYY-DD-MMThh:mm:ss.xxx-04:00
		 var year 	= currentDate.getFullYear();
		 var month 	= currentDate.getMonth() + 1;
		 if(month < 10) { month = "0" + month; }
		 var day 	= currentDate.getDate();
		 if(day < 10) { day = "0" + day; }
		 var hour 	= currentDate.getHours();
		 var min 	= currentDate.getMinutes();
		 var sec 	= currentDate.getSeconds();
		 var ms		= currentDate.getMilliseconds();
		 var gmt = -currentDate.getTimezoneOffset()/60;
		 
		 var date = year + "-" + month + "-" + day + "T" + hour + ":" + min + ":" + sec + "." + ms + gmt + ":00";
		 return date; 
	},

	// =======================================================================
	//
	//  post a LOADING message (or other i18n message)
	//
	// =======================================================================	
	loadingMessage: function(msg) {
		var fmsg = "msg.loading";
		if( msg ) {
			fmsg = msg;
		}
		var retval = "<div class='lc_loading'><img src='"+CVPortal.fetchSkinImage('loading.gif')+"' alt='"+CVPortal.getResource(fmsg)+"'/><span>"+CVPortal.getResource(fmsg)+"</span></div>";
		return retval;
	},

	// =======================================================================
	//
	//  LOAD CONTENT into a MAIN-panel:
	//
	// =======================================================================	
	load: function(url) {
		var comp = this;
		url = CVPortal.getURLwithBaseParams(url);
		$.ajax({
			type: "GET",
			dataType: "html",
			url: url,
			cache: false,
			success: function(html) {
				comp.panel.setContent(html, comp.id);
				comp.panel.selectShared(comp.id);
			}
		});
	},	
	
	// =======================================================================
	//
	//  LOG INTO CONTENTAVIEW AND GET A SESSION ID:
	//
	// =======================================================================
	login: function() {
		// Fetching the UnAME and Password:
		var params = { action: "login" };
		params.username = $("#username").val();
		params.password = $("#password").val();
		
		// ====================================================================
		// send to the LiveContent Server to get a Session ID:
		// ====================================================================
		var url = CVPortal.getURLwithBaseParams("session.xql");

		// assume an error:
		var status;
		$.ajax( {
			type: "POST",
			data: params,
			url: url,
			dataType: "xml",
			success: function(xml) { 
				var sId = $("info[name='sessionId']", xml).attr("value");
				if(sId) {
					CVPortal.meta.set("session_id", sId);
				}
				if($("result", xml).attr("status") == "SUCCESS") {
					if(document.location.search.indexOf("destination=") > -1) {
						location.href = decodeURIComponent(document.location.search.substring(document.location.search.indexOf("destination=") + 12));
					} else {
						location.href = CVPortal.getURLwithBaseParams("ui.xql") + "&action=html&resource=publist_home.html";
					}
				} else {
					$("#loginStatus").each(function() {
						$("span", this).html($("result", xml).attr("message"));
						$(this).fadeIn();
					});
				}				
			},
			error: function(e1, e2, e3) {
				$("#loginStatus").each(function() {
					$("span", this).html(CVPortal.getResource("msg.server.error"));
					$(this).fadeIn();
				});
			}
		});
	},	
	
	// =======================================================================
	//	
	//  Handle Edit User Profile from My Settings using XForms:
	//
	// =======================================================================
	editUserProfile: function() {
		var user = CVPortal.meta.get("user");
		url = CVPortal.getURLwithBaseParams("xforms.xql?action=get_form&type=system&fid=profile&name=profile" + "&docid=" + user  + "&ajax=1");

		CVPortal.components.lcModal.createModal(
			{iframe: url,
			 height:"450", 
			 width: "600",
			 title:	"admin.user.userprofile", forced: true
			});
	},
		
	// =======================================================================
	//
	//  Handle Edit User Preference (from Manage Users) using XForms:
	//
	// =======================================================================
	editUserPreferences: function() {
		url = CVPortal.getURLwithBaseParams("ui.xql?action=html&resource=user_preferences.html");
		CVPortal.components.lcModal.createModal(
			{url: url,
			 onload: CVPortal.components.lcCommon.finishUserPreferencesLoad,
			 height:"450",
			 width: "500",
			 title: "admin.user.userprefs", forced: true
			});
	},

	finishUserPreferencesLoad: function() {
		// first build the language selector:
		CVPortal.buildLanguageSelector(CVPortal.components.lcModal.modal);
		
		// AJAX FILE UPLOAD:
		// next enable the image upload for profile picture
		var url = CVPortal.getV2URL(["user", CVPortal.meta.get("user"), "profile"]) + "?working=true";

		/* plug in snagged */
		/* https://github.com/jfeldstein/jQuery.AjaxFileUpload.js */
		$('input[type="file"]', CVPortal.components.lcModal.modal).ajaxfileupload({
		  'action': url,
		  'valid_extensions': ['jpg', 'png'],
		  'params': { },
		  'onStart': function() {
			CVPortal.components.lcCommon.userPreferencesToggle("curtain");
		  },
		  'onCancel': function() {
			CVPortal.components.lcCommon.userPreferencesToggle("prefs");
		  },		  
		  'onComplete': function(response) {
				CVPortal.components.lcCommon.userPreferencesToggle("curtain");
				if(response.status == "SUCCESS") {	
					// load up the image - 
					var img = new Image();
					img.src =  url + "&unique=" + (new Date().getTime());
					img.onload = function() {
						$("#cropLocation", CVPortal.components.lcModal.modal).html(img);
					// make it croppable
					$("#cropLocation > img", CVPortal.components.lcModal.modal).Jcrop({
						aspectRatio: 1,
							boxWidth: 350, 
							boxHeight: 350,
						onChange: function(coords) {
							CVPortal.components.lcCommon.cropCoords = coords;
						}
					});
					// show the images area
					CVPortal.components.lcCommon.userPreferencesToggle("crop");
					}
				} else {
					alert(response.message);
					CVPortal.components.lcCommon.userPreferencesToggle("prefs");
				}
		   },
		  'onStart': function() { },
		  'onCancel': function() { }
		});
		
		CVPortal.components.lcModal.center();
	},
	
	userProfileCrop: function() {
		if(! CVPortal.components.lcCommon.cropCoords ) {
			// if the user has not cropped coordinates yet:
			alert(CVPortal.getResource("msg.select.none"));
			return;
		} else {
			CVPortal.components.lcCommon.userPreferencesToggle("curtain");
			var params = { "working" : true};
			// translate the coords object into a parameter object
			params.x = CVPortal.components.lcCommon.cropCoords.x; 
			params.y = CVPortal.components.lcCommon.cropCoords.y;
			params.width = CVPortal.components.lcCommon.cropCoords.w;
			params.height = CVPortal.components.lcCommon.cropCoords.h;
			// get the full URL:
			var crop_url = CVPortal.getV2URL(["user", CVPortal.meta.get("user"), "profile", "crop"]);
			// post the CROP instructions:
			$.ajax({
				url: crop_url,
				data: params,
				type: "POST",
				dataType: "xml",
				success: function(xml) {
					// alert("CROPPED: " + $("result", xml).attr("message"));
					// show the images area
					var url = CVPortal.getV2URL(["user", CVPortal.meta.get("user"), "profile"]);
					$("#current-profile").attr("src", url + "?unique=" + (new Date().getTime()));
					CVPortal.components.lcCommon.userPreferencesToggle("prefs");
				}
			});
		}
	},
	
	userPreferencesToggle: function(type) {
		if(type == "crop") {
			CVPortal.components.lcModal.setTitle("user.settings.prefs.photo.crop");
			$(CVPortal.components.lcModal.modalBody).css("overflow", "auto"); // fixing strange scroll bar in IE
			$("#userPreferencesProfileCrop", CVPortal.components.lcModal.modal).show();
			$("#userPreferencesNormal", CVPortal.components.lcModal.modal).hide();
			$("#preferencesLoadingCurtain", CVPortal.components.lcModal.modal).hide();
			CVPortal.components.lcModal.center();			
		} else if(type == "prefs") {
			CVPortal.components.lcModal.setTitle("admin.user.userprefs");
			$(CVPortal.components.lcModal.modalBody).css("overflow", "auto"); // fixing strange scroll bar in IE
			$("#userPreferencesNormal", CVPortal.components.lcModal.modal).show();
			$("#userPreferencesProfileCrop", CVPortal.components.lcModal.modal).hide();
			$("#preferencesLoadingCurtain", CVPortal.components.lcModal.modal).hide();			
			CVPortal.components.lcModal.center();			
		} else {
			CVPortal.components.lcModal.setTitle("user.settings.prefs.photo.crop");
			$(CVPortal.components.lcModal.modalBody).css("overflow", "visible"); // fixing strange scroll bar in IE
			$("#preferencesLoadingCurtain", CVPortal.components.lcModal.modal).show();
			$("#userPreferencesNormal", CVPortal.components.lcModal.modal).hide();
			$("#userPreferencesProfileCrop", CVPortal.components.lcModal.modal).hide();
			CVPortal.components.lcModal.center();
		}
	},
	
	preferencesChangePassword: function() {
		if($("#confirmnew", CVPortal.components.lcModal.modal).css("display") == "none") {
			$("#enternew", CVPortal.components.lcModal.modal).each(function() {
				this.disabled = false;
				$(this).val("").focus();
			});
			$("#confirmnew", CVPortal.components.lcModal.modal).val("").show();
		} else {
			// Fetching the UnAME and Password:			
			var params = {action: "change_password"};
			params.password = $("#enternew", CVPortal.components.lcModal.modal).val(); 
			params.user = CVPortal.meta.get("user");
			var confirmnew= $("#confirmnew", CVPortal.components.lcModal.modal).val(); 

			// assume an error:
			var status;
			var msg = "";
			var sId;
			if(params.password != confirmnew){
				$("#pswdStatus", CVPortal.components.lcModal.modal).html(CVPortal.getResource('password.nomatch')).fadeIn();
				CVPortal.components.lcModal.center();
			} else {
				var url = CVPortal.getURLwithBaseParams("user.xql");
			   $.post( url, params, function(xml) { 
					status = $("result", xml).attr("status");
					msg = $("result", xml).attr("message");

					if(status == "SUCCESS") {
						$("#pswdStatus", CVPortal.components.lcModal.modal).hide();
						$("#enternew", CVPortal.components.lcModal.modal).each(function() {
							this.disabled = true;
							$(this).val("password");
						});
						$("#confirmnew", CVPortal.components.lcModal.modal).hide();
						CVPortal.components.lcModal.center();
					} else {
						$("#pswdStatus", CVPortal.components.lcModal.modal).html(msg).fadeIn();
						CVPortal.components.lcModal.center();
					}				
				}, 
				"xml"
			  );
			}		
		}
	},	
	
	// =======================================================================
	//
	//  Prepare and close drop downs
	//		-now handled through a jQuery UI Widget: dropmenu
	//
	// =======================================================================
	prepareDropDowns: function() { 	
		// create a unique drop down for the user profile menu:
		$(".dropmenu-header").dropmenu({onHover: false, onClick: true, keepOpen: false, dropElement: ".dropmenu-body"});
//		$(".header_dropdown").dropmenu({onHover: false, onClick: true, keepOpen: false, dropElement: ".header_dropdown_menu"});
//		$(".context_dropdown").dropmenu({onHover: false, onClick: true, keepOpen: false, dropElement: ".context_dropdown_menu"});
//		$(".common_dropdown").dropmenu({onHover: false, onClick: true, keepOpen: false, dropElement: ".common_dropdown_menu"});
		// handle all other drop downs in the application
//		$(".lc_dropdown").dropmenu({onHover: false, onClick: true, keepOpen: false});
	},
	clearDropDowns: function()   {  $(".lc_dropdown").dropmenu("close"); },

	// =======================================================================
	//
	//  AJAX Back Button
	//		relies on jquery.bbq.plugin.js
	//
	// =======================================================================
	addHistoryEvent: function(location, data) {
		// store some additional informatino about the event type:
		data.eventType = location;
		delete data.event;	// remove any event so that we do not damage the return tripping with an empty event
		
		// push onto BBQ's stack:
		lcCommon.prototype.currentURL = location; 
		$.bbq.pushState(data); // note that this fires off historyChange()
	},
	
	historyChange: function(event) {
		// retrieve the top-of-the-stack history object:
		var obj = $.bbq.getState();

		if(!obj || ! obj.eventType) {
			// this object is either NULL or NOT VALID
			
			// OR this is the first load of the page...
			// if this is the first page load for a PUBLICATION, show the homepage...
			if(CVPortal.components.lcContent && CVPortal.components.lcContent.getProp("no_pubload") != "1") {
				CVPortal.components.lcContent.initLoad(false);			
			}
			return;
		}
		
		if(lcCommon.prototype.currentURL == obj.eventType) {
			// this is not really a change, just an event triggered by pushState:
			return;
		}
			
		if(obj.eventType == "lcContent.loadHome") {
			if(CVPortal.components.lcContent) {
				CVPortal.components.lcContent.loadHome(false);
			}	
		} else if(obj.eventType == "lcSearch.advSearch") {
			if(CVPortal.components.lcSearch) {
				CVPortal.components.lcSearch.addSearch();
			}	
		} else if(obj.eventType.indexOf("lcSearch.runSearch") == 0) {
			if(CVPortal.components.lcSearch) {
				if(obj) {
					obj.addHistory = false;
					lcCommon.prototype.currentURL = obj.eventType;
					CVPortal.components.lcSearch.loadHistory(obj);
				}
			}
		} else if(obj.eventType.indexOf("lcContent.loadDoc") != -1) {
			if(CVPortal.components.lcContent) {
				obj.addHistory = false;
				lcCommon.prototype.currentURL = obj.eventType;
				CVPortal.components.lcContent.expandTOCPanel();
				if(!CVPortal.components.lcContent.currentDoc || !CVPortal.components.lcContent.GetTopic() || CVPortal.components.lcContent.GetTopic().logicalid != obj.docid) {
					CVPortal.components.lcContent.loadDoc(null, obj);
				} else if (obj.inner_id) {
					CVPortal.components.lcContent.xref(null, obj.inner_id);
				} else {
					CVPortal.components.lcContent.panel.scrollToTop();
				}
			}	
		} else if(obj.eventType.indexOf("lcContent.loadBinary") != -1) {
			if(CVPortal.components.lcContent) {
				obj.addHistory = false;
				lcCommon.prototype.currentURL = obj.eventType;
				CVPortal.components.lcContent.loadBinary(null, obj);
			}	
		} else {
			// again, do nothing
		}
	},

	// =======================================================================
	// populate table of recently visited topics
	// =======================================================================
	loadRecentTopics: function() {
		var comp = CVPortal.components.lcCommon;
		var user = SCTsw.getUser();
		var edit = new String(CVPortal.meta.get("lcde_edit_url"));
		// if no edit url, function returns "null"; edit url would be longer
		if (edit.length > 4) {
			$("#ViewsTab").show();
			$("#widgetTopicHead").show();
		} else {
			$("#ViewsTab").hide();
			$("#widgetTopicHead").hide();
		}
		if ($("#recentTopicsViewed").length) {
			// we're on the right page -- build the elements
			var entries = "";
			var recentVisits = CVPortal.Prefs.get(user + "-recentVisits");
			if (recentVisits != null) {
				entries = comp.genRecentTopics(recentVisits);
			} else {
				entries = "<div class='widgetTopics'><div class='widgetNoTopic'>" + "<img src='" + 
							CVPortal.fetchSkinImage("mc.notification.16.png") + "'/><div>" + 
							CVPortal.getResource("widget.notopics.viewed") + "</div></div></div>";
			}
			$("#recentTopicsViewed").html(entries);
		}
		// if no edit url, function returns "null"; edit url would be longer
		if (edit.length > 4) {
			$("#EditsTab").show();
			if ($("#recentTopicsEdited").length) {
				// we're on the right page -- build the elements
				var entries = "";
				var recentEdits = CVPortal.Prefs.get(user + "-recentEdits");
				if (recentEdits != null) {
					entries = comp.genRecentTopics(recentEdits);
				} else {
					entries = "<div class='widgetTopics'><div class='widgetNoTopic'>" + "<img src='" + 
							CVPortal.fetchSkinImage("mc.notification.16.png") + "'/><div>" + 
							CVPortal.getResource("widget.notopics.edited")+"</div></div></div>";
				}
				$("#recentTopicsEdited").html(entries);
			}
		} else {
			$("#EditsTab").hide();
		}
	},
	
	genRecentTopics: function(recentTopics) {
		var entries = "";
		var topiccount = (recentTopics.match(/\|\|/g)).length;
		if (topiccount > 0) {
			// HTML for each line is provided by a template;
	        // within our template, the variables will be set by {{ .. }} 
	        _.templateSettings = {
	            interpolate : /\{\{(.+?)\}\}/g
	        };
	        // the template is loaded from a <script id="widget-recent-topics"/> which is in publist_home.html
			// this provides a template object which can be used to render a JSON object (below)
			var viewTemplate = _.template($("#widget-recent-topics").html());
			var url = CVPortal.getURLwithBaseParams("pub.xql") + "&action=home";
			var topicArray = recentTopics.split("||");
			for (var i=1 ; i <= topiccount ; i++) {
				var item = topicArray[i];
				var titleat = item.indexOf("&title");
				var path = item.substring(0, titleat);
				// skip over '&title='
				var title = item.substring(titleat+7, item.length);
                // building the JSON object to load into the template
                var obj = {
                    "path": encodeURI(path),
                    "url": url,
                    "title": title
                };
                // build the HTML from the template:
                entries += viewTemplate(obj);
			}
		}
		return entries;
	},
	
	// =======================================================================
	// Toggle between the recent-topics tabs (viewed vs. edited) and
	// show or hide their respective lists; do this only if the click event
	// in on the *unselected* tab; if on the *selected* tab, do nothing
	// =======================================================================
	
	toggleTopicsTab: function(event) {
		var elem = CVPortal.eventGetElement(event);
		var tabid = "?";
		var tabclass = "?";
		if (elem) {
			tabid = $(elem).attr("id");
			tabclass = $(elem).attr("class");
		}
		if (tabclass.indexOf("tabUnselected") != -1) {
			$("#" + tabid).removeClass("tabUnselected" + tabid).addClass("tabSelected");
			if (tabid == "ViewsTab") {
				$("#EditsTab").removeClass("tabSelected").addClass("tabUnselectedEditsTab");
				$("#recentTopicsViewed").removeClass("displayNone").addClass("displayTable");
				$("#recentTopicsEdited").removeClass("displayTable").addClass("displayNone");
			} else if (tabid == "EditsTab") {
				$("#ViewsTab").removeClass("tabSelected").addClass("tabUnselectedViewsTab");
				$("#recentTopicsEdited").removeClass("displayNone").addClass("displayTable");
				$("#recentTopicsViewed").removeClass("displayTable").addClass("displayNone");
			}
		}
	},
	
	// =======================================================================
	// populate table of recently visited comments (Comment Stream Widget)
	// =======================================================================
	loadRecentComments: function() {
		if($("#viewRecentComments").length == 0){//not on publist page
		    return(0);
		}
	    var url = CVPortal.getURLwithBaseParams("xforms.xql?action=view&format=json&parent=ROOT&start=0&length=10&fid=xform.comment");	
		var comp = CVPortal.components.lcCommon;
		var status;
		$.ajax({
			url: url,
			type: "GET",
			async: true,
			contentType: "application/json",
			dataType: "json",
			cache: false, //LCDE-301
			success: function (cObj) {
				status = 0;
//				if(cObj.length > 0){
//					if (cObj[0] && cObj[0].title) {
						var entries = comp.genRecentComments(cObj);
						$("#viewRecentComments").html(entries);
//					}				    
//				}
			},
			error: function (jqXHR, textStatus, errorThrown) {
				status = errorThrown;
				//alert(jqXHR + " textstatus=" + textStatus + " thrown=" + errorThrown);
			}
		});
		return (status);
	},
	genRecentComments: function(cObj) {
		var entries = "";
		commentCount = cObj.length;
		// within our template, the variables will be set by {{ .. }} 
		_.templateSettings = {
			interpolate : /\{\{(.+?)\}\}/g
		};		
		// the template is loaded from a <script id="widget-recent-visits"/> which is in publist_home.html
		var viewTemplate = _.template($("#widget-recent-comments").html());		
		//CVPortal.warn("in genRecentComments, commentCount= " + commentCount);
		if (commentCount > 0) {
			for (var i=0 ; i < commentCount ; i++) {
				var pub = cObj[i].pub;
				var lang = cObj[i].lang;
				var sdocid = cObj[i].sdocid;
				var photoURL = CVPortal.getV2URL(["user", cObj[i].user, "profile"]);
				// building the JSON object to load into the template
				var obj = {
					"commentType": cObj[i].type,
					"attrVal": cObj[i].selected_element_attr_val,
					"cid": cObj[i].name,
					"commentDocid": cObj[i].docid,
					"commentAuthor": cObj[i].username,
					"pub": pub,
					"lang": lang,
					"sdocid": sdocid,
					"topicName": cObj[i].topic_title,
					"topicText": cObj[i].title,
					"userPhotoUrl": photoURL
				};
				
				// build the HTML from the template:
				entries += viewTemplate(obj);
			}		
		} else {
			entries = "<div class='widgetNoCommentsParent'><div class='widgetNoComments'>" + "<img src='" + 
							CVPortal.fetchSkinImage("mc.notification.16.png") + "'/><div>" + 
							CVPortal.getResource("widget.nocomments")+"</div></div></div>";
		}
		return entries;
	},
	
	showCommentNoSelect: function(event) {
		CVPortal.components.lcCommon.showComment(event, false);
	},
	showCommentSelect: function(event) {
		CVPortal.components.lcCommon.showComment(event, true);
	},
	// show topic with comment pane visible, comments expanded, actual comment (un)selected
	// depending on 'select' argument
	showComment: function(event, select) {
		var comp = this;
		var select = select ? 'true' : 'false';
		var elem = CVPortal.eventGetElement(event);
		// find ancestor element which has cid attr
		while(! $(elem).attr("cid")) elem = elem.parentNode;
		// topic attributes
		var sdocid = $(elem).attr("sdocid");
		var pub = $(elem).attr("pub");
		var lang = $(elem).attr("lang");
		// comment attributes
		var cid   = $(elem).attr("cid");
		var type  = $(elem).attr("type");
		var docid = $(elem).attr("cdocid");
		var attrVal = $(elem).attr("attrVal");
		
		// Before showing comment, check that the reference pub/lang is visible
		var url_get = CVPortal.getV2URL(["content", pub, lang, "config", "visible"]);
		var visible = "visible";
		$.ajax( {
			method: "GET",
			url: url_get,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			async: false,
			cache: false,
			success: function(jsonObj) {
				if(jsonObj.status == "FAIL") {
					// no sign of visible, proceed!
				} else {
					visible = jsonObj.value;
				}
			}
		});
		
		if(visible != "visible"){
			// The requested publication or language version is not visible.
			alert(CVPortal.getResource("pubs.nonvisible"));
		} else {		
			// build url for loading topic, adding comment params
			var myref = SCTsw.getLiveContentBaseURL() + "content/" + lang + "/" + encodeURI(pub) + "/" + encodeURI(sdocid) 
						+ "?commentId=" + cid + "&type=" + type + "&select=" + select + "&attrVal=" + attrVal;
			location.href = myref;		
		}

	},

	// load pub/lang into current window
	loadPub: function(event) {
		var elem = CVPortal.eventGetElement(event);
		var url_get = "";
		if (elem.localName == "a") {
			url_get = elem.getAttribute("href");
		} else {
			url_get = elem.childNodes[0].getAttribute("href");
		}
		if (url_get.length > 0) {
			location.href = url_get;
		}
	}

};