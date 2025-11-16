//--------------------------------------------------------
console.log("[OES Extension] Inject is loaded");
//--------------------------------------------------------
var injectManager = (function(){
	/*
	//----------------------
	const xhr = new XMLHttpRequest();
	xhr.open("GET", "https://ps1-dev.oes.kz/extension/list.php");
	xhr.send();
	xhr.responseType = "json";
	xhr.onload = () => {
	  	if (xhr.readyState == 4 && xhr.status == 200) {
	  		var otv = xhr.response;
	    	console.log("[OES Extension] Got data", otv);
	    	if ('list' in otv) initList(otv.list);
	  	} else {
	    	console.log(`Error: ${xhr.status}`);
	  	}
	};
	//----------------------
	function initList(list){
		var host = window.location.host;
		var mySubdomain = "";
		host = host.toLowerCase().trim();
		Object.keys(list).map(function(objectKey, index) {
			objectKey = objectKey.toLowerCase().trim();
		    var value = list[objectKey];
		    if (objectKey != host) return;
		    mySubdomain = value;
		});
		if (mySubdomain == ""){
			console.log("[OES Extension] mySubdomain not found");
			return;
		}
		console.log("[OES Extension] mySubdomain is", mySubdomain);
		const xhr = new XMLHttpRequest();
		xhr.open("GET", "https://"+mySubdomain+"/extension/get_info.php");
		xhr.send();
		xhr.responseType = "json";
		xhr.onload = () => {
		  	if (xhr.readyState == 4 && xhr.status == 200) {
		  		var otv = xhr.response; 
		  		console.log("[OES Extension] got data 2", otv, ('counter' in otv), ('OesCounter' in window), !('OesCounterItem' in window), otv.counter.maxCount != 0, 'isFrame', isFrame);
		  		var isFrame = window != window.top;
		    	if (('counter' in otv) && ('OesCounter' in window) && !('OesCounterItem' in window))
		    		if (otv.counter.maxCount != 0)
		    			if (!isFrame)
		    				window.OesCounterItem = OesCounter(otv.counter.externalCSS, otv.counter.maxCount, otv.counter.oesSite);
		    			else 
		    				console.log("[Oes Extension] skipped counter becouse its iframe");
		  	} else {
		    	console.log(`Error: ${xhr.status}`);
		  	}
		};
	}
	//----------------------
	*/
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
	function init(counter, site, cssFile){
		var isFrame = window != window.top;
		if (isFrame) {
			console.log("[Oes Extension] skipped counter becouse its iframe");
			return;
		}
		console.log("[Oes Extension] Got counter", counter);
		if (counter == 0){
			console.log("[Oes Extension] Counter skipped, becouse 0");
			return;
		}
		if (!('OesCounter' in window)){
			console.log("[Oes Extension] Counter skipped, becouse OesCounter not found");
			return;	
		}
		if ('OesCounterItem' in window){
			console.log("[Oes Extension] Counter skipped, becouse OesCounterItem is inited");
			return;	
		}
		window.OesCounterItem = OesCounter(cssFile, counter, site);
	}
	//----------------------
	return {
		init: init
	}
	//----------------------
})();
//--------------------------------------------------------