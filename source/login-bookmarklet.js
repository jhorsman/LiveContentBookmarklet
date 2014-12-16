$(".splash .fields").wrap("<form onsubmit='javascript: $(\"div.login_button.xref\").children(\"img\").click(); alert(\"submit\"); return false;'/>")
$("<input type='submit' value='Submit'>").insertAfter(".login_button")
