// server.js - С детальным логированием для отладки
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/signal" });
// После строки const wss = new WebSocket.Server({ server, path: "/signal" });

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

let broadcaster = null;
const viewers = new Map();


// Статичная страница для просмотра
app.get("/", (req, res) => {

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
            min-height: 100vh; /* <-- УБЕДИТЕСЬ, ЧТО ЭТО ЕСТЬ */
            display: flex; /* <-- ДОБАВЬТЕ ЭТО */
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        #video {
            /* Если видео не появилось, это правило, скорее всего, игнорируется. */
            width: 100% !important;        
            height: auto !important;       
            max-width: 100%;
            display: block !important;     
            background-color: black;      
            object-fit: contain;
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
            background: #ffa502;
        }
        .status.streaming .status-dot {
            background: #2ed573;
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
        .debug-log {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0,0,0,0.9);
            color: #0f0;
            padding: 10px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            max-width: 400px;
            max-height: 200px;
            overflow-y: auto;
        }
        .debug-log div {
            margin: 2px 0;
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
        <video id="video" autoplay playsinline muted></video>
  
        
        <div class="info" id="info">
            Viewers: <span id="viewerCount">0</span>
        </div>
        <div class="debug-log" id="debugLog"></div>
    </div>
    
    <script>
        const video = document.getElementById('video');
        const status = document.getElementById('status');
        const statusText = status.querySelector('.text');
        const waiting = document.getElementById('waiting');
        const viewerCount = document.getElementById('viewerCount');
        const debugLog = document.getElementById('debugLog');
        
        function log(msg) {
            const div = document.createElement('div');
            div.textContent = new Date().toLocaleTimeString() + ' ' + msg;
            debugLog.appendChild(div);
            debugLog.scrollTop = debugLog.scrollHeight;
        
        }
        
        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        
        let pc = null;
        let ws = null;
        
        function updateStatus(state, text) {
            status.className = 'status ' + state;
            statusText.textContent = text;
        }
        
        function connect() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = protocol + '//' + window.location.host + '/signal';
            
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                updateStatus('connected', 'Подключено');
                ws.send(JSON.stringify({ type: 'viewer-join' }));
                setupPeerConnection();
            };
            
            ws.onmessage = async (e) => {
                try {
                    // Проверяем тип данных
                    let rawData = e.data;
                    
                    // Если Blob, конвертируем в текст
                    if (rawData instanceof Blob) {
                        rawData = await rawData.text();
                    }
                    
                    const data = JSON.parse(rawData);
                    
                    if (data.type === 'viewer-count') {
                        viewerCount.textContent = data.count;
                    }
                    
                    // В Viewer JavaScript (внутри ws.onmessage)
                    if (data.sdp) {
                        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                        
                        // Проверка треков (предыдущее исправление)
                       

                        if (data.sdp.type === 'offer') {
                            
                            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

                            // 1. Создаем Answer
                            const answer = await pc.createAnswer();

                            // 2. Модификация SDP для установки VP8 ПРИОРИТЕТОМ
                            let sdp = answer.sdp;
                            let vp8Payload = null;

                            // --- Шаг A1: Ищем VP8 ID с помощью строковых методов (без сложной regex) ---
                            sdp.split('\\r\\n').forEach(line => {
                                // Ищем строку, содержащую a=rtpmap: И VP8
                                if (line.includes('a=rtpmap:') && line.includes('VP8')) {
                                    // Пример строки: a=rtpmap:97 VP8/90000
                                    const parts = line.split(':');
                                    if (parts.length > 1) {
                                        // ID находится в '97 VP8/90000', берем '97'
                                        vp8Payload = parts[1].split(' ')[0];
                                    }
                                }
                            });
                            // ----------------------------------------------------------------------
                            
                            if (vp8Payload) {
                                // Шаг B: Переставляем VP8 на первое место в m=video строке. 
                                // Здесь простая regex: /m=video (\d+) RTP\/SAVPF (.*)/
                                // Она корректна и не должна вызывать ошибки, так как находится в стандартном контексте.
                                sdp = sdp.replace(/m=video (\\d+) RTP\\/SAVPF (.*)/, (m, port, codecs) => {
                                    // Удаляем старый ID VP8 из списка
                                    const codecList = codecs.split(' ').filter(c => c !== vp8Payload);
                                    
                                    // Ставим VP8 на первое место
                                    const newCodecs = vp8Payload + ' ' + codecList.join(' ');
                                    
                                    // Формируем новую m-строку
                                    return 'm=video ' + port + ' RTP/SAVPF ' + newCodecs;
                                });
                                answer.sdp = sdp;
                            } 
                            
                            // 3. Устанавливаем и отправляем Answer
                            await pc.setLocalDescription(answer);
                            ws.send(JSON.stringify({ sdp: answer }));
                        }
                    }
                    
                    if (data.candidate) {
                        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                    }
                } 
            };
            
            ws.onerror = (err) => {
            };
            
            ws.onclose = () => {
                updateStatus('', 'Отключено');
            };
        }
        
        function setupPeerConnection() {
            pc = new RTCPeerConnection(config);
    
            pc.ontrack = (e) => {
                
                video.srcObject = e.streams[0];
                video.style.display = 'block';
                waiting.style.display = 'none';
                updateStatus('streaming', '🎥 Трансляция');
            };
            
            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    ws.send(JSON.stringify({ candidate: e.candidate }));
                }
            };
            
            pc.onconnectionstatechange = () => {

                // Внутри pc.oniceconnectionstatechange
                                
                if (pc.connectionState === 'connected') {
                    updateStatus('streaming', '✓ Трансляция активна');
                } else if (pc.connectionState === 'failed') {
                    updateStatus('', 'Соединение потеряно');
                    video.style.display = 'none';
                    waiting.style.display = 'block';
                }
            };
            
            pc.oniceconnectionstatechange = () => {
            };
        }
        
        connect();
    </script>
</body>
</html>
    `);
});

wss.on("connection", (ws) => {
  const clientId = Date.now() + Math.random();

  ws.on("message", (message) => {
    let data;
    try {
      // Проверяем тип данных
      let rawMessage = message;

      // Если это Buffer, конвертируем в строку
      if (Buffer.isBuffer(rawMessage)) {
        rawMessage = rawMessage.toString("utf8");
      }

      // Если это Blob или ArrayBuffer
      if (typeof rawMessage === "object" && !(typeof rawMessage === "string")) {
        
        return;
      }

      data = JSON.parse(rawMessage);
    } catch (e) {
      return;
    }


    // Broadcaster
    if (data.type === "broadcaster") {
      broadcaster = ws;

      broadcastViewerCount();
      return;
    }

    // Viewer join
    if (data.type === "viewer-join") {
      viewers.set(ws, clientId);


      // Уведомляем broadcaster
      if (broadcaster && broadcaster.readyState === WebSocket.OPEN) {
        broadcaster.send(JSON.stringify({ type: "viewer-join" }));
      } 

      broadcastViewerCount();
      return;
    }

    // SDP/ICE от broadcaster к viewers
    if (ws === broadcaster) {
      const msgType = data.sdp
        ? `SDP(${data.sdp.type})`
        : data.candidate
        ? "ICE"
        : "unknown";

      let sent = 0;
      viewers.forEach((viewerId, viewer) => {
        if (viewer.readyState === WebSocket.OPEN) {
          viewer.send(message);
          sent++;
        }
      });
    }
    // SDP/ICE от viewer к broadcaster
    else {
      const msgType = data.sdp
        ? `SDP(${data.sdp.type})`
        : data.candidate
        ? "ICE"
        : "unknown";

      if (broadcaster && broadcaster.readyState === WebSocket.OPEN) {
        broadcaster.send(message);
      } 
    }
  });

  ws.on("close", () => {

    if (ws === broadcaster) {
      broadcaster = null;

      // Уведомляем viewers
      viewers.forEach((viewerId, viewer) => {
        if (viewer.readyState === WebSocket.OPEN) {
          viewer.send(
            JSON.stringify({
              type: "broadcaster-left",
            })
          );
        }
      });
    } else if (viewers.has(ws)) {
      viewers.delete(ws);
      
    }

    broadcastViewerCount();
  });

  ws.on("error", (err) => {
  });
});

function broadcastViewerCount() {
  const count = viewers.size;
  const message = JSON.stringify({
    type: "viewer-count",
    count: count,
  });


  // Broadcaster
  if (broadcaster && broadcaster.readyState === WebSocket.OPEN) {
    broadcaster.send(message);
  }

  // Viewers
  let sent = 0;
  viewers.forEach((viewerId, viewer) => {
    if (viewer.readyState === WebSocket.OPEN) {
      viewer.send(message);
      sent++;
    }
  });
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {

});
