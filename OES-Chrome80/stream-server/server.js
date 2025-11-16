// server.js - Исправленный сервер с улучшенной обработкой WebRTC
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/signal' });

let broadcaster = null;
const viewers = new Map(); // Используем Map для tracking viewers

// Статичная страница для просмотра
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OES Stream Viewer</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .container {
            width: 100%;
            max-width: 1920px;
            padding: 20px;
        }
        video { 
            width: 100%; 
            height: auto;
            background: #000;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        .status { 
            position: fixed; 
            top: 20px; 
            left: 50%;
            transform: translateX(-50%);
            color: #fff; 
            background: rgba(0,0,0,0.8); 
            padding: 15px 30px; 
            border-radius: 50px;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 1000;
        }
        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #ff4757;
            animation: pulse 2s infinite;
        }
        .status.connected .status-dot {
            background: #2ed573;
        }
        .status.streaming .status-dot {
            animation: blink 1s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
        }
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
        .waiting {
            text-align: center;
            color: white;
            padding: 40px;
            font-size: 24px;
        }
        .info {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="status" id="status">
            <div class="status-dot"></div>
            <span class="text">Подключение...</span>
        </div>
        <div class="waiting" id="waiting">
            <h2>Ожидание трансляции...</h2>
            <p style="margin-top: 10px; font-size: 16px; opacity: 0.8;">
                Начните трансляцию в расширении OES
            </p>
        </div>
        <video id="video" autoplay playsinline style="display: none;"></video>
        <div class="info" id="info">
            Viewers: <span id="viewerCount">0</span>
        </div>
    </div>
    
    <script>
        const video = document.getElementById('video');
        const status = document.getElementById('status');
        const statusText = status.querySelector('.text');
        const waiting = document.getElementById('waiting');
        const viewerCount = document.getElementById('viewerCount');
        
        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };
        
        let pc = null;
        let ws = null;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        
        function updateStatus(state, text) {
            status.className = 'status ' + state;
            statusText.textContent = text;
        }
        
        function connect() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = protocol + '//' + window.location.host + '/signal';
            
            console.log('Connecting to:', wsUrl);
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log('✓ Connected to signaling server');
                updateStatus('connected', 'Подключено');
                reconnectAttempts = 0;
                ws.send(JSON.stringify({ type: 'viewer-join' }));
                setupPeerConnection();
            };
            
            ws.onmessage = async (e) => {
                try {
                    const data = JSON.parse(e.data);
                    console.log('Received:', data.type);
                    
                    if (data.type === 'viewer-count') {
                        viewerCount.textContent = data.count;
                    }
                    
                    if (data.sdp) {
                        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                        
                        if (data.sdp.type === 'offer') {
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);
                            ws.send(JSON.stringify({ sdp: answer }));
                            console.log('✓ Sent answer');
                        }
                    }
                    
                    if (data.candidate) {
                        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                        console.log('✓ Added ICE candidate');
                    }
                } catch (err) {
                    console.error('Message handling error:', err);
                }
            };
            
            ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                updateStatus('', 'Ошибка подключения');
            };
            
            ws.onclose = () => {
                console.log('WebSocket closed');
                updateStatus('', 'Отключено');
                
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    console.log(\`Reconnecting... (\${reconnectAttempts}/\${maxReconnectAttempts})\`);
                    setTimeout(connect, 2000);
                }
            };
        }
        
        function setupPeerConnection() {
            pc = new RTCPeerConnection(config);
            
            pc.ontrack = (e) => {
                console.log('✓ Received track:', e.track.kind);
                video.srcObject = e.streams[0];
                video.style.display = 'block';
                waiting.style.display = 'none';
                updateStatus('streaming', 'Трансляция');
            };
            
            pc.onicecandidate = (e) => {
                if (e.candidate && ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ candidate: e.candidate }));
                    console.log('✓ Sent ICE candidate');
                }
            };
            
            pc.onconnectionstatechange = () => {
                console.log('Connection state:', pc.connectionState);
                
                if (pc.connectionState === 'connected') {
                    updateStatus('streaming', 'Трансляция активна');
                } else if (pc.connectionState === 'failed') {
                    updateStatus('', 'Соединение потеряно');
                    video.style.display = 'none';
                    waiting.style.display = 'block';
                }
            };
            
            pc.oniceconnectionstatechange = () => {
                console.log('ICE state:', pc.iceConnectionState);
            };
        }
        
        // Начинаем подключение
        connect();
    </script>
</body>
</html>
    `);
});

wss.on('connection', (ws) => {
    console.log('✓ New WebSocket connection');
    
    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            console.error('Invalid JSON:', message);
            return;
        }
        
        console.log('Received:', data.type);
        
        if (data.type === 'broadcaster') {
            broadcaster = ws;
            console.log('✓ Broadcaster connected');
            broadcastViewerCount();
            return;
        }
        
        if (data.type === 'viewer-join') {
            const viewerId = Date.now() + Math.random();
            viewers.set(ws, viewerId);
            
            // Уведомляем broadcaster о новом viewer
            if (broadcaster && broadcaster.readyState === WebSocket.OPEN) {
                broadcaster.send(JSON.stringify({ type: 'viewer-join' }));
                console.log('Notified broadcaster about new viewer');
            }
            
            broadcastViewerCount();
            return;
        }
        
        // Пересылаем сигналы между broadcaster и viewers
        if (ws === broadcaster) {
            // От broadcaster ко всем viewers
            viewers.forEach((viewerId, viewer) => {
                if (viewer.readyState === WebSocket.OPEN) {
                    viewer.send(message);
                }
            });
        } else {
            // От viewer к broadcaster
            if (broadcaster && broadcaster.readyState === WebSocket.OPEN) {
                broadcaster.send(message);
                console.log('Forwarded from viewer to broadcaster');
            }
        }
    });
    
    ws.on('close', () => {
        if (ws === broadcaster) {
            broadcaster = null;
            console.log('✗ Broadcaster disconnected');
            
            // Уведомляем всех viewers
            viewers.forEach((viewerId, viewer) => {
                if (viewer.readyState === WebSocket.OPEN) {
                    viewer.send(JSON.stringify({ 
                        type: 'broadcaster-left' 
                    }));
                }
            });
        } else if (viewers.has(ws)) {
            const viewerId = viewers.get(ws);
            viewers.delete(ws);
        }
        
        broadcastViewerCount();
    });
    
    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

function broadcastViewerCount() {
    const count = viewers.size;
    const message = JSON.stringify({ 
        type: 'viewer-count', 
        count: count 
    });
    
    // Отправляем broadcaster
    if (broadcaster && broadcaster.readyState === WebSocket.OPEN) {
        broadcaster.send(message);
    }
    
    // Отправляем всем viewers
    viewers.forEach((viewerId, viewer) => {
        if (viewer.readyState === WebSocket.OPEN) {
            viewer.send(message);
        }
    });
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log('════════════════════════════════════════');
    console.log('  OES Stream Server');
    console.log('════════════════════════════════════════');
    console.log('  Network: Run with ngrok for external access');
    console.log('  Command: ngrok http 8080');
    console.log('════════════════════════════════════════');
});