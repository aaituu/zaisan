// popup.js - Исправленная версия
console.log('[Popup] Loaded');

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
    
    // Получаем статус из service worker
    chrome.runtime.sendMessage({ type: 'get-stream-status' }, (response) => {
        if (response && response.isStreaming) {
            updateUI(true);
        }
    });
    
    // Проверяем сервер
    checkServerStatus();
}

// Обработчики кнопок
startBtn.addEventListener('click', async () => {
    // Получаем текущий статус
    chrome.runtime.sendMessage({ type: 'get-stream-status' }, async (response) => {
        if (response && response.isStreaming) {
            await stopStreaming();
        } else {
            await startStreaming();
        }
    });
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
        
        // Отправляем команду в service worker
        chrome.runtime.sendMessage({ 
            type: 'start-parallel-stream',
            tabId: currentTabId 
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('[Popup] Error:', chrome.runtime.lastError);
                showNotification('Ошибка: ' + chrome.runtime.lastError.message, 'error');
                startBtn.disabled = false;
                btnText.textContent = '▶️ Начать трансляцию';
                return;
            }
            
            if (response && response.success) {
                console.log('[Popup] Stream started successfully');
                updateUI(true);
                showNotification('Трансляция запущена!', 'success');
            } else {
                showNotification('Не удалось запустить трансляцию', 'error');
                startBtn.disabled = false;
                btnText.textContent = '▶️ Начать трансляцию';
            }
        });
        
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
        
        chrome.runtime.sendMessage({ type: 'stop-parallel-stream' }, (response) => {
            if (response && response.success) {
                console.log('[Popup] Stream stopped');
                updateUI(false);
                showNotification('Трансляция остановлена', 'info');
            }
        });
        
    } catch (err) {
        console.error('[Popup] Stop error:', err);
        startBtn.disabled = false;
    }
}

// Обновление UI
function updateUI(isStreaming) {
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
            mode: 'no-cors'
        });
        
        serverStatus.textContent = 'Подключен ✓';
        serverStatus.style.color = '#2ed573';
        
    } catch (err) {
        serverStatus.textContent = 'Не доступен ✗';
        serverStatus.style.color = '#ff4757';
    }
}

// Слушаем обновления от service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Popup] Message:', message);
    
    if (message.type === 'stream-status-changed') {
        updateUI(message.isStreaming);
    }
    
    if (message.type === 'viewer-count') {
        viewerCount.textContent = message.count || 0;
    }
});

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

// Периодическая проверка
setInterval(checkServerStatus, 10000);