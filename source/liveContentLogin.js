if(window.location.href.indexOf("docs.sdl.com") != -1 && document.getElementById("username")) {
    if($("#loginForm").length == 0) {
        $(".splash .fields").wrap("<form id='loginForm' onsubmit='javascript: $(\"div.login_button.xref\").children(\"img\").click(); return false;'/>");
        $("<input id='formSubmitButton' type='submit' value='Submit' style='display: none;'/>").appendTo(".login_button");
        imageButton = $("div.login_button.xref").children("img");
        imageButton.hide();
        $("<img onClick='$(\"#formSubmitButton\").click()'/>").attr("src", imageButton.attr("src")).insertAfter(imageButton);
    }
} else {
    window.location.href="http://docs.sdl.com/LiveContent/"
}