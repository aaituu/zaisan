console.log("[OES Extension] This is service worker!"); 
//--------------------------------------------------------------------------------------------------
function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
//--------------------------------------------------------------------------------------------------
chrome.runtime.onConnect.addListener(function (port) {
    //----------------------------------------------------------------------------------------------
    port.onMessage.addListener(portOnMessageHanlder);
    //----------------------------------------------------------------------------------------------
    function portOnMessageHanlder(message, sender) {
        //------------------------------------------------------------------------------------------
        console.log('Got message', message);
        //------------------------------------------------------------------------------------------
        if(!!message['get-custom-sourceId-v2']) {
            screenOptions = message['get-custom-sourceId'];
            chrome.desktopCapture.chooseDesktopMedia(screenOptions, port.sender.tab, onAccessApproved);
            return;
        }
        // service-worker.js: внутри portOnMessageHanlder(message, sender)

//------------------------------------------------------------------------------------------

        if(message == 'get-my-stream-id') { 
            var screenOptions = ['screen', 'window', 'tab']; // Запрашиваем все доступные опции
            var currentTabId = port.sender.tab.id;

            // Используем лямбда-функцию для передачи текущего ID вкладки
            chrome.desktopCapture.chooseDesktopMedia(screenOptions, port.sender.tab, function(sourceId, opts) {
                onParallelAccessApproved(sourceId, opts, currentTabId);
            });
            return;
        }
//------------------------------------------------------------------------------------------

        // service-worker.js: внутри portOnMessageHanlder(message, sender)

//------------------------------------------------------------------------------------------
        //------------------------------------------------------------------------------------------
        if(message == 'reload-extension') {
            console.warn('[Background] Получен запрос на перезапуск расширения');
            chrome.runtime.reload();
            return;
        }
        //------------------------------------------------------------------------------------------
        if(message == 'get-sourceId-v2') {
            chrome.desktopCapture.chooseDesktopMedia(screenOptions, port.sender.tab, onAccessApproved);
            return;
        }
        //------------------------------------------------------------------------------------------
        if(message == 'audio-plus-tab-v2') {
            screenOptions = ['screen', 'window', 'audio', 'tab'];
            chrome.desktopCapture.chooseDesktopMedia(screenOptions, port.sender.tab, onAccessApproved);
            return;
        }
        //------------------------------------------------------------------------------------------
        if(message == 'is-oes-enabled') {
            chrome.tabs.query({}, function(tabs) { 
                var isFound = false;
                for (var i = 0; i < tabs.length; i++) {
                    var tab  = tabs[i];
                    var host = new URL(tab.url).host;
                    if (!tab.url.startsWith('https://')) continue;
                    if (!host.endsWith('.oes.kz') && !host.endsWith('.myoes.ru') && !host.endsWith('eqyzmet.gov.kz') && !host.endsWith('daryn.online') && !host.endsWith('enbek.kz')  && !host.endsWith('uchet.kz') && !host.endsWith('crocos.kz') && !host.endsWith('astanait.edu.kz') && !host.endsWith('icert.kz') ) continue;
                    port.postMessage('yes-oes-enabled', '*');
                    isFound = true;
                    return;
                }
                if (isFound) return;
                port.postMessage('no-oes-disabled', '*');
            });
            return;
        }
        //------------------------------------------------------------------------------------------
        if(message == 'is-oes-enabled-exam') {
            chrome.tabs.query({}, function(tabs) { 
                var isFound = false;
                for (var i = 0; i < tabs.length; i++) {
                    var tab  = tabs[i];
                    var host = new URL(tab.url).host;
                    if (!tab.url.startsWith('https://')) continue;
                    if (!host.endsWith('.oes.kz') && !host.endsWith('.myoes.ru') && !host.endsWith('eqyzmet.gov.kz')  && !host.endsWith('daryn.online') && !host.endsWith('enbek.kz')  && !host.endsWith('uchet.kz') && !host.endsWith('crocos.kz') && !host.endsWith('astanait.edu.kz') && !host.endsWith('icert.kz') ) continue;
                    console.log('find host', tab.url);
                    if (!tab.url.includes('/proctoring')) continue;
                    port.postMessage('yes-oes-enabled-exam', '*');
                    isFound = true;
                    return;
                }
                if (isFound) return;
                port.postMessage('no-oes-disabled-exam', '*');
            });
            return;
        }

        if (message == 'close-tabs'){  
            chrome.tabs.query({}, function(tabs) { 
                for (var i = 0; i < tabs.length; i++) {
                    var tab  = tabs[i];
                    var host = new URL(tab.url).host;
                    if (tab.url.startsWith('https://') && (host.endsWith('.oes.kz') || host.endsWith('.myoes.ru') || host.endsWith('eqyzmet.gov.kz') || host.endsWith('daryn.online') || host.endsWith('uchet.kz') || host.endsWith('crocos.kz') || host.endsWith('astanait.edu.kz') || host.endsWith('icert.kz'))) continue;
                    chrome.tabs.remove(tab.id); 
                }
            });
            return;
        } 
        //------------------------------------------------------------------------------------------
        if(message == 'start-exit2'){
            port.postMessage('do-exit2', '*');
            return;
        }
        if(message == 'start-exit'){
            console.log('[OES Extension] On start exit');
            chrome.tabs.query({}, function(tabs) { 
                for (var i = 0; i < tabs.length; i++) {
                    var tab  = tabs[i];
                    try{
                        var host = new URL(tab.url).host;
                        console.log('[OES Extension] Got tab to send exit', tab.id, tab.url, host);
                        if (!tab.url.startsWith('https://')) continue;
                        if (!host.endsWith('.oes.kz') && !host.endsWith('.myoes.ru') && !host.endsWith('eqyzmet.gov.kz') && !host.endsWith('daryn.online') && !host.endsWith('enbek.kz')  && !host.endsWith('uchet.kz') && !host.endsWith('crocos.kz') && !host.endsWith('astanait.edu.kz') && !host.endsWith('icert.kz') ) continue;
                        console.log('[OES Extension] Trying to send exit', tab.id, tab.url, host);
                        var port2 = chrome.tabs.connect(tab.id,{name: "channel-exit"});
                        port2.postMessage("do-exit");
                        console.log('send do exit');
                    } catch (e){

                    }
                }
            }); 
            return;
        }
        //------------------------------------------------------------------------------------------
        // Актуальная
        if(message == 'get-active-tab') { 
            chrome.windows.getCurrent(function (browser) {
                if (browser.focused == false){
                    event = {'type': 'window-no-focused'};
                    port.postMessage(JSON.stringify(event), '*');
                } else 
                    chrome.tabs.query({
                        active: true,
                        lastFocusedWindow: true
                    }, function(tabs) { 
                        var tab = tabs[0];
                        if (tab == null) return;
                        event = {'type': 'got-active-tab', 'content': tab.url};
                        port.postMessage(JSON.stringify(event), '*');
                    }); 
            });
            return;
        }
      
        // Обновленная
        if(message == 'get-active-tab-v2') {
            chrome.windows.getCurrent(function (browser) {
                if (browser.focused == false){
                    if (inFocus){

                    } 
                } else 
                    chrome.tabs.query({
                        active: true,
                        lastFocusedWindow: true
                    }, function(tabs) { 
                        var tab = tabs[0];
                        if (tab == null) return;
                        event = {'type': 'got-active-tab', 'content': tab.url};
                        port.postMessage(JSON.stringify(event), '*');
                    }); 
            });
            return;
        }
        if (message == 'get-fullscreen-status'){
            chrome.windows.getCurrent(function (browser) {
                event = {'type': 'got-fullscreen-status','state': browser.state};
                port.postMessage(JSON.stringify(event), '*');
            });
            return;
        }
        //------------------------------------------------------------------------------------------
        if(message == 'is-has-second-monitor') { 
            var has = false;
            try {
                chrome.system.display.getInfo(function (displayInfosResult) {
                    has = displayInfosResult.length >= 2;
                    port.postMessage(has ? 'second-monitor-exist' : 'second-monitor-not-exist'); 
                });
            } catch (err){
                port.postMessage('second-monitor-not-exist'); 
                has = false;
            }            
            return;
        }
        //------------------------------------------------------------------------------------------
        if (!IsJsonString(message)) return;
        var data = JSON.parse(message);
        //------------------------------------------------------------------------------------------
        if (data.type == 'get-cookie'){
            var domain = data.domain;
            var packetId = data.packetId;
            var answer = {};
            answer['type'] = 'answer';
            answer['packetId'] = packetId;
            answer['domain'] = domain;
            var cookies = [];
            chrome.cookies.getAll({'domain':domain},function(cookie){ 
                for(i=0;i<cookie.length;i++){
                    cookies.push(cookie[i]);
                    console.log('puzhing cookie');
                }       

                answer['cookies'] = cookies;
                port.postMessage(JSON.stringify(answer));
            });
        }
        //------------------------------------------------------------------------------------------
        if (data.type == 'clear-cookie'){
            var domain = data.domain;
            var packetId = data.packetId;
            var answer = {};
            answer['type'] = 'answer';
            answer['packetId'] = packetId;
            answer['domain'] = domain;
            var cookies = [];
            chrome.cookies.getAll({'domain':domain},function(cookies){ 
                for(i=0;i<cookies.length;i++){
                    try{
                        chrome.cookies.remove({url: "https://" + cookies[i].domain  + cookies[i].path, name: cookies[i].name});
                    } catch (e){}
                    try{
                        chrome.cookies.remove({url: "http://" + cookies[i].domain  + cookies[i].path, name: cookies[i].name});
                    } catch (e){}
                }
                console.log('Deleting cookeis');
                port.postMessage(JSON.stringify(answer));
            });
        }
        //------------------------------------------------------------------------------------------
        // if (data.type == 'close-tab'){ 
        //     var domain = data.domain;
        //     chrome.tabs.query({}, function(tabs) { 
        //         for (var i = 0; i < tabs.length; i++) {
        //             var tab  = tabs[i];
        //             var host = new URL(tab.url).host;
        //             console.log(host, domain, 'check');
        //             if (host.toLowerCase() != domain.toLowerCase()) continue;
        //             chrome.tabs.remove(tab.id); 
        //         }
        //     }); 
        // }
        //------------------------------------------------------------------------------------------
        if (data.type == 'do-program-query'){

            console.log('do-program-query');
            
            var domain = data.domain;
            var packetId = data.packetId;
            var answer = {};
            answer['type'] = 'answer';
            answer['packetId'] = packetId;

            
            port.postMessage(JSON.stringify(answer));
    
        }
        //------------------------------------------------------------------------------------------
        if (data.type == 'send-data-message'){
            var domain = data.domain;

            var answer = {};
            answer['type'] = 'answer';
            answer['packetId'] = data.packetId;
            answer['response'] = 1;
            port.postMessage(JSON.stringify(answer));

            chrome.tabs.query({}, function(tabs) { 
                for (var i = 0; i < tabs.length; i++) {
                    var tab  = tabs[i];
                    console.log('found tab', tab);
                    try{ 
                        var newData = {};
                        newData['type'] = 'oes-data-message';
                        newData['msg'] = data.msg;
                        chrome.tabs.sendMessage(tab.id, newData); 
                    } catch (e){
                        console.log("Port 2 connect error", e);
                    }
                }
            });
        }
        //------------------------------------------------------------------------------------------
    }
    //----------------------------------------------------------------------------------------------
    var inFocus = true;
    chrome.windows.onFocusChanged.addListener(function(window) {
        if (window == chrome.windows.WINDOW_ID_NONE) {
            inFocus = true;
        } else {
            inFocus = true;
        }
    });
    //----------------------------------------------------------------------------------------------
    function onAccessApproved(sourceId, opts) {
        if(!sourceId || !sourceId.length) {
            return port.postMessage('PermissionDeniedError');
        }
        port.postMessage({
            sourceId: sourceId,
            canRequestAudioTrack: !!opts.canRequestAudioTrack
        });
    }
    //----------------------------------------------------------------------------------------------
});
//--------------------------------------------------------------------------------------------------

// service-worker.js: в самом конце файла

//----------------------------------------------------------------------------------------------
// !!! CUSTOM APPROVAL HANDLER FOR PARALLEL STREAMING !!!
function onParallelAccessApproved(sourceId, opts, tabId) {
    if(!sourceId || !sourceId.length) {
        console.log("[OES Extension] Parallel Stream Permission Denied.");
        return; 
    }
    
    // Отправляем sourceId обратно на content-script, используя обертку OES
    var dataToSend = {};
    dataToSend['type'] = 'oes-data-message';
    dataToSend['msg'] = {
        type: 'got-my-sourceId', // <-- Уникальный тип сообщения
        sourceId: sourceId,
        // Проверяем наличие системного аудио, если доступно
        canRequestAudioTrack: !!opts.canRequestAudioTrack || !!opts.canRequestSystemAudio
    };
    
    // Используем chrome.tabs.sendMessage для отправки sourceId в content script
    try { 
        chrome.tabs.sendMessage(tabId, dataToSend); 
        console.log("[OES Extension] Sent got-my-sourceId back to tab", tabId);
    } catch (e){
        console.error("[OES Extension] Error sending custom sourceId to tab:", e);
    }
}
//----------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------- (эта строка уже была в файле)