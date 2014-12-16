/* $Id: LiveContent/ui/skins/base/js/lcModal.js 1.38 2012/11/15 20:36:27GMT tresea Exp  $ */
/****************************
*
*  The Modal Handler
*
*****************************/
function lcModal() {
	//set name
	this.componentName = "lcModal";
	this.alwaysBlock = 1;
	this.secondAlwaysBlock = 1;
	this.hanging_smallPop = null;
	this.in_smallPop = false;
	this.visible = false;
}

lcModal.prototype = {
	init: function() {
		// create the blocking panel:
		$("body").append("<div class='ui-modal-blocking'></div><div class='ui-modal-wrapper ui-corner-all'><div class='ui-modal-header'><div class='ui-modal-title'></div><div id='lcModalClose' class='xref'>X</div></div><div class='ui-modal-body'><div class='ui-modal-content'></div></div></div>");
		this.modal = 		$(".ui-modal-wrapper").get(0);
		this.modalHeader = 	$(".ui-modal-header").get(0);
		this.modalTitle = 	$(".ui-modal-title").get(0);
		this.modalBody = 	$(".ui-modal-body").get(0);
		this.block = 		$(".ui-modal-blocking").get(0);
	
		// re-center the modal on window-resize:
		$(window).bind("resize", function() { CVPortal.components.lcModal.center(); });
		$(".ui-modal-content", this.modalBody).bind("resize", function() { CVPortal.components.lcModal.center(); });
		$(CVPortal.State).bind("lc:clientResize", function() { CVPortal.components.lcModal.center(); });
		
		// create the close event:
		$("#lcModalClose", this.modalHeader).click(function() {
			CVPortal.components.lcModal.close();
		});
		
	},

	setTitle: function(key) {
		$(this.modalTitle).attr("lcuistring", key).html(CVPortal.getResource(key));
	},
	
	createModal: function(opt) {
		var comp = this;
		$(".lc_dropdown_menu").hide();
		
		this.opt = opt;
		
		// default some height and width values;
		if( ! opt.height ) { opt.height=CVPortal.getClientHeight();}
		if( ! opt.width )  { opt.width =CVPortal.getClientWidth();} 
	
		// display the modal title:
		if(opt.title) {
			$(this.modalTitle).attr("lcuistring", opt.title).html(CVPortal.getResource(opt.title));
		} else {
			$(this.modalTitle).attr("lcuistring", "").html("");
		}		

		// if this is a forced modal, hide the close button
		if(opt.forced) $("#lcModalClose", this.modalHeader).hide();
		else $("#lcModalClose", this.modalHeader).show();
		
		// hide any activeX controls:
		$(".activex").hide();

		// Show the blocking panel, and then the Modal (via "center" function)
		$(this.block).show();
		this.visible = true;
		this.center();
		$(this.modal).show();	
		
		if(! opt.data) {
			// with a spinner:
			if(CVPortal.components.lcCommon) {
				$(".ui-modal-content", this.modalBody).html(CVPortal.components.lcCommon.loadingMessage());
				this.center();
			}
		} else {
			this.completeLoad(opt);
		}
				
		// Special iframe object, takes all usual arguments, but 'iframe' is the URL for the
		// HTML <iframe src='xxxx'> to fetch the data into the dialog box
		if ( opt.iframe ) {
			var iheight = parseInt(opt.height) - 35;
			var iwidth = parseInt(opt.width) - 35;
			var date = new Date();
			
			// make the IFRAME URL UNIQUE: (attempt to prevent caching)
			opt.iframe += "&unique=" + date.getTime();
			opt.data = "<iframe runat='server' frameborder='0' application='yes' scrolling='no' id='xForm' name='xForm'"
				+ " height='" + iheight + "'"
				+ " width='" + iwidth + "'"
				+ " src='" + opt.iframe + "'"  + ">"
				+ "[Your browser does not support iframes]</iframe>";
			this.completeLoad(opt);							
		} else if(opt.url) {
			$.ajax( {
				type: "GET",
				url: opt.url,
				async: true,
				cache: false,
				dataType: "html", 
				success: function(data) {
					opt.data = data;
					comp.completeLoad(opt);
				}
			});
		} else if(opt.id) {
			opt.data = $("#" + opt.id).html();
			this.completeLoad(opt);
		}
	},
		
	completeLoad: function(opt) {		
		// show the finalized DATA:
		$(".ui-modal-content", this.modalBody).html(opt.data);
		this.center();
		
		// re-scroll the modal to the top:
		this.modalBody.scrollTop = 0;
		
		// focus on any input that has an ID passed in:
		if(opt.focus) {
			$("#" + opt.focus, this.modal).focus();
		}	
		
		// prepare any dropdowns as required:
		if(CVPortal.components.lcCommon) {
			CVPortal.components.lcCommon.prepareDropDowns();
		}
		
		// execute an onload callback
		if ( this.opt.onload ) {
			this.opt.onload();
		}	
	},
	
	center: function() {
		var comp = CVPortal.components.lcModal;
		if(comp.visible == true) {
			var height = CVPortal.getClientHeight();
			var width = CVPortal.getClientWidth();			
			var mwidth = parseInt(comp.opt.width, 10);
			
			// automatically determine the height from the lcModalInner DIV
			var mheight = $(".ui-modal-content", comp.modalBody).outerHeight(true) + $(comp.modalHeader).outerHeight(true) 
			mheight += $(comp.modalHeader).outerHeight(true);
			var headerHeight = $(this.modalHeader).outerHeight(true);
			var buffer = 25;
			
			// if the modal is too large, size it down:
			if(mwidth > width - buffer) { 
				if(width - buffer < mwidth - buffer) { 
					mwidth = width - buffer;
				} else {
					mwidth = mwidth - buffer;
				}
				$(comp.modalBody).css({ width: mwidth });
			}
			if(mheight > height - buffer) { 
				// CVPortal.warn("Reducing mheight...");
				if(height - buffer < mheight - buffer) { 
					mheight = height - buffer;
				} else {
					mheight = mheight - buffer;
				}
				// force the content to fit into the available space (scroll bar where needed)
				var outerHeight = mheight - $(comp.modalHeader).outerHeight(true);
				$(comp.modalBody).css({ height: outerHeight });
			} else {
				$(comp.modalBody).css({ height: mheight });
			}

			// CVPortal.debug("modal calculations are as follows: " + height + " / " + width + " for window, and " + mCHeight  + " / " + mCWidth+ " for modal...");
			// force the modal into the available space on the screen, and center it:
			var mH = (height - mheight) / 2
			var mW = (width - mwidth) / 2;
			$(comp.modal).css({ top: mH, left: mW, height: mheight, width: mwidth });
		}
	},	

	// ===========================================
	// Close the dialog
	// -- often caused by CANCEL
	// ============================================
	close: function(skipClose) {
		$(this.modalTitle).attr("lcuistring", "").html("");
		$(".ui-modal-content", this.modalBody).html("");
		this.visible = false;
		$(this.modal).hide();
		$(".activex").show();
		$(this.block).hide();
		if ( this.opt && this.opt.cancel && skipClose != true ) {
			this.opt.cancel();
		}
		
	},

	// ============================================
	// Successfull close with an optional callback function
	//	-- often caused by SUCCESS
	// ============================================ 	
	done: function() {
		if ( this.opt.success ) {
			this.opt.success();
		}
		this.close(true);
	},
	
	setModalContent: function(html) {
		$(".ui-modal-content", this.modalBody).html(html);
		this.center();
	},
	
	getModalContent: function() {
		return $(".ui-modal-content", this.modalBody).html();
	},
	
	/****************************
	*
	*  HOVER MODAL
	*
	*****************************/
	createMouseHover: function(event, id) {
		CVPortal.cancelEventBubble(event);

	    var posx = 0;
		var posy = 0;
		if (!event) var e = window.event;
		if (event.pageX || event.pageY) 	{
			posx = event.pageX;
			posy = event.pageY;
		} else if (event.clientX || event.clientY) 	{
			posx = event.clientX;
			posy = event.clientY;
		}

		var mh = this;
		// posx and posy contain the mouse position relative to the document
	    $("#" + id).each(function() {
			// if our cvModalSmallPOp exists, crush it!
			$("#lcMouseHover").remove();

			// clone this object and insert into the body element:
			var clone = $(this).clone();
			$(clone).attr("id", "lcMouseHover");
			$(clone).addClass("lcMouseHover");
			$("body").append(clone);

			$(clone).css("top", posy - 10);   // set the positions directly under the mouse
			$(clone).css("left", posx - 10);  // to ensure that this works well in IE.
			// alert("POS: X " + posx + " AND Y " +posy);
			// set up the in-and-out logic... FADE IF IGNORED!
			 $(clone).hover(
				function() {
					mh.in_smallPop = true;
				},
				function() {
					mh.in_smallPop = false;
				}
			 );

			var timeout = setTimeout(function() {
				CVPortal.components.lcModal.fadeMouseHover();
			}, 1000);

			 $(clone).show();
			 mh.hanging_smallPop = clone;
	  });
	},

	fadeMouseHover: function() {
		if(this.in_smallPop === false) {
			$("#lcMouseHover").remove();
			this.hanging_smallPop = null;
		} else {
			var timeout = setTimeout(function() {
				CVPortal.components.lcModal.fadeMouseHover();
			}, 1000);
		}
	}
};
