$(".splash .fields").wrap("<form id='loginForm' onsubmit='javascript: $(\"div.login_button.xref\").children(\"img\").click(); return false;'/>");
$("<input id='formSubmitButton' type='submit' value='Submit' style='display: none;'/>").appendTo(".login_button");
imageButton = $("div.login_button.xref").children("img");
imageButton.hide();
$("<img onClick='$(\"#formSubmitButton\").click()'/>").attr("src", imageButton.attr("src")).insertAfter(imageButton);