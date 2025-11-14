//----------------------------------------------------
(function() {
	//------------------------------------------------
	console.log("[OES Extension] Messages module loaded");
	//------------------------------------------------
	// Мостик
	window.addEventListener('message', function (event) {
		console.log("[OES Extension] Started listing messages");
		// Ток свои сообщения
	    if (event.origin != window.location.origin) return;
	    //
	    try {
	    	var data = event.data;
	    	if (typeof data == 'string')
	    		// Пытаемся по JSON
	        	data = JSON.parse(data);	    	
	    } catch (e) {
	    	// Если не JSON
	        onMessage(event.data);
	        return;
	    }
	    // Обработка JSON
	    onEvent(data);
	});
	//------------------------------------------------
	function onEvent(data){
		console.log("[OES Extension] Got data", data);
		if (data.type == 'oes-data-message'){
			var data = data.msg;
			if (data.type == 'counter-data')
				if ('counterManager' in window)
					counterManager.onBringData(data);
			if (data.type == 'close-me')
				window.close();
			if (data.type == 'got-counter')
				if ('injectManager' in window)
					window.injectManager.init(data.count, data.site, data.css);

			return;
		}
	}
	function onMessage(msg){
		
	}
	//------------------------------------------------
})();
//----------------------------------------------------