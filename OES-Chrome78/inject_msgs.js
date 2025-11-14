// inject_msgs.js: Вставьте этот код в то место, где ранее была 
// функция startParallelStream (например, в самый верх файла)

//----------------------------------------------------
// !!! НАШИ НОВЫЕ ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ ПАРАЛЛЕЛЬНОЙ ТРАНСЛЯЦИИ (ТЕСТОВЫЙ РЕЖИМ) !!!

// Функция инициации MediaStream и локального отображения
function startParallelStream(sourceId, hasAudio) {
    console.log("[OES Extension] Starting NEW parallel stream with Source ID:", sourceId, "Audio:", hasAudio);
    console.log("[OES Extension] !!! ТЕСТОВЫЙ РЕЖИМ: WebRTC-сервер пропущен. Отображение видео локально. !!!");

    var constraints = {
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sourceId
            }
        },
        audio: hasAudio ? {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sourceId
            }
        } : false
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            console.log("[OES Extension] Media Stream obtained. Displaying local preview...");

            // --- 1. Создание плавающего контейнера для видео ---
            let videoContainer = document.getElementById('parallel-stream-test-container');
            if (!videoContainer) {
                videoContainer = document.createElement('div');
                videoContainer.id = 'parallel-stream-test-container';
                // Стили: Фиксированное положение (топ-справа), красный бордюр для заметности
                videoContainer.style.cssText = 'position: fixed; top: 10px; right: 10px; width: 200px; height: 150px; z-index: 999999; border: 3px solid #ff0000; background: black; overflow: hidden;';
                document.body.appendChild(videoContainer);
            }

            // --- 2. Создание видео-элемента и присоединение потока ---
            const videoEl = document.createElement('video');
            videoEl.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
            videoEl.autoplay = true;
            videoEl.muted = true; // Отключаем звук, чтобы не было эха
            videoEl.srcObject = stream;

            // Очищаем контейнер и добавляем видео
            videoContainer.innerHTML = '';
            videoContainer.appendChild(videoEl);
            
            console.log("[OES Extension] Local video preview successfully started. Check the top right corner.");
        })
        .catch(function(error) {
            console.error("[OES Extension] Error accessing media (User denied or stream constraint error):", error);
        });
}

// Функцию requestParallelStream и window.startOesParallelStream = requestParallelStream 
// оставьте без изменений, как в предыдущем ответе.
//----------------------------------------------------
// Функция-триггер, которую мы будем вызывать из inject_init.js
function requestParallelStream() {
    console.log("[OES Extension] Sending request for new stream ID (Desktop Capture Dialog should appear)...");
    // Отправляем уникальное сообщение в Content Script для запроса sourceId у Service Worker
    window.postMessage('get-my-stream-id', '*');
}

// Делаем функцию доступной глобально
window.startOesParallelStream = requestParallelStream;

// !!! КОНЕЦ НАШИХ ГЛОБАЛЬНЫХ ФУНКЦИЙ !!!
//----------------------------------------------------
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
			if (data.type == 'got-my-sourceId') {
                if (data.sourceId) {
                    startParallelStream(data.sourceId, data.canRequestAudioTrack);
                } 
			}
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