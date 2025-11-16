//------------------------------------------------------------------------------------------------------
var sites = [
    '88.151.182.130',
    '37.151.45.5',
    '95.59.142.18',
    'platonus.atso.kz',
    'ayu-moodle.oes.kz',
    'olimp.ayu.edu.kz',
    'dot.bolashaq.edu.kz',
    'platonus.cau.kz',
    'caspidot.kz',
    'dku-almaty.kz',
    'dku-almaty.kz',
    '88.204.167.74',
    'platonus.kazadi.kz',
    'dl.kazetu.kz',
    'indigo.kazmuno.kz',
    'exam.kaznmu.kz',
    'sdo.kineu.kz',
    'newtest.kineu.kz',
    '89.40.53.234',
    '95.57.214.118',
    'platonus.ksu.edu.kz',
    'md.ksu.edu.kz',
    'unikuam.kaznu.kz',
    'apikuam.kaznu.kz',
    '5.188.154.102',
    'kaztest.kau.kz',
    'test.kazgasa.kz',
    'edu.nmu.kz',
    'univerapi.okmpu.kz',
    'univer.okmpu.kz',
    'dis.tigu.kz',
    'platonus.turan-edu.kz',
    'canvas.turan-edu.kz',
    'platonus.turan-edu.kz',
    'apiuniver.yu.edu.kz',
    'univer.yu.edu.kz',
    'md.ksu.edu.kz*',
    'md.ksu.edu.kz',
    'edu.kaznai.kz',
    'dhmc.zhambyl.kz',
    'zhezu.kaznu.kz',
    'docs.google.com',
    'splavplus.indigotech.ru',
    'webwhiteboard.com',
    'moodle.kafu.edu.kz',
    'e.eiti.kz',
    'dev.eiti.kz',
    'dku-moodle.kaznu.kz',
    'indigo.dku-almaty.kz',
    'dku.kaznu.kz',
    '37.151.22.6',
    'dis.htii.kz',
    'platonus.kazatiso.edu.kz',
    'platonus.tttu.edu.kz',
    'moodle.nku.edu.kz',
    'pl.amu.kz',
    'dph.amu.kz',
    'dl.amu.kz',
    'univer.kaznpu.kz',
    'e.kaznpu.kz',
    'pl.kuef.kz',
    'uef-astana.kz',
    'amu-dl-moodle-kz.oes.kz',
    'amu-dph-moodle-kz.oes.kz',
    'amu-platonus-kz.oes.kz',
    'kaznpu-univer.oes.kz',
    'dl.nmu.edu.kz',
    '185.146.0.243',
    'platonus.zhezu.kz',
    'platonus.tttu.kz',
    'eqyzmet.gov.kz',
    'do.esil.edu.kz',
    'dl.esil.edu.kz',
    'tst.htii.kz',
    'kunaev-edu.kz',
    '87.255.197.219',
    'univer2.okmpu.kz',
    'eqyzmet.gov.kz',
    'eqyzmet-dev.gov.kz',
    'candidate.shl.tools',
    'daryn.online',
    'test.daryn.online',
    'moodle.ku.edu.kz',
    'polytechonline.kz',
    'qalan.kz',
    'enbek.kz',
    'skils.enbek.kz',
    'skills.enbek.kz',
    'stest.enbek.kz',
    "canvas.yu.edu.kz",
    "canvas-exam.yu.edu.kz",
    "yu.edu.kz",
    "id.yu.edu.kz",
    "exam.kaznmu.kz",
    "sirius.kaznmu.kz",
    "edukey.kz",
    "topical-specially-finch.ngrok-free.app",
    "86.107.44.173",
    "86.107.44.173:29060",
    "gosaudit.kz",
    "euniver.vku.edu.kz",
    'competence.uchet.kz',
    'uchet.kz',
    "academy-sdo.kz",
    "qrt-new-v.loc",
    "test.qrt.kz",
    "qrt.kz",
    "platonus.almau.edu.kz",
    "study.almau.edu.kz",
    "online.almau.edu.kz",
    "moodle.dku.kz",
    "pl.esil.edu.kz",
    "okk.eqyzmet.gov.kz",
    "test.qrt.kz",
    "qrt.kz",
    "188.127.38.28",
    "pl.vuzkunaeva.kz",
    "daryn.crocos.kz",
    "176.122.87.155",
    "platonus.tttu.edu.kz",
    "ospanov.c-platonus.kz",
    "lms.astanait.edu.kz"
];
var protocolVersion = 8;
//------------------------------------------------------------------------------------------------------
var isExternal = false;
for (var i = 0; i < sites.length; i++) {
    if (sites[i].toLowerCase() == window.location.hostname.toLowerCase()) isExternal = true;
}

if (window.location.hostname.toLowerCase().endsWith('.daryn.onlline') && window.location.hostname.toLowerCase() != 'proctoring.daryn.online') isExternal = true;
if (window.location.href.toLowerCase().startsWith('https://eqyzmet.gov.kz/proctoring')) isExternal = false;
if (window.location.href.toLowerCase().startsWith('https://proctoring.daryn.online')) isExternal = false;
if (window.location.href.toLowerCase().startsWith('https://proctoring.enbek.kz')) isExternal = false;

if (window.location.hostname.toLowerCase().endsWith('.uchet.kz')) isExternal = true;
if (window.location.href.toLowerCase().startsWith('https://proctoring-competence.uchet.kz')) isExternal = false;
if (window.location.href.toLowerCase().startsWith('https://proctor.crocos.kz')) isExternal = false;

if (window.location.href.toLowerCase().startsWith('https://aet.astanait.edu.kz')) isExternal = false;

if (window.location.href.toLowerCase().startsWith('https://proctoring.icert.kz')) isExternal = false;
//------------------------------------------------------------------------------------------------------
console.log('[Oes Extension] Status', window != window.top, isExternal);;

if (window.location.href.startsWith("chrome-extension://") || window.location.href.endsWith('.pdf')){
	// No way
    console.log("[OES Extension] Is chrome extension");
} else 
if (window != window.top || (isExternal) ) {
	//--------------------------------------------------------------------------------------------------
    console.log("[OES Extension] Loaded content script from " + (isExternal ? 'external tab' : 'iframe') );
    //--------------------------------------------------------------------------------------------------
    // Передатчик сообщений
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (!('type' in request)) return;
        if (request.type == 'oes-data-message'){
            window.postMessage(request, '*');
        }
    });
    //--------------------------------------------------------------------------------------------------
    injectScript('inject.js');
    injectScript('inject_init.js');
    injectScript('inject_msgs.js');
    injectScript('inject_counter.js');
    // Добавляем параллельную трансляцию
    // Добавляем параллельную трансляцию
    injectScript('parallel-stream.js');
    //--------------------------------------------------------------------------------------------------
    // Динамические расширения
    var host = window.location.hostname.toLowerCase();
    if (host == 'platonus.almau.edu.kz') injectScript("domains/almau_platonus.js");
    if (host == 'study.almau.edu.kz') injectScript("domains/almau_moodle.js");
    if (host == 'online.almau.edu.kz') injectScript("domains/almau_moodle_2.js");
    if (host == 'academy-sdo.kz') injectScript("domains/academy_sdo_moodle.js");
    if (host == 'caspidot.kz') injectScript("domains/cu_moodle.js");
    if (host == 'dku-moodle.kaznu.kz') injectScript("domains/dku_moodle.js");
    if (host == 'moodle.dku.kz') injectScript("domains/dku_moodle.js");
    if (host == 'indigo.dku-almaty.kz') injectScript("domains/dku_indigo.js");
    if (host == 'dl.esil.edu.kz') injectScript("domains/kuef_moodle.js");
    if (host == 'pl.esil.edu.kz') injectScript("domains/kuef_platonus.js");
    if (host == 'dis.htii.kz') injectScript("domains/htii_moodle.js");
    if (host == 'moodle.ku.edu.kz') injectScript("domains/nku_moodle.js");
    if (host == 'univer2.okmpu.kz') injectScript("domains/okmpu_univer2.js");
    if (host == 'univer.okmpu.kz') injectScript("domains/okmpu_univer.js");
    if (host == 'canvas.turan-edu.kz') injectScript("domains/turan_google.js");
    if (host == 'platonus.turan-edu.kz') injectScript("domains/turan_platonus.js");
    if (host == 'euniver.vku.edu.kz') injectScript("domains/vku_euniver.js");
    if (host == 'canvas.yu.edu.kz') injectScript("domains/yu_canvas.js");
    if (host == '188.127.38.28') injectScript("domains/auimvd_platonus.js");
    if (host == '176.122.87.155') injectScript("domains/auimvd_platonus.js");
    if (host == 'pl.vuzkunaeva.kz') injectScript("domains/kunaeva_platonus.js");
    if (host == 'platonus.tttu.edu.kz') injectScript("domains/tttu_platonus.js");
    if (host == 'platonus.zhezu.kz') injectScript("domains/zhezu_platonus.js");
    if (host == 'ospanov.c-platonus.kz') injectScript("domains/ospanov_platonus.js");
    //--------------------------------------------------------------------------------------------------
    var port = connectToPort();  
    function connectToPort() {
        console.log("[Extension] Устанавливаю новое соединение...");
        const newPort = chrome.runtime.connect();

        newPort.onDisconnect.addListener(() => {
            console.warn("[Extension] Порт был отключён");
            port = null; // Обнуляем порт, чтобы можно было переподключиться
        });
        newPort.onMessage.addListener(function (message) {
            window.postMessage(message, '*');
        });

        return newPort;
    } 
    window.getPort = function(){
        return port;
    }
    //--------------------------------------------------------------------------------------------------
    window.addEventListener('message', function (event) {

        if (!port) {
            console.warn("[Extension] Порт отключён. Переподключаюсь...");
            port = connectToPort(); // Переподключение
        }

        try{
            var data = JSON.parse(event.data);

            if (data.type == 'send-data-message'){
                port.postMessage(event.data);
                return;
            }
        } catch (e){

        }
         console.log("[OES Extension] Content script got message", event.data );

        //-----------------------
        if (event.data == 'is-oes-enabled') {
            port.postMessage('is-oes-enabled', '*');
        }
        if (event.data == 'is-oes-enabled-exam') {
            port.postMessage('is-oes-enabled-exam', '*');
        }
        if (event.data == 'yes-oes-enabled') {
            port.postMessage('yes-oes-enabled', '*');
        }
        if (event.data == 'yes-oes-enabled-exam') {
            port.postMessage('yes-oes-enabled-exam', '*');
        }
        if (event.data == 'no-oes-disabled') {
            port.postMessage('no-oes-disabled', '*');
        }
        if (event.data == 'no-oes-disabled-exam') {
            port.postMessage('no-oes-disabled-exam', '*');
        }
        if (event.data == 'start-exit') {
            port.postMessage('start-exit', '*');
        }
        if (event.data == 'do-exit') {
            port.postMessage('do-exit', '*');
        }
        if (event.data == 'get-fullscreen-status') {
            port.postMessage('get-fullscreen-status', '*');
        }
        if (event.data == 'get-jquery-url') {
            window.postMessage("jquery-url-" + chrome.runtime.getURL('jquery-3.6.0.js'), '*');
        }
    });
    //--------------------------------------------------------------------------------------------------
    window.postMessage('rtcmulticonnection-extension-loaded-v2', '*');
    //--------------------------------------------------------------------------------------------------
} else {
	//--------------------------------------------------------------------------------------------------
    console.log("[OES Extension] Loaded content script from main tab");
    //--------------------------------------------------------------------------------------------------
     var rtcmulticonnectionMessages = {
        'are-you-there-v2': true,
        'get-sourceId-v2':  true,
        'audio-plus-tab-v2': true,
        'is-has-second-monitor': true,
        'is-has-second-monitor-v2': true,
        'get-active-tab': true,
    };
    //--------------------------------------------------------------------------------------------------
    var port = connectToPort();  
    function connectToPort() {
        console.log("[Extension] Устанавливаю новое соединение...");
        let newPort = null;
        try{
            newPort = chrome.runtime.connect();
        } catch (e){
            console.log('[Extension] Ошибка соединения');
            chrome.runtime.sendMessage({ action: 'reload-extension' });
            return;
        }

        newPort.onDisconnect.addListener(() => {
            console.warn("[Extension] Порт был отключён");
            port = null; // Обнуляем порт, чтобы можно было переподключиться
        });
        newPort.onMessage.addListener(function (message) {
            window.postMessage(message, '*');
        });

        return newPort;
    } 
    window.getPort = function(){
        return port;
    }
    //--------------------------------------------------------------------------------------------------
    chrome.runtime.onConnect.addListener(function(port2) {
        if(port2.name == "channel-exit"){
            console.log("[OES Extension] Channel exit on connected");
            port2.onMessage.addListener(function(response) {
                window.postMessage('do-exit', '*');
            }); 
        }
    });
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (!('type' in request)) return;
        if (request.type == 'oes-data-message'){
            window.postMessage(request, '*');
        }
    });
    //--------------------------------------------------------------------------------------------------
    window.addEventListener('message', function (event) {
         if (!port) {
            console.warn("[Extension] Порт отключён. Переподключаюсь...");
            port = connectToPort(); // Переподключение
        }
        if (event.data == 'get-version') {
            console.log("Get version", protocolVersion);
            window.postMessage(JSON.stringify({'type': 'set-version', 'version': protocolVersion}), '*');
        }
        if (event.data == 'get-brand') { 
            window.postMessage(JSON.stringify({'type': 'set-brand', 'brand': 'oes'}), '*');
        }
        if (event.source != window)
            try{
                if (
                    !event.source.location.href.startsWith('https://caspidot.kz')
                )
                    return;
            } catch(e){
                return;
            }
        try{
            var data = JSON.parse(event.data);
            console.log('GOT JSON', data);
            if (data.msg == 'set-cookie'){
                console.log('Got set-cookie');
                return;
            }
            if (data.type == 'get-cookie'){
                if (!event.source.location.origin.endsWith('.oes.kz') && !event.source.location.origin.endsWith('.myoes.ru') && !event.source.location.origin.endsWith('eqyzmet.gov.kz') && !event.source.location.origin.endsWith('daryn.online') && !event.source.location.origin.endsWith('enbek.kz') && !event.source.location.origin.endsWith('uchet.kz') && !event.source.location.origin.endsWith('crocos.kz') && !event.source.location.origin.endsWith('astanait.edu.kz') && !event.source.location.origin.endsWith('icert.kz')) return;
                port.postMessage(event.data);
                return;
            }
            if (data.type == 'clear-cookie'){
                if (!event.source.location.origin.endsWith('.oes.kz') && !event.source.location.origin.endsWith('.myoes.ru') && !event.source.location.origin.endsWith('eqyzmet.gov.kz') && !event.source.location.origin.endsWith('daryn.online') && !event.source.location.origin.endsWith('enbek.kz') && !event.source.location.origin.endsWith('uchet.kz') && !event.source.location.origin.endsWith('crocos.kz') && !event.source.location.origin.endsWith('astanait.edu.kz') && !event.source.location.origin.endsWith('icert.kz')) return;
                port.postMessage(event.data);
                return;
            }
            if (data.type == 'close-tab'){
                if (!event.source.location.origin.endsWith('.oes.kz') && !event.source.location.origin.endsWith('.myoes.ru') && !event.source.location.origin.endsWith('eqyzmet.gov.kz') && !event.source.location.origin.endsWith('daryn.online') && !event.source.location.origin.endsWith('enbek.kz') && !event.source.location.origin.endsWith('uchet.kz') && !event.source.location.origin.endsWith('crocos.kz') && !event.source.location.origin.endsWith('astanait.edu.kz') && !event.source.location.origin.endsWith('icert.kz')) return;
                port.postMessage(event.data);
                return;
            }
            if (data.type == 'send-data-message'){
                if (!event.source.location.origin.endsWith('.oes.kz') && !event.source.location.origin.endsWith('.myoes.ru') && !event.source.location.origin.endsWith('eqyzmet.gov.kz') && !event.source.location.origin.endsWith('daryn.online') && !event.source.location.origin.endsWith('enbek.kz') && !event.source.location.origin.endsWith('uchet.kz') && !event.source.location.origin.endsWith('crocos.kz') && !event.source.location.origin.endsWith('astanait.edu.kz') && !event.source.location.origin.endsWith('icert.kz')) return;
                port.postMessage(event.data);
                return;
            }
            if (data.type == 'do-program-query'){
                if (!event.source.location.origin.endsWith('.oes.kz') && !event.source.location.origin.endsWith('.myoes.ru') && !event.source.location.origin.endsWith('eqyzmet.gov.kz') && !event.source.location.origin.endsWith('daryn.online') && !event.source.location.origin.endsWith('enbek.kz') && !event.source.location.origin.endsWith('uchet.kz') && !event.source.location.origin.endsWith('crocos.kz') && !event.source.location.origin.endsWith('astanait.edu.kz') && !event.source.location.origin.endsWith('icert.kz')) return;
                port.postMessage(event.data);
                return;
            }
            if (data.type == 'answer'){
                port.postMessage(event.data);
                return;
            }
            if (data.type == 'oes-data-message'){
                port.postMessage(event.data);
                return;
            }
        } catch (e){

        }
        if(!!event.data['get-custom-sourceId']) {
            // forward message to background script
            port.postMessage(event.data);
            return;
        }
        if (event.data == 'start-exit') {
            port.postMessage('start-exit', '*');
        }
        if (event.data == 'do-exit') {
            port.postMessage('do-exit', '*');
        }
        if(event.data == 'close-tabs') {
            port.postMessage("close-tabs");
        }
        if(event.data == 'get-fullscreen-status') {
            port.postMessage("get-fullscreen-status");
        }
        if(!rtcmulticonnectionMessages[event.data]) return;
        if(event.data == 'is-oes-enabled') {
            window.postMessage('is-oes-enabled', '*');
        }
        if(event.data == 'is-oes-enabled-exam') {
            window.postMessage('is-oes-enabled-exam', '*');
        }
        if(event.data == 'yes-oes-enabled') {
            window.postMessage('yes-oes-enabled', '*');
        }
        if(event.data == 'yes-oes-enabled-exam') {
            window.postMessage('yes-oes-enabled-exam', '*');
        }
        if(event.data == 'no-oes-disabled') {
            window.postMessage('no-oes-disabled', '*');
        }
        if(event.data == 'no-oes-disabled-exam') {
            window.postMessage('no-oes-disabled-exam', '*');
        }
        if(event.data == 'are-you-there-v2') {
            window.postMessage('rtcmulticonnection-extension-loaded-v2', '*');
        }
        if(event.data == 'get-sourceId-v2' || event.data === 'audio-plus-tab-v2') {
            port.postMessage(event.data);
        }
        if(event.data == 'is-has-second-monitor-v2') {
            port.postMessage("is-has-second-monitor");
        }
        if(event.data == 'get-active-tab') {
            port.postMessage("get-active-tab");
        } 
        if(event.data == 'get-active-tab-v1') {
            port.postMessage("get-active-tab-v1");
        } 
        if(event.data == 'get-active-tab-v2') {
            port.postMessage("get-active-tab-v2");
        } 

    });
    //-------------------------------------------------------------------------------------------------- 
    // inform browser that you're available!
    window.postMessage(JSON.stringify({'type': 'set-version', 'version': protocolVersion}), '*');
    window.postMessage('rtcmulticonnection-extension-loaded-v2', '*');
    port.postMessage("is-has-second-monitor");
    //--------------------------------------------------------------------------------------------------
}
//------------------------------------------------------------------------------------------------------
function injectScript (src) {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL(src);
    s.onload = () => s.remove();
    (document.head || document.documentElement).append(s);
}
// В конце вашего content-script.js добавьте:

//===========================================
// PARALLEL STREAM BRIDGE - УЛУЧШЕННАЯ ВЕРСИЯ
//===========================================
console.log('[Content Script Bridge] Loading...');

let streamingState = {
    isStreaming: false,
    serverUrl: 'ws://localhost:8080/signal'
};

// Слушаем сообщения от service worker и popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Content Script Bridge] Got message:', message.type);

    // Запрос статуса
    if (message.type === 'get-streaming-status') {
        sendResponse({
            isStreaming: streamingState.isStreaming,
            serverUrl: streamingState.serverUrl
        });
        return true;
    }

    // Команда: начать трансляцию
    if (message.type === 'start-parallel-stream') {
        console.log('[Content Script Bridge] Starting stream...');
        
        // Отправляем команду в inject script
        window.postMessage({
            type: 'parallel-stream-command',
            action: 'start'
        }, '*');
        
        // Даем время на запуск
        setTimeout(() => {
            sendResponse({ success: true });
        }, 1000);
        
        return true; // Асинхронный ответ
    }

    // Команда: остановить трансляцию
    if (message.type === 'stop-parallel-stream') {
        console.log('[Content Script Bridge] Stopping stream...');
        
        window.postMessage({
            type: 'parallel-stream-command',
            action: 'stop'
        }, '*');
        
        streamingState.isStreaming = false;
        sendResponse({ success: true });
        return true;
    }
});

// Слушаем статус от inject script
window.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') return;

    const data = event.data;
    
    // Обновление статуса
    if (data.type === 'parallel-stream-status') {
        streamingState.isStreaming = data.isStreaming;
        console.log('[Content Script Bridge] Status updated:', streamingState.isStreaming);
        
        // Уведомляем service worker
        chrome.runtime.sendMessage({
            type: 'streaming-status',
            isStreaming: data.isStreaming
        }).catch(() => {});
    }

    // Трансляция запущена
    if (data.type === 'parallel-stream-started') {
        streamingState.isStreaming = true;
        console.log('[Content Script Bridge] Stream STARTED');
        
        chrome.runtime.sendMessage({
            type: 'streaming-status',
            isStreaming: true
        }).catch(() => {});
    }

    // Трансляция остановлена
    if (data.type === 'parallel-stream-stopped') {
        streamingState.isStreaming = false;
        console.log('[Content Script Bridge] Stream STOPPED');
        
        chrome.runtime.sendMessage({
            type: 'streaming-status',
            isStreaming: false
        }).catch(() => {});
    }

    // URL для просмотра
    if (data.type === 'parallel-stream-url') {
        chrome.runtime.sendMessage({
            type: 'stream-url',
            url: data.url
        }).catch(() => {});
    }

    // Количество зрителей
    if (data.type === 'parallel-stream-viewers') {
        chrome.runtime.sendMessage({
            type: 'viewer-count',
            count: data.count
        }).catch(() => {});
    }

    // Ошибка
    if (data.type === 'parallel-stream-error') {
        chrome.runtime.sendMessage({
            type: 'stream-error',
            error: data.error
        }).catch(() => {});
    }
});

console.log('[Content Script Bridge] Ready');