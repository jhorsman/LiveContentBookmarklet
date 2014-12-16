
function lcContent_extension(){
	
}

lcContent_extension.prototype = {
	extensionInit: function() {
		
	},

	loadToc: function(url) {
		// ==============================
		// set the TOC loading message:
		// ==============================
		if(CVPortal.components.lcCommon) {
			
			this.toc.setContent(CVPortal.components.lcCommon.loadingMessage(), this.id);
		}
			
		var comp = this;
		url = this.buildPubUrl() + "&action=toc_html";
		//alert("loadToc\n" + url);
		$.ajax({
			method: "GET",
			dataType: "html",
			url: url,
			async:true,
			success: function(html) {

				comp.toc.setContent(html, comp.id);
				
				// set up the event delegation to remove in-line onClick attributes:
				$("#toc_div", comp.toc.getElement(comp.id)).bind("click", 
					function(e) {
						comp.delegateTocEvent(e);
				});
				
				comp.buildPubLangSelector();
				CVPortal.checkPermissions(comp.toc.getElement(comp.id));
				comp.tocInit = true;	// register for other async functions that this work is now done
				//alert(window.location.href);
				var loadFirstTopic= false;
				if((window.location.href.indexOf("action=home") > 0) && (window.location.href.indexOf("docid=") < 1)){
					loadFirstTopic= true;
				} else {
					if (window.location.href.indexOf("/") > 0) {
						var locationParts = window.location.href.split('/');
						var urlDocID = locationParts[locationParts.length - 1];
						//alert("<" + urlDocID + ">, " + locationParts.length);
						if ((locationParts.length > 1) && (urlDocID == "")){
							// if there's a / on the end of the location, check preceding field
							urlDocID = locationParts[locationParts.length - 2];
						}
						if ((urlDocID.indexOf("?") < 0) && (urlDocID.indexOf("#") < 0)) {
							var urlCheckPub = "/LiveContent/v2/content/" + urlDocID + "/ifexist";
							$.ajax({
								method: "GET",
								dataType: "xml",
								url: urlCheckPub,
								async:false,
								success: function(xml) {
									if ($("result", xml).attr("status") == "SUCCESS") {
										loadFirstTopic = true;
									} 
								}
							});
						}
					}
				}
				if(loadFirstTopic) {
					//alert("here");
					// only load first topic if we have NOT arrived here from a search query
					// only load first topic if we arrived here action=home (loading a doc)	or if v2 URL ending in pub ID	
					var obj = new Object();
					//$(".lc_toc_title:first",html).each(function(){
					$("*[lcdocid]:first",html).each(function(){
						obj.docid = $(this).attr("lcdocid");
					});
					obj.addHistory = false;
					comp.loadDoc(null, obj);
				}
			}
		});	
	}
};

function lcPublist_extension(){
	
}

lcPublist_extension.prototype = {
	extensionInit: function() {
		
	},
	/*
	init: function() {
		// load the initial panel:
		//this.panel = this.getVirtualPanel("panel");
		this.menu = this.getVirtualPanel("menu");	
		this.loadPublistMenu("all");
		// in default publist, only show visible pubs
		//this.showVisible();
		this.showVisiblePubs();
	}
	*/
	
	
	init: function() {
		//alert("hello");
		// load the initial panel:
		this.panel = this.getVirtualPanel("panel");
		this.menu = this.getVirtualPanel("menu");	
		this.loadPublistMenu();
		
		//var elem = CVPortal.eventGetElement(event);
		//alert("1");
		$("select").each(function() {
			//alert("2");
			$("option", $(this)).each(function() {
				//alert("3");
				var groupID=$(this).attr("value");
				if(this.selected) {
					//alert($(this).val());
					$("#" + groupID).css("display", "inline");
					//alert($(this).attr("value"));
				} else {
					$("#" + groupID).css("display", "none");
				}
			});
		});
		
		
	},
	
		changeGroupList: function(event){
		//alert("changeGroupList");
		var elem = CVPortal.eventGetElement(event);
		$("option", $(elem)).each(function() {
			var groupID=$(this).attr("value");
			if(this.selected) {
				//alert($(this).val());
				$("#" + groupID).css("display", "inline");
				//alert($(this).attr("value"));
			} else {
				$("#" + groupID).css("display", "none");
			}
		});
		
	}
};