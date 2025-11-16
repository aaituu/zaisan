// parallel-stream.js - Исправленная версия
console.log('[Parallel Stream] Module loaded');

class ParallelStreamer {
    constructor() {
        this.stream = null;
        this.pc = null;
        this.ws = null;
        this.isStreaming = false;
        this.serverUrl = 'ws://localhost:8080/signal'; // По умолчанию локальный
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        window.addEventListener('message', (e) => this.handleMessage(e));
        this.createUI();
    }

    createUI() {
        // UI больше не нужен, управление через popup
        console.log('[Parallel Stream] UI управляется через popup расширения');
    }

    updateUI() {
        // Отправляем статус
        this.sendStatus('parallel-stream-status', {
            isStreaming: this.isStreaming
        });
    }

    sendStatusToPopup() {
        // Больше не нужен, используем sendStatus
    }

    async startCapture() {
        try {
            console.log('[Parallel Stream] 🎬 Requesting screen capture...');
            
            // Запрашиваем sourceId через OES механизм
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('❌ Timeout waiting for sourceId (10s)'));
                }, 10000);

                const handler = (e) => {
                    if (e.data && e.data.sourceId) {
                        clearTimeout(timeout);
                        window.removeEventListener('message', handler);
                        console.log('[Parallel Stream] ✅ Got sourceId:', e.data.sourceId);
                        this.getStreamFromSourceId(e.data.sourceId).then(resolve).catch(reject);
                    }
                };
                
                window.addEventListener('message', handler);
                console.log('[Parallel Stream] 📡 Sending get-sourceId-v2...');
                window.postMessage('get-sourceId-v2', '*');
            });
        } catch (err) {
            console.error('[Parallel Stream] ❌ Capture error:', err);
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
                    maxFrameRate: 30
                }
            }
        };

        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('[Parallel Stream] Stream captured:', this.stream.getTracks());
        return this.stream;
    }

    async connectToSignaling() {
        return new Promise((resolve, reject) => {
            console.log('[Parallel Stream] Connecting to:', this.serverUrl);
            
            this.ws = new WebSocket(this.serverUrl);
            
            this.ws.onopen = () => {
                console.log('[Parallel Stream] Connected to signaling server');
                this.reconnectAttempts = 0;
                this.ws.send(JSON.stringify({ type: 'broadcaster' }));
                resolve();
            };

            this.ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    this.handleSignaling(data);
                } catch (err) {
                    console.error('[Parallel Stream] Invalid message:', err);
                }
            };
            
            this.ws.onerror = (err) => {
                console.error('[Parallel Stream] WS error:', err);
                reject(new Error('Failed to connect to server'));
            };

            this.ws.onclose = () => {
                console.log('[Parallel Stream] WS closed');
                if (this.isStreaming && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`[Parallel Stream] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                    setTimeout(() => this.connectToSignaling(), 2000);
                }
            };
        });
    }

    async handleSignaling(data) {
        console.log('[Parallel Stream] Signaling:', data.type);

        if (data.type === 'viewer-join') {
            console.log('[Parallel Stream] New viewer joined, creating connection...');
            await this.createPeerConnection();
            return;
        }

        if (data.sdp) {
            if (!this.pc) {
                console.warn('[Parallel Stream] Received SDP but no peer connection');
                return;
            }

            await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            
            if (data.sdp.type === 'offer') {
                const answer = await this.pc.createAnswer();
                await this.pc.setLocalDescription(answer);
                this.ws.send(JSON.stringify({ sdp: answer }));
                console.log('[Parallel Stream] Sent answer');
            }
        }

        if (data.candidate) {
            if (this.pc) {
                await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                console.log('[Parallel Stream] Added ICE candidate');
            }
        }
    }

    async createPeerConnection() {
        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };

        this.pc = new RTCPeerConnection(config);
        console.log('[Parallel Stream] PeerConnection created');

        // Добавляем все треки из stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                console.log('[Parallel Stream] Adding track:', track.kind);
                this.pc.addTrack(track, this.stream);
            });
        } else {
            console.error('[Parallel Stream] No stream available!');
        }

        this.pc.onicecandidate = (e) => {
            if (e.candidate && this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ candidate: e.candidate }));
                console.log('[Parallel Stream] Sent ICE candidate');
            }
        };

        this.pc.onconnectionstatechange = () => {
            console.log('[Parallel Stream] Connection state:', this.pc.connectionState);
            
            if (this.pc.connectionState === 'connected') {
                console.log('[Parallel Stream] ✓ Viewer connected successfully!');
            }
            
            if (this.pc.connectionState === 'failed' || this.pc.connectionState === 'closed') {
                console.log('[Parallel Stream] Connection failed/closed, cleaning up...');
                if (this.pc) {
                    this.pc.close();
                    this.pc = null;
                }
            }
        };

        this.pc.oniceconnectionstatechange = () => {
            console.log('[Parallel Stream] ICE state:', this.pc.iceConnectionState);
        };

        // Создаем offer для нового viewer
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.ws.send(JSON.stringify({ sdp: offer }));
        console.log('[Parallel Stream] Sent offer');
    }

    handleMessage(event) {
        if (!event.data || typeof event.data !== 'object') return;
        const data = event.data;
        
        // Команды от content script
        if (data.type === 'parallel-stream-command') {
            if (data.action === 'start') {
                console.log('[Parallel Stream] Received START command');
                this.start();
            }
            if (data.action === 'stop') {
                console.log('[Parallel Stream] Received STOP command');
                this.stop();
            }
        }
    }

    // Отправка статуса в content script
    sendStatus(type, data = {}) {
        window.postMessage({
            type: type,
            ...data
        }, '*');
    }

    async start() {
        if (this.isStreaming) {
            console.log('[Parallel Stream] Already streaming');
            return;
        }
        
        try {
            console.log('[Parallel Stream] Starting...');
            
            // 1. Захватываем экран
            await this.startCapture();
            
            // 2. Подключаемся к серверу
            await this.connectToSignaling();
            
            this.isStreaming = true;
            this.updateUI();
            
            // Отправляем успешный старт
            this.sendStatus('parallel-stream-started', {
                url: this.serverUrl.replace('ws://', 'http://').replace('/signal', '')
            });
            
            // Отправляем URL
            this.sendStatus('parallel-stream-url', {
                url: this.serverUrl.replace('ws://', 'http://').replace('/signal', '')
            });
            
            console.log('[Parallel Stream] ✓ Started successfully');
            
        } catch (err) {
            console.error('[Parallel Stream] Start error:', err);
            
            // Отправляем ошибку
            this.sendStatus('parallel-stream-error', {
                error: err.message
            });
            
            this.stop();
        }
    }

    stop() {
        console.log('[Parallel Stream] Stopping...');
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
                console.log('[Parallel Stream] Stopped track:', track.kind);
            });
            this.stream = null;
        }
        
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close();
            this.ws = null;
        }
        
        this.isStreaming = false;
        this.reconnectAttempts = 0;
        this.updateUI();
        
        // Уведомляем об остановке
        this.sendStatus('parallel-stream-stopped');
        
        console.log('[Parallel Stream] ✓ Stopped');
    }
}

// Инициализация
const parallelStreamer = new ParallelStreamer();

console.log('[Parallel Stream] Ready - Use extension popup to start streaming');