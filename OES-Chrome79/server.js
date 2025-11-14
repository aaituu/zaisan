// server.js - Запустить локально, затем ngrok http 8080
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/signal' });

let broadcaster = null;
const viewers = new Set();

// Статичная страница для просмотра
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stream Viewer</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        video { width: 100%; max-width: 1920px; height: auto; }
        .status { position: fixed; top: 20px; left: 20px; color: #fff; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="status" id="status">Connecting...</div>
    <video id="video" autoplay playsinline></video>
    <script>
        const video = document.getElementById('video');
        const status = document.getElementById('status');
        
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });
        
        const ws = new WebSocket(window.location.href.replace('http', 'ws') + 'signal');
        
        ws.onopen = () => {
            status.textContent = 'Connected';
            ws.send(JSON.stringify({ type: 'viewer-join' }));
        };
        
        ws.onmessage = async (e) => {
            const data = JSON.parse(e.data);
            
            if (data.sdp) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                if (data.sdp.type === 'offer') {
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    ws.send(JSON.stringify({ sdp: answer }));
                }
            }
            
            if (data.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        };
        
        pc.ontrack = (e) => {
            status.textContent = 'Streaming';
            video.srcObject = e.streams[0];
        };
        
        pc.onicecandidate = (e) => {
            if (e.candidate) {
                ws.send(JSON.stringify({ candidate: e.candidate }));
            }
        };
        
        pc.onconnectionstatechange = () => {
            status.textContent = pc.connectionState;
            if (pc.connectionState === 'connected') {
                setTimeout(() => status.style.display = 'none', 2000);
            }
        };
    </script>
</body>
</html>
    `);
});

wss.on('connection', (ws) => {
    console.log('New connection');
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'broadcaster') {
            broadcaster = ws;
            console.log('Broadcaster connected');
            return;
        }
        
        if (data.type === 'viewer-join') {
            viewers.add(ws);
            console.log('Viewer joined, total:', viewers.size);
            
            // Отправляем broadcaster о новом viewer
            if (broadcaster && broadcaster.readyState === WebSocket.OPEN) {
                broadcaster.send(JSON.stringify({ type: 'viewer-join' }));
            }
            return;
        }
        
        // Пересылаем сигналы между broadcaster и viewers
        if (ws === broadcaster) {
            viewers.forEach(viewer => {
                if (viewer.readyState === WebSocket.OPEN) {
                    viewer.send(message);
                }
            });
        } else {
            if (broadcaster && broadcaster.readyState === WebSocket.OPEN) {
                broadcaster.send(message);
            }
        }
    });
    
    ws.on('close', () => {
        if (ws === broadcaster) {
            broadcaster = null;
            console.log('Broadcaster disconnected');
        } else {
            viewers.delete(ws);
            console.log('Viewer left, total:', viewers.size);
        }
    });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Now run: ngrok http 8080');
});