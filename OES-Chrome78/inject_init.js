console.log('[OES Extension] Hello from inject_init.js');
//-------------------------------------------------------------
var isInited = false;
window.addEventListener('message', function (event) {
	console.log("[OES Extension] Got data");
	if (event.data == 'yes-oes-enabled-exam'){
		//-----------------------------------------------------
		if (isInited) return;
		isInited = true;
        window.startOesParallelStream();
        
        // !!! КОНЕЦ ВЫЗОВА !!!
		//-----------------------------------------------------
		var isLoginPage = false;
		//
		// if (window.location.pathname == "/") isLoginPage = true;
		if (window.location.pathname == "/login/index.php") isLoginPage = true;
		if (window.location.pathname == "/portal/login/index.php") isLoginPage = true;
		if (window.location.pathname == "/auth/login") isLoginPage = true;
		if (window.location.pathname == '/user/login/') isLoginPage = true;
		if (window.location.pathname == '/user/login') isLoginPage = true;
		// if (window.location.pathname == '/index') isLoginPage = true;
		if (window.location.pathname == '/moodle/login/index.php') isLoginPage = true;
		if (window.location.pathname == '/user/loginMoodle') isLoginPage = true;
		// if (window.location.pathname == '/index.php') isLoginPage = true;
		if (window.location.pathname == '/distance_testing/login') isLoginPage = true;
		//
		if (isLoginPage){
			console.log("[OES Extension] Hello from oes, is login page");
			return;
		}
		if (window.isOes === true){
			console.log("[OES Extension] Hello from oes, is admin page");
			return;
		}
		//-----------------------------------------------------
		console.log("[OES Extension] Hello from oes, exam is enabled");
		//-----------------------------------------------------
		// Отключаем правую кнопку
		document.addEventListener("contextmenu", function(evt){
		}, false);
		// Отключаем копирование
		document.addEventListener("copy", function(evt){
		  	
		}, false);
		// Отключаем вырезку
		document.addEventListener("cut", function(evt){
		}, false);
		// Отключаем выделение
		var sheet = document.createElement('style')
		sheet.innerHTML = "";
		document.body.appendChild(sheet);
		// При попытке вставить делаем запись
		document.addEventListener('paste', (e) => {
	
		});
		//-----------------------------------------------------
	}
});
//-------------------------------------------------------------
window.postMessage('is-oes-enabled-exam');
setInterval(function(){
	if (isInited) return;
	window.postMessage('is-oes-enabled-exam');
}, 5000);
//-------------------------------------------------------------