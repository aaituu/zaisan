// parallel-stream.js - Добавить в web_accessible_resources
console.log('[Parallel Stream] Module loaded');

class ParallelStreamer {
    constructor() {
        this.stream = null;
        this.pc = null;
        this.ws = null;
        this.isStreaming = false;
        this.ngrokUrl = null;
        
        // Слушаем сообщения от background
        window.addEventListener('message', (e) => this.handleMessage(e));
    }

    async startCapture() {
        try {
            // Запрашиваем screen capture через существующий механизм OES
            window.postMessage('get-sourceId-v2', '*');
            
            // Ждем sourceId от OES
            return new Promise((resolve) => {
                const handler = (e) => {
                    if (e.data && e.data.sourceId) {
                        window.removeEventListener('message', handler);
                        this.getStreamFromSourceId(e.data.sourceId).then(resolve);
                    }
                };
                window.addEventListener('message', handler);
            });
        } catch (err) {
            console.error('[Parallel Stream] Capture error:', err);
            throw err;
        }
    }

    async getStreamFromSourceId(sourceId) {
        const constraints = {
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId,
                    maxWidth: 1920,
                    maxHeight: 1080,
                    maxFrameRate: 15
                }
            }
        };

        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('[Parallel Stream] Stream captured');
        return this.stream;
    }

    async connectToSignaling() {
        // Подключаемся к ngrok серверу
        const ngrokUrl = await this.getNgrokUrl();
        const wsUrl = ngrokUrl.replace('https://', 'wss://').replace('http://', 'ws://');
        
        this.ws = new WebSocket(`${wsUrl}/signal`);
        
        this.ws.onopen = () => {
            console.log('[Parallel Stream] Connected to signaling');
            this.ws.send(JSON.stringify({ type: 'broadcaster' }));
        };

        this.ws.onmessage = (e) => this.handleSignaling(JSON.parse(e.data));
        
        this.ws.onerror = (err) => console.error('[Parallel Stream] WS error:', err);
    }

    async getNgrokUrl() {
        // Получаем ngrok URL из локального API
        try {
            const response = await fetch('http://127.0.0.1:4040/api/tunnels');
            const data = await response.json();
            this.ngrokUrl = data.tunnels[0].public_url;
            console.log('[Parallel Stream] Ngrok URL:', this.ngrokUrl);
            return this.ngrokUrl;
        } catch (err) {
            console.error('[Parallel Stream] Failed to get ngrok URL:', err);
            throw new Error('Ngrok not running. Start: ngrok http 8080');
        }
    }

    async handleSignaling(data) {
        if (!this.pc && data.type === 'viewer-join') {
            await this.createPeerConnection();
        }

        if (data.sdp) {
            await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            if (data.sdp.type === 'offer') {
                const answer = await this.pc.createAnswer();
                await this.pc.setLocalDescription(answer);
                this.ws.send(JSON.stringify({ sdp: answer }));
            }
        }

        if (data.candidate) {
            await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    }

    async createPeerConnection() {
        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        this.pc = new RTCPeerConnection(config);

        // Добавляем треки из stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                this.pc.addTrack(track, this.stream);
            });
        }

        this.pc.onicecandidate = (e) => {
            if (e.candidate) {
                this.ws.send(JSON.stringify({ candidate: e.candidate }));
            }
        };

        this.pc.onconnectionstatechange = () => {
            console.log('[Parallel Stream] Connection state:', this.pc.connectionState);
        };

        // Создаем offer для нового viewer
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.ws.send(JSON.stringify({ sdp: offer }));
    }

    handleMessage(event) {
        const data = event.data;
        
        if (data === 'parallel-stream-start') {
            this.start();
        }
        
        if (data === 'parallel-stream-stop') {
            this.stop();
        }

        if (data === 'parallel-stream-get-url') {
            if (this.ngrokUrl) {
                window.postMessage({
                    type: 'parallel-stream-url',
                    url: this.ngrokUrl
                }, '*');
            }
        }
    }

    async start() {
        if (this.isStreaming) return;
        
        try {
            console.log('[Parallel Stream] Starting...');
            await this.startCapture();
            await this.connectToSignaling();
            this.isStreaming = true;
            
            window.postMessage({
                type: 'parallel-stream-started',
                url: this.ngrokUrl
            }, '*');
            
            console.log('[Parallel Stream] Started successfully');
        } catch (err) {
            console.error('[Parallel Stream] Start error:', err);
            window.postMessage({
                type: 'parallel-stream-error',
                error: err.message
            }, '*');
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        this.isStreaming = false;
        console.log('[Parallel Stream] Stopped');
    }
}

// Инициализация
const parallelStreamer = new ParallelStreamer();

// Автостарт при обнаружении OES прокторинга
window.addEventListener('message', (e) => {
    if (e.data === 'yes-oes-enabled-exam') {
        setTimeout(() => parallelStreamer.start(), 2000);
    }
});

console.log('[Parallel Stream] Ready');