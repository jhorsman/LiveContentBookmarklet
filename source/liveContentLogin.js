if(window.location.href.contains("docs.sdl.com") && document.getElementById("username")) {
    $(".splash .fields").wrap("<form id='loginForm' onsubmit='javascript: $(\"div.login_button.xref\").children(\"img\").click(); return false;'/>");
    $("<input id='formSubmitButton' type='submit' value='Submit' style='display: none;'/>").appendTo(".login_button");
    imageButton = $("div.login_button.xref").children("img");
    imageButton.hide();
    $("<img onClick='$(\"#formSubmitButton\").click()'/>").attr("src", imageButton.attr("src")).insertAfter(imageButton);
} else {
    window.location.href="http://docs.sdl.com/LiveContent/"
}