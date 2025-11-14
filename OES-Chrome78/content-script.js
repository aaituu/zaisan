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
    'canvas.yu.edu.kz',
    'canvas-exam.yu.edu.kz',
    'yu.edu.kz',
    'id.yu.edu.kz',
    'exam.kaznmu.kz',
    'sirius.kaznmu.kz',
    'edukey.kz',
    'topical-specially-finch.ngrok-free.app',
    '86.107.44.173',
    '86.107.44.173:29060',
    'gosaudit.kz',
    'euniver.vku.edu.kz',
    'competence.uchet.kz',
    'uchet.kz',
    'academy-sdo.kz',
    'qrt-new-v.loc',
    'test.qrt.kz',
    'qrt.kz',
    'platonus.almau.edu.kz',
    'study.almau.edu.kz',
    'online.almau.edu.kz',
    'moodle.dku.kz',
    'pl.esil.edu.kz',
    'okk.eqyzmet.gov.kz',
    'test.qrt.kz',
    'qrt.kz',
    '188.127.38.28',
    'pl.vuzkunaeva.kz',
    'daryn.crocos.kz',
    '176.122.87.155',
    'platonus.tttu.edu.kz',
    'ospanov.c-platonus.kz',
    'lms.astanait.edu.kz'
];
//------------------------------------------------------------------------------------------------------
var protocolVersion = 8;
//------------------------------------------------------------------------------------------------------
var isExternal = false;
for (var i = 0; i < sites.length; i++) {
    try {
        if (sites[i].toLowerCase() === window.location.hostname.toLowerCase()) {
            isExternal = true;
            break;
        }
    } catch (e) { /* ignore */ }
}

if (window.location.hostname.toLowerCase().endsWith('.daryn.online') && window.location.hostname.toLowerCase() !== 'proctoring.daryn.online') isExternal = true;
if (window.location.href.toLowerCase().startsWith('https://eqyzmet.gov.kz/proctoring')) isExternal = false;
if (window.location.href.toLowerCase().startsWith('https://proctoring.daryn.online')) isExternal = false;
if (window.location.href.toLowerCase().startsWith('https://proctoring.enbek.kz')) isExternal = false;

if (window.location.hostname.toLowerCase().endsWith('.uchet.kz')) isExternal = true;
if (window.location.href.toLowerCase().startsWith('https://proctoring-competence.uchet.kz')) isExternal = false;
if (window.location.href.toLowerCase().startsWith('https://proctor.crocos.kz')) isExternal = false;

if (window.location.href.toLowerCase().startsWith('https://aet.astanait.edu.kz')) isExternal = false;

if (window.location.href.toLowerCase().startsWith('https://proctoring.icert.kz')) isExternal = false;
//------------------------------------------------------------------------------------------------------
console.log('[Oes Extension] Status', window !== window.top, isExternal);

if (window.location.href.startsWith('chrome-extension://') || window.location.href.endsWith('.pdf')) {
    // No way
    console.log('[OES Extension] Is chrome extension or PDF');
} else if (window !== window.top || isExternal) {
    //--------------------------------------------------------------------------------------------------
    console.log('[OES Extension] Loaded content script from ' + (isExternal ? 'external tab' : 'iframe'));
    //--------------------------------------------------------------------------------------------------
    // Передатчик сообщений от background -> page
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (!('type' in request)) return;
        if (request.type === 'oes-data-message') {
            // forward to page
            window.postMessage(request, '*');
        }
    });
    //--------------------------------------------------------------------------------------------------
    injectScript('inject.js');
    injectScript('inject_init.js');
    injectScript('inject_msgs.js');
    injectScript('inject_counter.js');
    //--------------------------------------------------------------------------------------------------
    // Динамические расширения по хосту
    var host = (window.location.hostname || '').toLowerCase();
    if (host === 'platonus.almau.edu.kz') injectScript('domains/almau_platonus.js');
    if (host === 'study.almau.edu.kz') injectScript('domains/almau_moodle.js');
    if (host === 'online.almau.edu.kz') injectScript('domains/almau_moodle_2.js');
    if (host === 'academy-sdo.kz') injectScript('domains/academy_sdo_moodle.js');
    if (host === 'caspidot.kz') injectScript('domains/cu_moodle.js');
    if (host === 'dku-moodle.kaznu.kz') injectScript('domains/dku_moodle.js');
    if (host === 'moodle.dku.kz') injectScript('domains/dku_moodle.js');
    if (host === 'indigo.dku-almaty.kz') injectScript('domains/dku_indigo.js');
    if (host === 'dl.esil.edu.kz') injectScript('domains/kuef_moodle.js');
    if (host === 'pl.esil.edu.kz') injectScript('domains/kuef_platonus.js');
    if (host === 'dis.htii.kz') injectScript('domains/htii_moodle.js');
    if (host === 'moodle.ku.edu.kz') injectScript('domains/nku_moodle.js');
    if (host === 'univer2.okmpu.kz') injectScript('domains/okmpu_univer2.js');
    if (host === 'univer.okmpu.kz') injectScript('domains/okmpu_univer.js');
    if (host === 'canvas.turan-edu.kz') injectScript('domains/turan_google.js');
    if (host === 'platonus.turan-edu.kz') injectScript('domains/turan_platonus.js');
    if (host === 'euniver.vku.edu.kz') injectScript('domains/vku_euniver.js');
    if (host === 'canvas.yu.edu.kz') injectScript('domains/yu_canvas.js');
    if (host === '188.127.38.28') injectScript('domains/auimvd_platonus.js');
    if (host === '176.122.87.155') injectScript('domains/auimvd_platonus.js');
    if (host === 'pl.vuzkunaeva.kz') injectScript('domains/kunaeva_platonus.js');
    if (host === 'platonus.tttu.edu.kz') injectScript('domains/tttu_platonus.js');
    if (host === 'platonus.zhezu.kz') injectScript('domains/zhezu_platonus.js');
    if (host === 'ospanov.c-platonus.kz') injectScript('domains/ospanov_platonus.js');
    //--------------------------------------------------------------------------------------------------
    // Port connect util
    var port = connectToPort();
    function connectToPort() {
        console.log('[Extension] Establishing new connection...');
        var newPort = null;
        try {
            newPort = chrome.runtime.connect();
        } catch (e) {
            console.warn('[Extension] Connection error', e);
            return null;
        }

        newPort.onDisconnect.addListener(function () {
            console.warn('[Extension] Port disconnected');
            port = null;
        });

        newPort.onMessage.addListener(function (message) {
            // forward background messages to page context
            window.postMessage(message, '*');
        });

        return newPort;
    }

    window.getPort = function () {
        return port;
    };

    //--------------------------------------------------------------------------------------------------
    window.addEventListener('message', function (event) {
        // ensure port is connected
        if (!port) {
            console.warn('[Extension] Port is disconnected. Reconnecting...');
            port = connectToPort();
        }

        try {
            var data = {};
            if (typeof event.data === 'string') {
                try {
                    data = JSON.parse(event.data);
                } catch (e) {
                    // not JSON, handle as plain string below
                    data = null;
                }
            } else {
                data = event.data;
            }

            if (data && data.type === 'send-data-message') {
                if (port) port.postMessage(event.data);
                return;
            }
        } catch (e) {
            // ignore parse errors
        }

        console.log('[OES Extension] Content script got message', event.data);

        // simple string commands forwarded to background
        if (event.data === 'is-oes-enabled') {
            if (port) port.postMessage('is-oes-enabled');
            return;
        }
        if (event.data === 'is-oes-enabled-exam') {
            if (port) port.postMessage('is-oes-enabled-exam');
            return;
        }
        if (event.data === 'yes-oes-enabled') {
            if (port) port.postMessage('yes-oes-enabled');
            return;
        }
        if (event.data === 'yes-oes-enabled-exam') {
            if (port) port.postMessage('yes-oes-enabled-exam');
            return;
        }
        if (event.data === 'no-oes-disabled') {
            if (port) port.postMessage('no-oes-disabled');
            return;
        }
        if (event.data === 'no-oes-disabled-exam') {
            if (port) port.postMessage('no-oes-disabled-exam');
            return;
        }
        if (event.data === 'start-exit') {
            if (port) port.postMessage('start-exit');
            return;
        }
        if (event.data === 'do-exit') {
            if (port) port.postMessage('do-exit');
            return;
        }
        if (event.data === 'get-fullscreen-status') {
            if (port) port.postMessage('get-fullscreen-status');
            return;
        }
        if (event.data === 'get-jquery-url') {
            window.postMessage('jquery-url-' + chrome.runtime.getURL('jquery-3.6.0.js'), '*');
            return;
        }

        // other passthroughs
        if (event.data === 'send-data-message') {
            if (port) port.postMessage(event.data);
            return;
        }

    });

    //--------------------------------------------------------------------------------------------------
    window.postMessage('rtcmulticonnection-extension-loaded-v2', '*');
    //--------------------------------------------------------------------------------------------------
} else {
    //--------------------------------------------------------------------------------------------------
    console.log('[OES Extension] Loaded content script from main tab');
    //--------------------------------------------------------------------------------------------------
    var rtcmulticonnectionMessages = {
        'are-you-there-v2': true,
        'get-sourceId-v2': true,
        'audio-plus-tab-v2': true,
        'is-has-second-monitor': true,
        'is-has-second-monitor-v2': true,
        'get-active-tab': true
    };

    //--------------------------------------------------------------------------------------------------
    // single connect util for main tab branch
    var port = connectToPort();

    function connectToPort() {
        console.log('[Extension] Establishing new connection...');
        var newPort = null;
        try {
            newPort = chrome.runtime.connect();
        } catch (e) {
            console.warn('[Extension] Connection error', e);
            try { chrome.runtime.sendMessage({ action: 'reload-extension' }); } catch (ex) { /* ignore */ }
            return null;
        }

        newPort.onDisconnect.addListener(function () {
            console.warn('[Extension] Port disconnected');
            port = null;
        });

        newPort.onMessage.addListener(function (message) {
            window.postMessage(message, '*');
        });

        return newPort;
    }

    window.getPort = function () {
        return port;
    };

    // handle named channel connects (example)
    chrome.runtime.onConnect.addListener(function (port2) {
        if (port2 && port2.name === 'channel-exit') {
            console.log('[OES Extension] Channel exit connected');
            port2.onMessage.addListener(function (response) {
                window.postMessage('do-exit', '*');
            });
        }
    });

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        // reserved for future messages from background
        if (!('type' in request)) return;
        // intentionally left blank: page messages are forwarded via port.onMessage
    });

    //--------------------------------------------------------------------------------------------------
    window.addEventListener('message', function (event) {
        if (!port) {
            console.warn('[Extension] Port disconnected. Reconnecting...');
            port = connectToPort();
        }

        // basic forwards
        if (event.data === 'get-version') {
            console.log('Get version', protocolVersion);
            window.postMessage(JSON.stringify({ type: 'set-version', version: protocolVersion }), '*');
            return;
        }
        if (event.data === 'get-brand') {
            window.postMessage(JSON.stringify({ type: 'set-brand', brand: 'oes' }), '*');
            return;
        }

        // security: ensure source is allowed before handling some messages
        if (event.source !== window) {
            try {
                if (!event.source.location.href.startsWith('https://caspidot.kz')) return;
            } catch (e) {
                return;
            }
        }

        try {
            var data = typeof event.data === 'string' ? JSON.parseSafe ? JSON.parseSafe(event.data) : (function () { try { return JSON.parse(event.data); } catch (e) { return null; } })() : event.data;
            if (data) {
                if (data.msg === 'set-cookie') {
                    console.log('Got set-cookie');
                    return;
                }
                if (data.type === 'get-cookie') {
                    if (!event.source.location.origin.endsWith('.oes.kz') &&
                        !event.source.location.origin.endsWith('.myoes.ru') &&
                        !event.source.location.origin.endsWith('eqyzmet.gov.kz') &&
                        !event.source.location.origin.endsWith('daryn.online') &&
                        !event.source.location.origin.endsWith('enbek.kz') &&
                        !event.source.location.origin.endsWith('uchet.kz') &&
                        !event.source.location.origin.endsWith('crocos.kz') &&
                        !event.source.location.origin.endsWith('astanait.edu.kz') &&
                        !event.source.location.origin.endsWith('icert.kz')) return;
                    if (port) port.postMessage(event.data);
                    return;
                }
                if (data.type === 'clear-cookie') {
                    if (!event.source.location.origin.endsWith('.oes.kz') &&
                        !event.source.location.origin.endsWith('.myoes.ru') &&
                        !event.source.location.origin.endsWith('eqyzmet.gov.kz') &&
                        !event.source.location.origin.endsWith('daryn.online') &&
                        !event.source.location.origin.endsWith('enbek.kz') &&
                        !event.source.location.origin.endsWith('uchet.kz') &&
                        !event.source.location.origin.endsWith('crocos.kz') &&
                        !event.source.location.origin.endsWith('astanait.edu.kz') &&
                        !event.source.location.origin.endsWith('icert.kz')) return;
                    if (port) port.postMessage(event.data);
                    return;
                }
                if (data.type === 'close-tab') {
                    if (!event.source.location.origin.endsWith('.oes.kz') &&
                        !event.source.location.origin.endsWith('.myoes.ru') &&
                        !event.source.location.origin.endsWith('eqyzmet.gov.kz') &&
                        !event.source.location.origin.endsWith('daryn.online') &&
                        !event.source.location.origin.endsWith('enbek.kz') &&
                        !event.source.location.origin.endsWith('uchet.kz') &&
                        !event.source.location.origin.endsWith('crocos.kz') &&
                        !event.source.location.origin.endsWith('astanait.edu.kz') &&
                        !event.source.location.origin.endsWith('icert.kz')) return;
                    if (port) port.postMessage(event.data);
                    return;
                }
                if (data.type === 'send-data-message') {
                    if (!event.source.location.origin.endsWith('.oes.kz') &&
                        !event.source.location.origin.endsWith('.myoes.ru') &&
                        !event.source.location.origin.endsWith('eqyzmet.gov.kz') &&
                        !event.source.location.origin.endsWith('daryn.online') &&
                        !event.source.location.origin.endsWith('enbek.kz') &&
                        !event.source.location.origin.endsWith('uchet.kz') &&
                        !event.source.location.origin.endsWith('crocos.kz') &&
                        !event.source.location.origin.endsWith('astanait.edu.kz') &&
                        !event.source.location.origin.endsWith('icert.kz')) return;
                    if (port) port.postMessage(event.data);
                    return;
                }
                if (data.type === 'do-program-query') {
                    if (!event.source.location.origin.endsWith('.oes.kz') &&
                        !event.source.location.origin.endsWith('.myoes.ru') &&
                        !event.source.location.origin.endsWith('eqyzmet.gov.kz') &&
                        !event.source.location.origin.endsWith('daryn.online') &&
                        !event.source.location.origin.endsWith('enbek.kz') &&
                        !event.source.location.origin.endsWith('uchet.kz') &&
                        !event.source.location.origin.endsWith('crocos.kz') &&
                        !event.source.location.origin.endsWith('astanait.edu.kz') &&
                        !event.source.location.origin.endsWith('icert.kz')) return;
                    if (port) port.postMessage(event.data);
                    return;
                }
                if (data.type === 'answer') {
                    if (port) port.postMessage(event.data);
                    return;
                }
                if (data.type === 'oes-data-message') {
                    if (port) port.postMessage(event.data);
                    return;
                }
            }
        } catch (e) {
            // ignore JSON parse errors
        }

        // generic forward for certain messages
        if (event.data && event.data['get-custom-sourceId']) {
            if (port) port.postMessage(event.data);
            return;
        }

        if (event.data === 'start-exit') {
            if (port) port.postMessage('start-exit');
            return;
        }
        if (event.data === 'do-exit') {
            if (port) port.postMessage('do-exit');
            return;
        }
        if (event.data === 'close-tabs') {
            if (port) port.postMessage('close-tabs');
            return;
        }
        if (event.data === 'get-fullscreen-status') {
            if (port) port.postMessage('get-fullscreen-status');
            return;
        }

        if (!rtcmulticonnectionMessages[event.data]) return;

        // messages that are forwarded back to page context
        if (event.data === 'is-oes-enabled') {
            window.postMessage('is-oes-enabled', '*');
            return;
        }
        if (event.data === 'is-oes-enabled-exam') {
            window.postMessage('is-oes-enabled-exam', '*');
            return;
        }
        if (event.data === 'yes-oes-enabled') {
            window.postMessage('yes-oes-enabled', '*');
            return;
        }
        if (event.data === 'yes-oes-enabled-exam') {
            window.postMessage('yes-oes-enabled-exam', '*');
            return;
        }
        if (event.data === 'no-oes-disabled') {
            window.postMessage('no-oes-disabled', '*');
            return;
        }
        if (event.data === 'no-oes-disabled-exam') {
            window.postMessage('no-oes-disabled-exam', '*');
            return;
        }
        if (event.data === 'are-you-there-v2') {
            window.postMessage('rtcmulticonnection-extension-loaded-v2', '*');
            return;
        }
        if (event.data === 'get-sourceId-v2' || event.data === 'audio-plus-tab-v2') {
            if (port) port.postMessage(event.data);
            return;
        }
        if (event.data === 'is-has-second-monitor-v2') {
            if (port) port.postMessage('is-has-second-monitor');
            return;
        }
        if (event.data === 'get-active-tab') {
            if (port) port.postMessage('get-active-tab');
            return;
        }
        if (event.data === 'get-active-tab-v2') {
            if (port) port.postMessage('get-active-tab-v2');
            return;
        }
    });

    //--------------------------------------------------------------------------------------------------
    // inform page that we're available
    window.postMessage(JSON.stringify({ type: 'set-version', version: protocolVersion }), '*');
    window.postMessage('rtcmulticonnection-extension-loaded-v2', '*');
    try { if (port) port.postMessage('is-has-second-monitor'); } catch (e) { /* ignore */ }
    //--------------------------------------------------------------------------------------------------
}

//------------------------------------------------------------------------------------------------------
function injectScript(src) {
    try {
        var s = document.createElement('script');
        s.src = chrome.runtime.getURL(src);
        s.onload = function () { s.remove(); };
        (document.head || document.documentElement).appendChild(s);
    } catch (e) {
        console.warn('[injectScript] failed to inject', src, e);
    }
}

//------------------------------------------------------------------------------------------------------
// Unified background port listener at file bottom (keeps single connection)
try {
    var bgPort = chrome.runtime.connect();
    if (bgPort) {
        bgPort.onMessage.addListener(function (message) {
            if (typeof message === 'string') {
                console.log('[OES Extension] Got message from background', message);
                window.postMessage(message, '*');
            } else if (message && message.type === 'oes-data-message') {
                console.log('[OES Extension] Got data message from background', message.msg);
                window.postMessage(message, '*');
            } else {
                console.log('[OES Extension] Got message from background (object)', message);
                window.postMessage(message, '*');
            }
        });

        window.addEventListener('message', function (event) {
            // forwards (secondary handlers)
            if (event.data === 'reload-extension') {
                bgPort.postMessage(event.data);
                return;
            }
            if (event.data === 'get-sourceId-v2' || event.data === 'audio-plus-tab-v2') {
                bgPort.postMessage(event.data);
                return;
            }
            if (event.data === 'is-has-second-monitor-v2') {
                bgPort.postMessage('is-has-second-monitor');
                return;
            }
            if (event.data === 'get-active-tab') {
                bgPort.postMessage('get-active-tab');
                return;
            }
            if (event.data === 'get-active-tab-v2') {
                bgPort.postMessage('get-active-tab-v2');
                return;
            }
            // new handler for parallel stream id
            if (event.data === 'get-my-stream-id') {
                bgPort.postMessage('get-my-stream-id');
                return;
            }
        });
    }
} catch (e) {
    console.warn('[OES Extension] could not connect to background at bottom', e);
}
//------------------------------------------------------------------------------------------------------
