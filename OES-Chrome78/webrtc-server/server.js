// server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });

let broadcaster = null;
let viewer = null;

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        // Если это оффер от транслятора
        if (data.offer) {
            broadcaster = ws;
            if (viewer) {
                viewer.send(JSON.stringify({ offer: data.offer }));
            }
        }

        // Если это ответ от зрителя
        if (data.answer) {
            if (broadcaster) {
                broadcaster.send(JSON.stringify({ answer: data.answer }));
            }
        }

        // ICE кандидаты
        if (data.ice) {
            if (ws === broadcaster && viewer) {
                viewer.send(JSON.stringify({ ice: data.ice }));
            } else if (ws === viewer && broadcaster) {
                broadcaster.send(JSON.stringify({ ice: data.ice }));
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (ws === broadcaster) broadcaster = null;
        if (ws === viewer) viewer = null;
    });

    // Если первый подключившийся — зритель
    if (!broadcaster) {
        broadcaster = ws;
    } else if (!viewer) {
        viewer = ws;
    }
});

console.log('Signaling server running on ws://localhost:3000');
