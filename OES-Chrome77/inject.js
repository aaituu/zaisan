//--------------------------------------------------------
console.log("[OES Extension] Inject is loaded");
//--------------------------------------------------------
var injectManager = (function(){


	//----------------------
	// Если iFrame, то не надо
	
	var data = {};
	data['type'] = 'get-counter'; 

	var args = {};
	args['msg'] = data;
	args['type'] = 'send-data-message';
	args['packetId'] = -1;

	window.postMessage(JSON.stringify(args), '*');
	//----------------------
	
	//----------------------
})();
//--------------------------------------------------------