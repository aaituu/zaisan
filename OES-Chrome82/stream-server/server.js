// server.js - С детальным логированием для отладки
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/signal" });

let broadcaster = null;
const viewers = new Map();

console.log("═══════════════════════════════════════");
console.log("  🎥 OES Stream Server Starting...");
console.log("═══════════════════════════════════════");

// Статичная страница для просмотра
app.get("/", (req, res) => {
  console.log("📄 Viewer page requested from:", req.ip);
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
        // <script>
        // navigator.mediaDevices.getDisplayMedia({ video: true })
        // .then(stream => {
        //     const video = document.getElementById('video'); // видео элемент
        //     video.srcObject = stream; // подключаем поток
        //     video.play(); // запускаем воспроизведение
        // })
        // .catch(err => console.error('Ошибка доступа к экрану:', err));
        // </script>
        
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
            console.log(msg);
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
            log('Status: ' + text);
        }
        
        function connect() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = protocol + '//' + window.location.host + '/signal';
            
            log('Connecting to: ' + wsUrl);
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                log('✓ WebSocket connected');
                updateStatus('connected', 'Подключено');
                ws.send(JSON.stringify({ type: 'viewer-join' }));
                log('Sent viewer-join');
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
                    log('← Received: ' + data.type);
                    
                    if (data.type === 'viewer-count') {
                        viewerCount.textContent = data.count;
                    }
                    
                    // В Viewer JavaScript (внутри ws.onmessage)
                    if (data.sdp) {
                        log('Got SDP: ' + data.sdp.type);
                        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                        
                        // Проверка треков (предыдущее исправление)
                        console.log('[Viewer] 📡 Remote tracks received: ' + pc.getReceivers().length);

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
                                console.log('Forced VP8 codec priority in SDP Answer:', vp8Payload);
                            } else {
                                console.warn('VP8 payload not found in SDP. Sending unpatched Answer.');
                            }
                            
                            // 3. Устанавливаем и отправляем Answer
                            await pc.setLocalDescription(answer);
                            ws.send(JSON.stringify({ sdp: answer }));
                            log('→ Sent answer');
                        }
                    }
                    
                    if (data.candidate) {
                        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                        log('✓ Added ICE candidate');
                    }
                } catch (err) {
                    log('❌ Error: ' + err.message);
                    console.error('Message handling error:', err);
                }
            };
            
            ws.onerror = (err) => {
                log('❌ WS error');
                console.error('WebSocket error:', err);
            };
            
            ws.onclose = () => {
                log('WebSocket closed');
                updateStatus('', 'Отключено');
            };
        }
        
        function setupPeerConnection() {
            pc = new RTCPeerConnection(config);
            log('PeerConnection created');
    
            pc.ontrack = (e) => {
                
                log('✓✓✓ Received track: ' + e.track.kind);
                video.srcObject = e.streams[0];
                video.style.display = 'block';
                waiting.style.display = 'none';
                updateStatus('streaming', '🎥 Трансляция');
            };
            
            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    ws.send(JSON.stringify({ candidate: e.candidate }));
                    log('→ Sent ICE candidate');
                }
            };
            
            pc.onconnectionstatechange = () => {
                log('Connection: ' + pc.connectionState);

                // Внутри pc.oniceconnectionstatechange
                log('ICE: ' + pc.iceConnectionState);
                                
                if (pc.connectionState === 'connected') {
                    updateStatus('streaming', '✓ Трансляция активна');
                } else if (pc.connectionState === 'failed') {
                    updateStatus('', 'Соединение потеряно');
                    video.style.display = 'none';
                    waiting.style.display = 'block';
                }
            };
            
            pc.oniceconnectionstatechange = () => {
                log('ICE: ' + pc.iceConnectionState);
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
  console.log(`\n✅ [${clientId}] New WebSocket connection`);

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
        console.error(
          `❌ [${clientId}] Received non-string message:`,
          typeof rawMessage
        );
        return;
      }

      data = JSON.parse(rawMessage);
    } catch (e) {
      console.error(
        `❌ [${clientId}] Invalid JSON:`,
        message.toString().substring(0, 100),
        "Error:",
        e.message
      );
      return;
    }

    console.log(`📨 [${clientId}] Received:`, data.type);

    // Broadcaster
    if (data.type === "broadcaster") {
      broadcaster = ws;
      console.log(`🎥 [${clientId}] BROADCASTER CONNECTED`);
      console.log(`   👥 Current viewers: ${viewers.size}`);
      broadcastViewerCount();
      return;
    }

    // Viewer join
    if (data.type === "viewer-join") {
      viewers.set(ws, clientId);
      console.log(`👤 [${clientId}] VIEWER JOINED`);
      console.log(`   📊 Total viewers: ${viewers.size}`);

      // Уведомляем broadcaster
      if (broadcaster && broadcaster.readyState === WebSocket.OPEN) {
        broadcaster.send(JSON.stringify({ type: "viewer-join" }));
        console.log(`   ✉️  Notified broadcaster about new viewer`);
      } else {
        console.log(`   ⚠️  No broadcaster available`);
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
      console.log(`📤 [Broadcaster] → Viewers: ${msgType}`);

      let sent = 0;
      viewers.forEach((viewerId, viewer) => {
        if (viewer.readyState === WebSocket.OPEN) {
          viewer.send(message);
          sent++;
        }
      });
      console.log(`   ✓ Sent to ${sent} viewers`);
    }
    // SDP/ICE от viewer к broadcaster
    else {
      const msgType = data.sdp
        ? `SDP(${data.sdp.type})`
        : data.candidate
        ? "ICE"
        : "unknown";
      console.log(`📤 [Viewer ${clientId}] → Broadcaster: ${msgType}`);

      if (broadcaster && broadcaster.readyState === WebSocket.OPEN) {
        broadcaster.send(message);
        console.log(`   ✓ Forwarded to broadcaster`);
      } else {
        console.log(`   ❌ No broadcaster to forward to`);
      }
    }
  });

  ws.on("close", () => {
    console.log(`\n❌ [${clientId}] Connection closed`);

    if (ws === broadcaster) {
      broadcaster = null;
      console.log(`   🎥 Broadcaster disconnected`);

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
      console.log(`   👤 Viewer left (${viewers.size} remaining)`);
    }

    broadcastViewerCount();
  });

  ws.on("error", (err) => {
    console.error(`❌ [${clientId}] WebSocket error:`, err.message);
  });
});

function broadcastViewerCount() {
  const count = viewers.size;
  const message = JSON.stringify({
    type: "viewer-count",
    count: count,
  });

  console.log(`\n📊 Broadcasting viewer count: ${count}`);

  // Broadcaster
  if (broadcaster && broadcaster.readyState === WebSocket.OPEN) {
    broadcaster.send(message);
    console.log(`   ✓ Sent to broadcaster`);
  }

  // Viewers
  let sent = 0;
  viewers.forEach((viewerId, viewer) => {
    if (viewer.readyState === WebSocket.OPEN) {
      viewer.send(message);
      sent++;
    }
  });
  console.log(`   ✓ Sent to ${sent} viewers\n`);
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log("═══════════════════════════════════════");
  console.log(`  ✅ Server running on port ${PORT}`);
  console.log(`  🌐 Local: http://localhost:${PORT}`);
  console.log(`  🌐 Network: Use ngrok for external`);
  console.log(`  📡 WebSocket: ws://localhost:${PORT}/signal`);
  console.log("═══════════════════════════════════════\n");
  console.log("Waiting for connections...\n");
});
