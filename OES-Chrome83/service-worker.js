console.log("[OES Extension] Service worker with streaming support loaded!"); 

// ========== STREAMING STATE ==========
let streamingState = {
    isStreaming: false,
    tabId: null,
    sourceId: null
};

// ========== STREAMING HANDLERS ==========
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Service Worker] Got message:', message.type);
    
    // Получить статус трансляции
    if (message.type === 'get-stream-status') {
        sendResponse(streamingState);
        return true;
    }
    
    // Запустить трансляцию
    if (message.type === 'start-parallel-stream') {
        handleStartStreaming(message.tabId, sendResponse);
        return true; // Асинхронный ответ
    }
    
    // Остановить трансляцию
    if (message.type === 'stop-parallel-stream') {
        handleStopStreaming(sendResponse);
        return true;
    }
    
    // Уведомления от content script
    if (message.type === 'streaming-status') {
        streamingState.isStreaming = message.isStreaming;
        notifyPopup('stream-status-changed', { isStreaming: message.isStreaming });
    }
    
    if (message.type === 'viewer-count') {
        notifyPopup('viewer-count', { count: message.count });
    }
});

async function handleStartStreaming(tabId, sendResponse) {
    try {
        console.log('[Service Worker] Starting stream for tab:', tabId);
        
        // 1. Проверяем что вкладка существует
        const tab = await chrome.tabs.get(tabId);
        console.log('[Service Worker] Tab URL:', tab.url);
        
        // 2. Отправляем команду в content script для запуска
        chrome.tabs.sendMessage(tabId, { 
            type: 'start-parallel-stream'
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('[Service Worker] Error sending to content script:', 
                    chrome.runtime.lastError);
                sendResponse({ 
                    success: false, 
                    error: chrome.runtime.lastError.message 
                });
                return;
            }
            
            // Успех
            streamingState.isStreaming = true;
            streamingState.tabId = tabId;
            
            console.log('[Service Worker] Stream started successfully');
            sendResponse({ success: true });
            
            // Уведомляем popup
            notifyPopup('stream-status-changed', { isStreaming: true });
        });
        
    } catch (err) {
        console.error('[Service Worker] Start error:', err);
        sendResponse({ success: false, error: err.message });
    }
}

async function handleStopStreaming(sendResponse) {
    try {
        console.log('[Service Worker] Stopping stream');
        
        if (streamingState.tabId) {
            chrome.tabs.sendMessage(streamingState.tabId, {
                type: 'stop-parallel-stream'
            }, () => {
                // Игнорируем ошибки (вкладка может быть закрыта)
                console.log('[Service Worker] Stop command sent');
            });
        }
        
        streamingState.isStreaming = false;
        streamingState.tabId = null;
        streamingState.sourceId = null;
        
        sendResponse({ success: true });
        notifyPopup('stream-status-changed', { isStreaming: false });
        
    } catch (err) {
        console.error('[Service Worker] Stop error:', err);
        sendResponse({ success: false, error: err.message });
    }
}

function notifyPopup(type, data) {
    chrome.runtime.sendMessage({
        type: type,
        ...data
    }).catch(() => {
        // Popup может быть закрыт
    });
}

// ========== ORIGINAL OES FUNCTIONALITY ==========

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(portOnMessageHanlder);
    
    function portOnMessageHanlder(message, sender) {
        console.log('Got message', message);
        
        if(!!message['get-custom-sourceId-v2']) {
            screenOptions = message['get-custom-sourceId'];
            chrome.desktopCapture.chooseDesktopMedia(screenOptions, port.sender.tab, onAccessApproved);
            return;
        }
        
        if(message == 'reload-extension') {
            console.warn('[Background] Получен запрос на перезапуск расширения');
            chrome.runtime.reload();
            return;
        }
        
        if(message == 'get-sourceId-v2') {
            chrome.desktopCapture.chooseDesktopMedia(screenOptions, port.sender.tab, onAccessApproved);
            return;
        }
        
        if(message == 'audio-plus-tab-v2') {
            screenOptions = ['screen', 'window', 'audio', 'tab'];
            chrome.desktopCapture.chooseDesktopMedia(screenOptions, port.sender.tab, onAccessApproved);
            return;
        }
        
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
                    } catch (e){}
                }
            }); 
            return;
        }
        
        if(message == 'get-active-tab' || message == 'get-active-tab-v1' || message == 'get-active-tab-v2') { 
            chrome.windows.getCurrent(function (browser) {
                if (browser.focused == false){
                    if(message == 'get-active-tab-v2' && inFocus) {
                        // Skip
                    } else {
                        event = {'type': 'window-no-focused'};
                        port.postMessage(JSON.stringify(event), '*');
                        return;
                    }
                }
                
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
        
        if (!IsJsonString(message)) return;
        var data = JSON.parse(message);
        
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
                }       
                answer['cookies'] = cookies;
                port.postMessage(JSON.stringify(answer));
            });
        }
        
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
                port.postMessage(JSON.stringify(answer));
            });
        }
        
        if (data.type == 'close-tab'){ 
            var domain = data.domain;
            chrome.tabs.query({}, function(tabs) { 
                for (var i = 0; i < tabs.length; i++) {
                    var tab  = tabs[i];
                    var host = new URL(tab.url).host;
                    if (host.toLowerCase() != domain.toLowerCase()) continue;
                    chrome.tabs.remove(tab.id); 
                }
            }); 
        }
        
        if (data.type == 'do-program-query'){
            var domain = data.domain;
            var packetId = data.packetId;
            var answer = {};
            answer['type'] = 'answer';
            answer['packetId'] = packetId;

            fetch('http://127.0.0.1:8443/rest/' + data.method)
                .then(response => response.json())
                .then(data => {
                    answer.gotData = data;
                    port.postMessage(JSON.stringify(answer));
                })
                .catch(error => {
                  console.error("Error making HTTP request:", error);
                });
        }
        
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
    }
    
    var inFocus = true;
    chrome.windows.onFocusChanged.addListener(function(window) {
        if (window == chrome.windows.WINDOW_ID_NONE) {
            inFocus = false;
        } else {
            inFocus = true;
        }
    });
    
    function onAccessApproved(sourceId, opts) {
        if(!sourceId || !sourceId.length) {
            return port.postMessage('PermissionDeniedError');
        }
        port.postMessage({
            sourceId: sourceId,
            canRequestAudioTrack: !!opts.canRequestAudioTrack
        });
    }
});