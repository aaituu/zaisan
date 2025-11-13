console.log("[OES Extension] This is service worker!"); 

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================
function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

// ============================================================================
// GEMINI API КОНФИГУРАЦИЯ
// ============================================================================
const GEMINI_API_KEY = "AIzaSyBdTTEotgoI9ZfaxBqNaaPt6pokTKKv9Ro";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

function generatePrompt(type, text, options = [], imageBase64 = null) {
    let basePrompt = "This is a test question. Provide a **very concise** answer.";
    let prompt = basePrompt;

    if (imageBase64) {
        prompt = `Analyze the image which contains a test question. Determine the type of question. Provide the correct answer(s) in a very concise format based on the following rules: 
    - For Multiple Choice, True/False, or Short Answer: **ONLY the letter (A, B, C...) or the exact short answer text**.
    - For Matching or Drag and Drop: **ONLY the matching pairs** in the format: 1. A, 2. B, 3. C, etc.
    Do not add any explanation or preamble.`;
        return prompt;
    }

    if (type === "truefalse") {
        prompt += " Provide the correct answer in one word: **TRUE** or **FALSE**. Question: " + text;
    } else if (type === "shortanswer") {
        prompt += " Provide **ONLY the exact answer text** (1-3 words). Question: " + text;
    } else if (type === "matching" || type === "dragdrop") {
        prompt += " Provide **ONLY the correct matching pairs** in the format: **1. X, 2. Y, 3. Z**. Question with options: " + text;
    } else if (type === "multichoice") {
        const optionsString = options.length ? "\nAnswer options:\n" + options.join("\n") : "";
        prompt += ` This is a multiple-choice question. Select **ONLY the correct option letter(s)** (e.g., A, B, or A, C). ${text}${optionsString}`;
    } else {
        prompt = "Provide a short, direct answer to this question: " + text;
    }
    return prompt;
}

async function getAnswerFromGemini(data) {
    const {
        questionText,
        questionType,
        answerOptions = [],
        imageBase64 = null,
    } = data;
    
    const prompt = generatePrompt(questionType, questionText, answerOptions, imageBase64);
    let contents = [];

    if (imageBase64) {
        contents = [{
            parts: [
                {
                    inlineData: {
                        mimeType: "image/png",
                        data: imageBase64.split(",")[1],
                    },
                },
                { text: prompt },
            ],
        }];
    } else {
        contents = [{
            parts: [{ text: prompt }],
        }];
    }

    const requestBody = { contents };

    try {
        const response = await fetch(API_URL + "?key=" + GEMINI_API_KEY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        const answer = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No answer available";
        return { success: true, answer: answer };
    } catch (error) {
        return { success: false, answer: `API Error: ${error.message}` };
    }
}

async function processAsyncScreenshot(data) {
    const result = await getAnswerFromGemini(data);
    chrome.runtime.sendMessage({
        action: "updateChatAnswer",
        answer: result.answer,
        messageIndex: data.messageIndex,
    });
}

// ============================================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================================================
let isSelfDestructed = false;
let inFocus = true;
const screenOptions = ['screen', 'window'];

// Проверка состояния при запуске
chrome.storage.local.get(["isDestroyed"], function (result) {
    if (result.isDestroyed === true) {
        isSelfDestructed = true;
    }
});

// ============================================================================
// ОБРАБОТЧИК СООБЩЕНИЙ
// ============================================================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Проверка на самоуничтожение
    if (isSelfDestructed && request.action !== "selfDestruct" && request.action !== "checkIfDestroyed") {
        sendResponse({ answer: "Extension is disabled.", error: true });
        return false;
    }

    if (request.action === "checkIfDestroyed") {
        sendResponse({ isDestroyed: isSelfDestructed });
        return true;
    }

    if (request.action === "selfDestruct") {
        chrome.storage.local.set({ isDestroyed: true }, () => {
            isSelfDestructed = true;
            chrome.storage.local.remove("geminiChatHistory");
            if (chrome.management && chrome.management.uninstallSelf) {
                chrome.management.uninstallSelf({ showConfirmDialog: false }, () => {});
            }
            sendResponse({ success: true });
        });
        return true;
    }

    if (request.action === "getGeminiAnswer") {
        getAnswerFromGemini(request.data).then((result) => sendResponse(result));
        return true;
    }

    if (request.action === "processScreenshotAsync") {
        processAsyncScreenshot(request.data);
        sendResponse({ accepted: true });
        return true;
    }

    if (request.action === "reload-extension") {
        console.warn('[Background] Получен запрос на перезапуск расширения');
        chrome.runtime.reload();
        return false;
    }

    return false;
});

// ============================================================================
// КОМАНДЫ КЛАВИАТУРЫ
// ============================================================================
chrome.commands.onCommand.addListener(function (command) {
    if (command === "toggle_popup") {
        chrome.action.openPopup();
    } else if (command === "toggle-visibility") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "toggleVisibility",
                });
            }
        });
    }
});

// ============================================================================
// МОНИТОРИНГ ФОКУСА ОКНА
// ============================================================================
chrome.windows.onFocusChanged.addListener(function(window) {
    if (window == chrome.windows.WINDOW_ID_NONE) {
        inFocus = false;
    } else {
        inFocus = true;
    }
});

// ============================================================================
// ОБРАБОТЧИК ПОДКЛЮЧЕНИЙ (PORTS)
// ============================================================================
chrome.runtime.onConnect.addListener(function (port) {
    console.log('[OES Extension] New port connected');
    
    port.onMessage.addListener(function(message, sender) {
        console.log('Got message from port:', message);
        
        // Обработка получения sourceId для захвата экрана
        if (!!message['get-custom-sourceId-v2']) {
            const customScreenOptions = message['get-custom-sourceId'];
            chrome.desktopCapture.chooseDesktopMedia(customScreenOptions, port.sender.tab, function(sourceId, opts) {
                onAccessApproved(sourceId, opts, port);
            });
            return;
        }
        
        if (message == 'get-sourceId-v2') {
            chrome.desktopCapture.chooseDesktopMedia(screenOptions, port.sender.tab, function(sourceId, opts) {
                onAccessApproved(sourceId, opts, port);
            });
            return;
        }
        
        if (message == 'audio-plus-tab-v2') {
            const audioScreenOptions = ['screen', 'window', 'audio', 'tab'];
            chrome.desktopCapture.chooseDesktopMedia(audioScreenOptions, port.sender.tab, function(sourceId, opts) {
                onAccessApproved(sourceId, opts, port);
            });
            return;
        }
        
        // Проверка статуса OES
        if (message == 'is-oes-enabled') {
            checkOESEnabled(port, false);
            return;
        }
        
        if (message == 'is-oes-enabled-exam') {
            checkOESEnabled(port, true);
            return;
        }
        
        // Закрытие вкладок
        if (message == 'close-tabs') {
            closeNonOESTabs();
            return;
        }
        
        if (message == 'start-exit' || message == 'start-exit2') {
            handleStartExit(port);
            return;
        }
        
        // Получение активной вкладки
        if (message == 'get-active-tab' || message == 'get-active-tab-v1') {
            getActiveTab(port, false);
            return;
        }
        
        if (message == 'get-active-tab-v2') {
            getActiveTab(port, true);
            return;
        }
        
        // Статус полноэкранного режима
        if (message == 'get-fullscreen-status') {
            chrome.windows.getCurrent(function (browser) {
                const event = {'type': 'got-fullscreen-status', 'state': browser.state};
                port.postMessage(JSON.stringify(event));
            });
            return;
        }
        
        // Проверка второго монитора
        if (message == 'is-has-second-monitor') {
            try {
                chrome.system.display.getInfo(function (displayInfosResult) {
                    const has = displayInfosResult.length >= 2;
                    port.postMessage(has ? 'second-monitor-exist' : 'second-monitor-not-exist');
                });
            } catch (err) {
                port.postMessage('second-monitor-not-exist');
            }
            return;
        }
        
        // Обработка JSON сообщений
        if (!IsJsonString(message)) return;
        
        const data = JSON.parse(message);
        
        // Работа с cookies
        if (data.type == 'get-cookie') {
            handleGetCookie(data, port);
            return;
        }
        
        if (data.type == 'clear-cookie') {
            handleClearCookie(data, port);
            return;
        }
        
        if (data.type == 'close-tab') {
            handleCloseTab(data);
            return;
        }
        
        if (data.type == 'do-program-query') {
            handleProgramQuery(data, port);
            return;
        }
    });
});

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ОБРАБОТКИ СООБЩЕНИЙ
// ============================================================================

function onAccessApproved(sourceId, opts, port) {
    if (!sourceId || !sourceId.length) {
        return port.postMessage('PermissionDeniedError');
    }
    port.postMessage({
        sourceId: sourceId,
        canRequestAudioTrack: !!opts.canRequestAudioTrack
    });
}

function checkOESEnabled(port, examMode) {
    chrome.tabs.query({}, function(tabs) {
        let isFound = false;
        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            if (!tab.url.startsWith('https://')) continue;
            
            try {
                const host = new URL(tab.url).host;
                const isOESDomain = host.endsWith('.oes.kz') || 
                                   host.endsWith('.myoes.ru') || 
                                   host.endsWith('eqyzmet.gov.kz') || 
                                   host.endsWith('daryn.online') || 
                                   host.endsWith('enbek.kz') || 
                                   host.endsWith('uchet.kz') || 
                                   host.endsWith('crocos.kz') || 
                                   host.endsWith('astanait.edu.kz') || 
                                   host.endsWith('icert.kz');
                
                if (!isOESDomain) continue;
                
                if (examMode && !tab.url.includes('/proctoring')) continue;
                
                port.postMessage(examMode ? 'yes-oes-enabled-exam' : 'yes-oes-enabled');
                isFound = true;
                return;
            } catch (e) {
                console.error('Error checking tab:', e);
            }
        }
        
        if (!isFound) {
            port.postMessage(examMode ? 'no-oes-disabled-exam' : 'no-oes-disabled');
        }
    });
}

function closeNonOESTabs() {
    chrome.tabs.query({}, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            try {
                const host = new URL(tab.url).host;
                const isOESDomain = tab.url.startsWith('https://') && (
                    host.endsWith('.oes.kz') || 
                    host.endsWith('.myoes.ru') || 
                    host.endsWith('eqyzmet.gov.kz') || 
                    host.endsWith('daryn.online') || 
                    host.endsWith('uchet.kz') || 
                    host.endsWith('crocos.kz') || 
                    host.endsWith('astanait.edu.kz') || 
                    host.endsWith('icert.kz')
                );
                
                if (!isOESDomain) {
                    chrome.tabs.remove(tab.id);
                }
            } catch (e) {
                console.error('Error closing tab:', e);
            }
        }
    });
}

function handleStartExit(port) {
    console.log('[OES Extension] On start exit');
    chrome.tabs.query({}, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            try {
                const host = new URL(tab.url).host;
                console.log('[OES Extension] Got tab to send exit', tab.id, tab.url, host);
                
                if (!tab.url.startsWith('https://')) continue;
                
                const isOESDomain = host.endsWith('.oes.kz') || 
                                   host.endsWith('.myoes.ru') || 
                                   host.endsWith('eqyzmet.gov.kz') || 
                                   host.endsWith('daryn.online') || 
                                   host.endsWith('enbek.kz') || 
                                   host.endsWith('uchet.kz') || 
                                   host.endsWith('crocos.kz') || 
                                   host.endsWith('astanait.edu.kz') || 
                                   host.endsWith('icert.kz');
                
                if (!isOESDomain) continue;
                
                console.log('[OES Extension] Trying to send exit', tab.id, tab.url, host);
                const port2 = chrome.tabs.connect(tab.id, {name: "channel-exit"});
                port2.postMessage("do-exit");
                console.log('send do exit');
            } catch (e) {
                console.error('Error sending exit:', e);
            }
        }
    });
}

function getActiveTab(port, v2Mode) {
    chrome.windows.getCurrent(function (browser) {
        if (browser.focused == false) {
            if (v2Mode && inFocus) {
                // В режиме v2, если inFocus = true, не отправляем сообщение
            } else {
                const event = {'type': 'window-no-focused'};
                port.postMessage(JSON.stringify(event));
            }
        } else {
            chrome.tabs.query({
                active: true,
                lastFocusedWindow: true
            }, function(tabs) {
                if (tabs.length > 0) {
                    const tab = tabs[0];
                    if (tab) {
                        const event = {'type': 'got-active-tab', 'content': tab.url};
                        port.postMessage(JSON.stringify(event));
                    }
                }
            });
        }
    });
}

function handleGetCookie(data, port) {
    const domain = data.domain;
    const packetId = data.packetId;
    const answer = {
        'type': 'answer',
        'packetId': packetId,
        'domain': domain,
        'cookies': []
    };
    
    chrome.cookies.getAll({'domain': domain}, function(cookies) {
        answer['cookies'] = cookies;
        port.postMessage(JSON.stringify(answer));
    });
}

function handleClearCookie(data, port) {
    const domain = data.domain;
    const packetId = data.packetId;
    const answer = {
        'type': 'answer',
        'packetId': packetId,
        'domain': domain
    };
    
    chrome.cookies.getAll({'domain': domain}, function(cookies) {
        for (let i = 0; i < cookies.length; i++) {
            try {
                chrome.cookies.remove({
                    url: "https://" + cookies[i].domain + cookies[i].path,
                    name: cookies[i].name
                });
            } catch (e) {}
            try {
                chrome.cookies.remove({
                    url: "http://" + cookies[i].domain + cookies[i].path,
                    name: cookies[i].name
                });
            } catch (e) {}
        }
        console.log('Deleting cookies');
        port.postMessage(JSON.stringify(answer));
    });
}

function handleCloseTab(data) {
    const domain = data.domain;
    chrome.tabs.query({}, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            try {
                const host = new URL(tab.url).host;
                if (host.toLowerCase() === domain.toLowerCase()) {
                    chrome.tabs.remove(tab.id);
                }
            } catch (e) {
                console.error('Error closing tab:', e);
            }
        }
    });
}

function handleProgramQuery(data, port) {
    console.log('do-program-query');
    const packetId = data.packetId;
    const answer = {
        'type': 'answer',
        'packetId': packetId
    };
    
    fetch('http://127.0.0.1:8443/rest/' + data.method)
        .then(response => response.json())
        .then(responseData => {
            answer.gotData = responseData;
            port.postMessage(JSON.stringify(answer));
        })
        .catch(error => {
            console.error("Error making HTTP request:", error);
            answer.error = error.message;
            port.postMessage(JSON.stringify(answer));
        });
}

console.log('[OES Extension] Service worker initialized successfully');