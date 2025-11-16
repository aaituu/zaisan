// popup.js - Исправленная версия

let currentTabId = null;
// В строке 4
let serverUrl = window.location.hostname === 'localhost'
  ? 'http://localhost:8080'
  : 'https://unemployed-immorally-salma.ngrok-free.dev';

// DOM элементы
const startBtn = document.getElementById('startBtn');
const btnText = document.getElementById('btnText');
const urlDisplay = document.getElementById('urlDisplay');
const viewerUrl = document.getElementById('viewerUrl');

// Инициализация
init();

async function init() {
    
    // Получаем текущую вкладку
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
        currentTabId = tabs[0].id;
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
    
    try {
        startBtn.disabled = true;
        btnText.innerHTML = '<span class="loading"></span>.';
        
        // Отправляем команду в service worker
        chrome.runtime.sendMessage({ 
            type: 'start-parallel-stream',
            tabId: currentTabId 
        }, (response) => {
            if (chrome.runtime.lastError) {
               
                startBtn.disabled = false;
                btnText.textContent = '+';
                return;
            }
            
            if (response && response.success) {
                updateUI(true);
            } else {
                startBtn.disabled = false;
                btnText.textContent = '+';
            }
        });
        
    } catch (err) {

        startBtn.disabled = false;
        btnText.textContent = '+';
    }
}

// Остановка трансляции
async function stopStreaming() {
    
    try {
        startBtn.disabled = true;
        btnText.innerHTML = '<span class="loading"></span>-';
        
        chrome.runtime.sendMessage({ type: 'stop-parallel-stream' }, (response) => {
            if (response && response.success) {
                
                updateUI(false);
            }
        });
        
    } catch (err) {

        startBtn.disabled = false;
    }
}

// Обновление UI
function updateUI(isStreaming) {
    if (isStreaming) {
    
        btnText.textContent = '-';
        startBtn.classList.add('streaming');
        urlDisplay.style.display = 'block';
        viewerUrl.textContent = serverUrl;
    } else {
        btnText.textContent = '+';
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
        
        serverStatus.textContent = '✓';
        serverStatus.style.color = '#2ed573';
        
    } catch (err) {
        serverStatus.textContent = 'x';
        serverStatus.style.color = '#ff4757';
    }
}

// Слушаем обновления от service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    if (message.type === 'stream-status-changed') {
        updateUI(message.isStreaming);
    }
    
    if (message.type === 'viewer-count') {
        viewerCount.textContent = message.count || 0;
    }
});



// Периодическая проверка
setInterval(checkServerStatus, 10000);