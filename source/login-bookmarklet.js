$(".splash .fields").wrap("<form id='loginForm' onsubmit='javascript: $(\"div.login_button.xref\").children(\"img\").click(); return false;'/>")
$("<input id='formSubmitButton' type='submit' value='Submit'/>").appendTo(".login_button");

imageButton = $("div.login_button.xref").children("img");
$("<img src='SDL%20LiveContent%20Login_files/img_login_button_reachbase-2014061155GMT.png' onClick='$(\"#formSubmitButton\").click()'/>").insertAfter(imageButton);
