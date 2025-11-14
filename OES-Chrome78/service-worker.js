console.log("[OES Extension] This is service worker!"); 
// В начале файла добавить:
let offscreenDocumentCreated = false;

async function createOffscreenDocument() {
    if (offscreenDocumentCreated) {
        return;
    }
    
    try {
        await chrome.offscreen.createDocument({
            url: 'offscreen.html',
            reasons: ['USER_MEDIA'],
            justification: 'Screen capture for parallel streaming'
        });
        offscreenDocumentCreated = true;
        console.log("[Service Worker] Offscreen document created");
    } catch (error) {
        console.error("[Service Worker] Error creating offscreen document:", error);
    }
}

// Модифицировать onParallelAccessApproved:
function onParallelAccessApproved(sourceId, opts, tabId) {
    if(!sourceId || !sourceId.length) {
        console.log("[OES Extension] Parallel Stream Permission Denied.");
        return; 
    }
    
    console.log("[Service Worker] Got sourceId for parallel stream:", sourceId);
    
    // Создаем offscreen document, если его еще нет
    createOffscreenDocument().then(() => {
        // Отправляем команду на начало трансляции
        chrome.runtime.sendMessage({
            type: 'start-parallel-stream',
            sourceId: sourceId,
            canRequestAudioTrack: !!opts.canRequestAudioTrack || !!opts.canRequestSystemAudio
        }).then(() => {
            console.log("[Service Worker] Parallel stream started in offscreen document");
        }).catch((error) => {
            console.error("[Service Worker] Error starting parallel stream:", error);
        });
    });
    
    // Также отправляем sourceId в content script для локального превью (опционально)
    var dataToSend = {
        'type': 'oes-data-message',
        'msg': {
            type: 'got-my-sourceId',
            sourceId: sourceId,
            canRequestAudioTrack: !!opts.canRequestAudioTrack || !!opts.canRequestSystemAudio
        }
    };
    
    try { 
        chrome.tabs.sendMessage(tabId, dataToSend); 
        console.log("[Service Worker] Sent sourceId to content script");
    } catch (e){
        console.error("[Service Worker] Error sending to content script:", e);
    }
}

// Добавить слушатель для остановки трансляции
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'stop-parallel-stream') {
        chrome.runtime.sendMessage({ type: 'stop-parallel-stream' });
        sendResponse({ success: true });
    }
    return true;
});
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

// ... (Начало файла остается без изменений)

//-------------------------------------------------------------------------------------------------
// ... (Остальной код файла до onAccessApproved остается без изменений)

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
            // Проверяем наличие системного аудио
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
});
//--------------------------------------------------------------------------------------------------

// service-worker.js

// ==============================
// unified async message handler
// ==============================
chrome.runtime.onMessage.addListener(async (msg, sender) => {
  try {
    if (!msg) return;

    // 1) create / start offscreen
    if (msg.type === 'start-offscreen' || msg.type === 'create-offscreen') {
      try {
        await ensureOffscreen();
        // сообщаем offscreen-скрипту стартовать работу
        chrome.runtime.sendMessage({ type: 'offscreen-start' });
      } catch (err) {
        console.error('[sw] ensureOffscreen failed', err);
      }
      return;
    }

    // 2) stop / close offscreen
    if (msg.type === 'stop-offscreen' || msg.type === 'close-offscreen') {
      try {
        // просим offscreen остановиться (если он слушает)
        chrome.runtime.sendMessage({ type: 'offscreen-stop' });
        // затем закрываем документ
        if (chrome.offscreen && chrome.offscreen.closeDocument) {
          await chrome.offscreen.closeDocument();
        }
      } catch (err) {
        console.warn('[sw] close offscreen failed', err);
      }
      return;
    }

    // 3) signaling / web-rtc related messages
    // Эти сообщения обычно пробрасываются дальше (offscreen или content scripts)
    if (msg.type === 'send-data-message' ||
        msg.type === 'oes-data-message' ||
        msg.type === 'answer' ||
        msg.type === 'offer' ||
        msg.type === 'ice' ||
        msg.type === 'get-my-stream-id' ||
        msg.type === 'get-sourceId-v2' ||
        msg.type === 'audio-plus-tab-v2' ||
        msg.type === 'get-active-tab' ||
        msg.type === 'get-active-tab-v2'
    ) {
      // Пробрасываем сообщение всем слушающим (offscreen / content / popup)
      // offscreen и другие скрипты должны слушать chrome.runtime.onMessage
      try {
        chrome.runtime.sendMessage(msg);
      } catch (e) {
        console.warn('[sw] forward signaling msg failed', e);
      }
      return;
    }

    // 4) simple command flags (yes/no, is-enabled) — пробрасываем
    if (typeof msg === 'string' || ['is-oes-enabled','is-oes-enabled-exam',
        'yes-oes-enabled','yes-oes-enabled-exam','no-oes-disabled','no-oes-disabled-exam',
        'start-exit','do-exit','get-fullscreen-status','close-tabs'
      ].includes(msg.type || msg)) {
      // если это строка или объект с типом — пробросим в offscreen/clients
      try {
        chrome.runtime.sendMessage(msg);
      } catch (e) {
        console.warn('[sw] forward simple flag failed', e);
      }
      return;
    }

    // 5) utility requests: get-version, get-brand, get-jquery-url, reload-extension
    if (msg.type === 'get-version') {
      // отдаём версию (если у тебя есть глобальная переменная protocolVersion)
      const version = typeof protocolVersion !== 'undefined' ? protocolVersion : null;
      chrome.runtime.sendMessage({ type: 'set-version', version });
      return;
    }
    if (msg.type === 'get-brand') {
      chrome.runtime.sendMessage({ type: 'set-brand', brand: 'oes' });
      return;
    }
    if (msg.type === 'get-jquery-url') {
      // пробрасываем URL jquery в offscreen/page
      chrome.runtime.sendMessage({ type: 'jquery-url', url: chrome.runtime.getURL('jquery-3.6.0.js') });
      return;
    }
    if (msg.type === 'reload-extension') {
      try {
        // Попытка попросить UI перезагрузить (если есть слушатель)
        chrome.runtime.sendMessage({ type: 'do-reload' });
        // Принудительная перезагрузка расширения (если нужно) — без API для расширения в runtime
      } catch (e) {
        console.warn('[sw] reload-extension request failed', e);
      }
      return;
    }

    // 6) fallback — если сообщение не распознано, пробросим его (без паники)
    try {
      chrome.runtime.sendMessage(msg);
    } catch (e) {
      console.warn('[sw] forward unknown msg failed', e);
    }
  } catch (e) {
    console.error('[sw] onMessage handler error', e);
  }
});



// === offscreen helpers (вставь в service-worker.js) ===
async function ensureOffscreen() {
  const path = 'offscreen.html';
  const offscreenUrl = chrome.runtime.getURL(path);

  // try runtime.getContexts (новые Chrome)
  if (chrome.runtime.getContexts) {
    try {
      const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
      });
      if (contexts && contexts.length) return;
    } catch (e) {
      // ignore
    }
  } else {
    // fallback: проверим clients
    try {
      const clients = await self.clients.matchAll();
      if (clients.some(c => c.url.includes(offscreenUrl))) return;
    } catch (e) {
      // ignore
    }
  }

  await chrome.offscreen.createDocument({
    url: path,
    reasons: ['DISPLAY_MEDIA'], // для getDisplayMedia; можно 'WEB_RTC' в зависимости от нужд
    justification: 'Capture screen for broadcasting'
  });
}
// ======================================================
// === offscreen helpers (вставь в service-worker.js) ===
async function ensureOffscreen() {
  const path = 'offscreen.html';
  const offscreenUrl = chrome.runtime.getURL(path);

  // try runtime.getContexts (новые Chrome)
  if (chrome.runtime.getContexts) {
    try {
      const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
      });
      if (contexts && contexts.length) return;
    } catch (e) {
      // ignore
    }
  } else {
    // fallback: проверим clients
    try {
      const clients = await self.clients.matchAll();
      if (clients.some(c => c.url.includes(offscreenUrl))) return;
    } catch (e) {
      // ignore
    }
  }

  await chrome.offscreen.createDocument({
    url: path,
    reasons: ['DISPLAY_MEDIA'], // для getDisplayMedia; можно 'WEB_RTC' в зависимости от нужд
    justification: 'Capture screen for broadcasting'
  });
}
// ======================================================
