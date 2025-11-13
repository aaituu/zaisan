//--------------------------------------------------
function stopExam(){
	window.postMessage("start-exit");
}
//--------------------------------------------------
if (window.location.pathname.endsWith("/AttemptResult")){
	window.postMessage("start-exit");
}
//--------------------------------------------------
console.log("Univer JS");
//--------------------------------------------------
(function(){
	var isLogged = false;
	var elements = document.querySelectorAll('a[href="/user/pass/"]');
	for (var i = 0; i < elements.length; i++) {
		var el = elements[i];
		isLogged = true;
	}
	if (isLogged){
		var data = {};
		data['type'] = 'im-logged';
		//
		var args = {};
		args['type'] = 'send-data-message';
		args['msg'] = data;
		args['packetId'] = -1;
		window.postMessage(JSON.stringify(args), '*');
		//
		console.log("OES: send is logged");
	}
})();
//--------------------------------------------------