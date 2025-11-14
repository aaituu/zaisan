// offscreen.js
console.log("[OES Offscreen] Loaded");

let localStream = null;
let pc = null;
const SIGNALING_SERVER = "ws://localhost:3000";
let ws = null;

// Слушаем команды от Service Worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[OES Offscreen] Got message:", message);
    
    if (message.type === 'start-parallel-stream') {
        startParallelStream(message.sourceId, message.canRequestAudioTrack);
        sendResponse({ success: true });
    }
    
    if (message.type === 'stop-parallel-stream') {
        stopParallelStream();
        sendResponse({ success: true });
    }
    
    return true;
});

async function startParallelStream(sourceId, hasAudio) {
    console.log("[OES Offscreen] Starting stream with sourceId:", sourceId);
    
    try {
        // Захватываем экран
        const constraints = {
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId
                }
            },
            audio: hasAudio ? {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId
                }
            } : false
        };
        
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        document.getElementById('localVideo').srcObject = localStream;
        
        // Подключаемся к WebSocket серверу
        initWebSocket();
        
        console.log("[OES Offscreen] Stream captured successfully");
    } catch (error) {
        console.error("[OES Offscreen] Error capturing stream:", error);
    }
}

function initWebSocket() {
    ws = new WebSocket(SIGNALING_SERVER);
    
    ws.onopen = () => {
        console.log("[OES Offscreen] Connected to signaling server");
        startWebRTC();
    };
    
    ws.onmessage = async (msg) => {
        const data = JSON.parse(msg.data);
        
        if (data.answer) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
        if (data.ice) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(data.ice));
            } catch (e) {
                console.error("[OES Offscreen] Error adding ICE candidate", e);
            }
        }
    };
    
    ws.onerror = (error) => {
        console.error("[OES Offscreen] WebSocket error:", error);
    };
    
    ws.onclose = () => {
        console.log("[OES Offscreen] WebSocket closed");
    };
}

function startWebRTC() {
    pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    // Добавляем треки
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });
    
    // ICE кандидаты
    pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ ice: event.candidate }));
        }
    };
    
    // Создаем оффер
    createOffer();
}

async function createOffer() {
    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ws.send(JSON.stringify({ offer }));
        console.log("[OES Offscreen] Offer sent");
    } catch (error) {
        console.error("[OES Offscreen] Error creating offer:", error);
    }
}

function stopParallelStream() {
    console.log("[OES Offscreen] Stopping stream");
    
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    if (pc) {
        pc.close();
        pc = null;
    }
    
    if (ws) {
        ws.close();
        ws = null;
    }
}