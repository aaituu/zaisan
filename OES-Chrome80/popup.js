// popup.js
console.log('[Popup] Loaded');

let isStreaming = false;
let currentTabId = null;
let serverUrl = 'http://localhost:8080';

// DOM элементы
const startBtn = document.getElementById('startBtn');
const openViewerBtn = document.getElementById('openViewerBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const statusDetails = document.getElementById('statusDetails');
const serverStatus = document.getElementById('serverStatus');
const viewerCount = document.getElementById('viewerCount');
const btnText = document.getElementById('btnText');
const urlDisplay = document.getElementById('urlDisplay');
const viewerUrl = document.getElementById('viewerUrl');

// Инициализация
init();

async function init() {
    console.log('[Popup] Initializing...');
    
    // Получаем текущую вкладку
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
        currentTabId = tabs[0].id;
        console.log('[Popup] Current tab:', currentTabId);
    }
    
    // Проверяем статус трансляции
    checkStreamingStatus();
    
    // Проверяем доступность сервера
    checkServerStatus();
    
    // Слушаем сообщения от content script
    chrome.runtime.onMessage.addListener(handleMessage);
}

// Обработчики кнопок
startBtn.addEventListener('click', async () => {
    if (isStreaming) {
        await stopStreaming();
    } else {
        await startStreaming();
    }
});

openViewerBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: serverUrl });
});

// Запуск трансляции
async function startStreaming() {
    console.log('[Popup] Starting streaming...');
    
    try {
        startBtn.disabled = true;
        btnText.innerHTML = '<span class="loading"></span> Запуск...';
        
        // Отправляем команду в content script
        if (!currentTabId) {
            throw new Error('Нет активной вкладки');
        }
        
        // Проверяем, что это страница с OES
        const tab = await chrome.tabs.get(currentTabId);
        console.log('[Popup] Current URL:', tab.url);
        
        // Отправляем сообщение для запуска
        await chrome.tabs.sendMessage(currentTabId, {
            type: 'parallel-stream-start'
        });
        
        // Ждем подтверждения
        setTimeout(() => {
            isStreaming = true;
            updateUI();
            showNotification('Трансляция запущена!', 'success');
        }, 2000);
        
    } catch (err) {
        console.error('[Popup] Start error:', err);
        showNotification('Ошибка: ' + err.message, 'error');
        startBtn.disabled = false;
        btnText.textContent = '▶️ Начать трансляцию';
    }
}

// Остановка трансляции
async function stopStreaming() {
    console.log('[Popup] Stopping streaming...');
    
    try {
        startBtn.disabled = true;
        btnText.innerHTML = '<span class="loading"></span> Остановка...';
        
        if (currentTabId) {
            await chrome.tabs.sendMessage(currentTabId, {
                type: 'parallel-stream-stop'
            });
        }
        
        setTimeout(() => {
            isStreaming = false;
            updateUI();
            showNotification('Трансляция остановлена', 'info');
        }, 1000);
        
    } catch (err) {
        console.error('[Popup] Stop error:', err);
        startBtn.disabled = false;
    }
}

// Обновление UI
function updateUI() {
    if (isStreaming) {
        statusDot.classList.add('active');
        statusText.textContent = 'Трансляция активна';
        statusDetails.textContent = 'Экран транслируется в реальном времени';
        btnText.textContent = '⏹️ Остановить трансляцию';
        startBtn.classList.add('streaming');
        openViewerBtn.disabled = false;
        urlDisplay.style.display = 'block';
        viewerUrl.textContent = serverUrl;
    } else {
        statusDot.classList.remove('active');
        statusText.textContent = 'Не активно';
        statusDetails.textContent = 'Нажмите "Начать трансляцию" для запуска';
        btnText.textContent = '▶️ Начать трансляцию';
        startBtn.classList.remove('streaming');
        openViewerBtn.disabled = true;
        urlDisplay.style.display = 'none';
    }
    startBtn.disabled = false;
}

// Проверка статуса сервера
async function checkServerStatus() {
    try {
        const response = await fetch(serverUrl, { 
            method: 'HEAD',
            mode: 'no-cors' // Игнорируем CORS для проверки доступности
        });
        
        serverStatus.textContent = 'Подключен ✓';
        serverStatus.style.color = '#2ed573';
        
    } catch (err) {
        serverStatus.textContent = 'Не доступен ✗';
        serverStatus.style.color = '#ff4757';
        console.warn('[Popup] Server not available:', err);
    }
}

// Проверка текущего статуса трансляции
async function checkStreamingStatus() {
    try {
        if (currentTabId) {
            const response = await chrome.tabs.sendMessage(currentTabId, {
                type: 'parallel-stream-get-status'
            });
            
            if (response && response.isStreaming) {
                isStreaming = true;
                updateUI();
            }
        }
    } catch (err) {
        // Content script еще не загружен или не отвечает
        console.log('[Popup] Cannot get status:', err.message);
    }
}

// Обработка сообщений
function handleMessage(message, sender, sendResponse) {
    console.log('[Popup] Message received:', message);
    
    if (message.type === 'parallel-stream-started') {
        isStreaming = true;
        updateUI();
        showNotification('Трансляция запущена!', 'success');
    }
    
    if (message.type === 'parallel-stream-stopped') {
        isStreaming = false;
        updateUI();
        showNotification('Трансляция остановлена', 'info');
    }
    
    if (message.type === 'parallel-stream-error') {
        showNotification('Ошибка: ' + message.error, 'error');
        isStreaming = false;
        updateUI();
    }
    
    if (message.type === 'viewer-count') {
        viewerCount.textContent = message.count || 0;
    }
}

// Уведомления
function showNotification(text, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = text;
    
    if (type === 'success') {
        notification.style.background = '#2ed573';
    } else if (type === 'error') {
        notification.style.background = '#ff4757';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Периодическая проверка сервера
setInterval(checkServerStatus, 10000);