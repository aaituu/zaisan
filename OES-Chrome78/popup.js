// popup.js

let localStream;
let pc; // RTCPeerConnection
const video = document.getElementById('localVideo');

// Сервер сигнализации (например WebSocket сервер)
const SIGNALING_SERVER = "ws://localhost:3000";
let ws;

// Инициализация WebSocket
function initWebSocket() {
    ws = new WebSocket(SIGNALING_SERVER);

    ws.onopen = () => console.log("Connected to signaling server");
    ws.onmessage = async (msg) => {
        const data = JSON.parse(msg.data);

        if (data.answer) {
            await pc.setRemoteDescription(data.answer);
        }
        if (data.ice) {
            try {
                await pc.addIceCandidate(data.ice);
            } catch (e) {
                console.error("Error adding ICE candidate", e);
            }
        }
    };
}

// Захват экрана
async function startCapture() {
    try {
        localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        video.srcObject = localStream;

        startWebRTC();
    } catch (err) {
        console.error("Error getting display media:", err);
    }
}

// Создание WebRTC соединения
function startWebRTC() {
    pc = new RTCPeerConnection();

    // Добавляем треки экрана
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    // ICE кандидаты -> на сервер
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            ws.send(JSON.stringify({ ice: event.candidate }));
        }
    };

    createOffer();
}

// Создание оффера
async function createOffer() {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({ offer }));
}

// Кнопка старт
document.getElementById('startBtn').addEventListener('click', () => {
    initWebSocket();
    startCapture();
});
