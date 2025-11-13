//------------------------------------------------------
window.postMessage('is-oes-enabled');
//------------------------------------------------------
function stopExam(){
	window.postMessage("start-exit");
}
if (window.location.href.includes("/test/student/maps/")){
	window.postMessage("start-exit");
}
//------------------------------------------------------

(function(){
	if ((document.getElementById('logout') != null)){
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
	} else {
		console.log("OES: not logged");
	}
	if (window.location.href.includes("/test/student/maps/")){
		window.postMessage("start-exit");
	}
})();

console.log("VKU EUNIVER");
//------------------------------------------------------