// parallel-stream.js - ИСПРАВЛЕННАЯ ВЕРСИЯ С ПРАВИЛЬНОЙ ПОСЛЕДОВАТЕЛЬНОСТЬЮ
console.log("[Parallel Stream] Module loaded");

class ParallelStreamer {
  constructor() {
    this.stream = null;
    this.pc = null;
    this.ws = null;
    this.isStreaming = false;
    this.serverUrl = "ws://localhost:8080/signal";
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;

    // Слушаем команды
    window.addEventListener("message", (e) => this.handleMessage(e));

    console.log("[Parallel Stream] ✅ Ready");
  }

  handleMessage(event) {
    if (!event.data || typeof event.data !== "object") return;
    const data = event.data;

    if (data.type === "parallel-stream-command") {
      if (data.action === "start") {
        console.log("[Parallel Stream] 🎬 START command received");
        this.start();
      }
      if (data.action === "stop") {
        console.log("[Parallel Stream] ⏹️ STOP command received");
        this.stop();
      }
      return;
    }
  }

  async start() {
    if (this.isStreaming) {
      console.log("[Parallel Stream] Already streaming");
      return;
    }

    try {
      console.log("[Parallel Stream] 🚀 Starting...");
      await this.requestScreenCaptureWithDialog();
    } catch (err) {
      console.error("[Parallel Stream] ❌ Start error:", err);
      this.sendStatus("parallel-stream-error", {
        error: err.message,
      });
      this.stop();
    }
  }

  async requestScreenCaptureWithDialog() {
    try {
      console.log("[Parallel Stream] 📺 Requesting screen with dialog...");

      // 1. Получаем stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          logicalSurface: true,
          cursor: "always",
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });

      console.log("[Parallel Stream] ✅ Got stream:", stream.getTracks().map((t) => ({
        kind: t.kind,
        label: t.label,
        enabled: t.enabled,
      })));

      const videoTrack = stream.getVideoTracks()[0];
      console.log("[Parallel Stream] 📹 Video track settings:", videoTrack.getSettings());
      console.log("[Parallel Stream] 📹 Track state:", videoTrack.readyState);
      console.log("[Parallel Stream] 📹 Track enabled:", videoTrack.enabled);

      this.stream = stream;

      // Обработчик закрытия
      stream.getVideoTracks()[0].onended = () => {
        console.log("[Parallel Stream] 🛑 User stopped sharing");
        this.stop();
      };

      // 2. КРИТИЧЕСКИ ВАЖНО: Создаем PeerConnection ДО подключения к серверу!
      console.log("[Parallel Stream] 🔗 Creating initial PeerConnection...");
      await this.createInitialPeerConnection();

      // 3. Подключаемся к серверу (viewer-join придет позже)
      await this.connectToSignaling();

      // Успех!
      this.isStreaming = true;
      this.updateUI();

      this.sendStatus("parallel-stream-started", {
        url: this.serverUrl.replace("ws://", "http://").replace("/signal", ""),
      });

      this.sendStatus("parallel-stream-url", {
        url: this.serverUrl.replace("ws://", "http://").replace("/signal", ""),
      });

      console.log("[Parallel Stream] ✅ Successfully started!");
      
    } catch (err) {
      console.error("[Parallel Stream] ❌ Capture error:", err);

      if (err.name === "NotAllowedError") {
        throw new Error('Доступ запрещен: нажмите "Разрешить" в диалоге');
      } else if (err.name === "NotFoundError") {
        throw new Error("Не найден источник для захвата");
      } else if (err.name === "AbortError") {
        throw new Error("Захват экрана отменен пользователем");
      } else {
        throw err;
      }
    }
  }

  async connectToSignaling() {
    return new Promise((resolve, reject) => {
      console.log("[Parallel Stream] 🔌 Connecting to:", this.serverUrl);

      this.ws = new WebSocket(this.serverUrl);
      this.ws.binaryType = "blob";

      this.ws.onopen = () => {
        console.log("[Parallel Stream] ✅ Connected to server");
        this.reconnectAttempts = 0;

        // Отправляем broadcaster сообщение
        const broadcasterMsg = JSON.stringify({ type: "broadcaster" });
        console.log("[Parallel Stream] 📤 Sending broadcaster message");
        this.ws.send(broadcasterMsg);

        resolve();
      };

      this.ws.onmessage = async (event) => {
        try {
          let data;
          if (event.data instanceof Blob) {
            const text = await event.data.text();
            data = JSON.parse(text);
          } else {
            data = JSON.parse(event.data);
          }

          console.log("[Parallel Stream] 📨 Signaling:", data);

          // НОВЫЙ VIEWER ПОДКЛЮЧИЛСЯ
          if (data.type === "viewer-join") {
            console.log("[Parallel Stream] 👤 New viewer joined! Sending offer...");
            
            // Закрываем старое соединение если есть
            if (this.pc) {
              console.log("[Parallel Stream] Closing old PeerConnection...");
              this.pc.close();
              this.pc = null;
            }

            // Создаем НОВОЕ соединение для этого viewer
            await this.createPeerConnectionForViewer();
            return;
          }

          // ОТВЕТ ОТ VIEWER (answer)
          if (data.type === "answer" || (data.sdp && data.sdp.type === "answer")) {
            console.log("[Parallel Stream] 📥 Received answer from viewer");
            if (this.pc) {
              await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
              console.log("[Parallel Stream] ✅ Answer set successfully");
            }
            return;
          }

          // ICE CANDIDATE от viewer
          if (data.candidate) {
            if (this.pc) {
              await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              console.log("[Parallel Stream] 🧊 ICE candidate added");
            }
            return;
          }

          // Количество зрителей
          if (data.type === "viewer-count") {
            console.log("[Parallel Stream] 👥 Viewers:", data.count);
            this.sendStatus("parallel-stream-viewers", {
              count: data.count,
            });
          }

        } catch (err) {
          console.error("[Parallel Stream] Message handling error:", err);
        }
      };

      this.ws.onerror = (err) => {
        console.error("[Parallel Stream] ❌ WS error:", err);
        reject(new Error("Не удалось подключиться к серверу"));
      };

      this.ws.onclose = () => {
        console.log("[Parallel Stream] 🔌 WS closed");
        if (this.isStreaming && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`[Parallel Stream] 🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => this.connectToSignaling(), 2000);
        }
      };
    });
  }

  // НОВЫЙ МЕТОД: Начальное соединение (БЕЗ offer, только добавляем треки)
  async createInitialPeerConnection() {
    const config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    };

    this.pc = new RTCPeerConnection(config);
    console.log("[Parallel Stream] 🔗 Initial PeerConnection created");

    // Добавляем треки из stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        const sender = this.pc.addTrack(track, this.stream);
        console.log("[Parallel Stream] ✅ Added track to PeerConnection:", track.kind, track.label);
        
        // Проверяем что трек активен
        console.log("[Parallel Stream] 📊 Track active:", track.enabled, track.muted, track.readyState);
      });
    }

    // Логирование состояния
    this.setupConnectionLogging();
  }

  // НОВЫЙ МЕТОД: Создание соединения для конкретного viewer (с offer)
  async createPeerConnectionForViewer() {
    // Если нет начального соединения, создаем
    if (!this.pc) {
      await this.createInitialPeerConnection();
    }

    console.log("[Parallel Stream] 📝 Creating offer for viewer...");
    
    // Создаем offer
    const offer = await this.pc.createOffer();
    console.log("[Parallel Stream] 📝 Offer created");

    await this.pc.setLocalDescription(offer);
    console.log("[Parallel Stream] ✅ Local description set");

    // Отправляем offer viewer'у
    console.log("[Parallel Stream] 📤 Sending offer to viewer...");
    this.ws.send(JSON.stringify({ sdp: offer }));
    console.log("[Parallel Stream] ✅ Offer sent");
  }

  // Настройка логирования состояния соединения
  setupConnectionLogging() {
    if (!this.pc) return;

    // ICE candidates
    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ candidate: e.candidate }));
          console.log("[Parallel Stream] 📤 Sent ICE candidate:", e.candidate.type);
        }
      } else {
        console.log("[Parallel Stream] ✅ All ICE candidates sent");
      }
    };

    // Connection state
    this.pc.onconnectionstatechange = () => {
      console.log("[Parallel Stream] 🔗 Connection state:", this.pc.connectionState);

      if (this.pc.connectionState === "connected") {
        console.log("[Parallel Stream] ✅ ✅ ✅ Viewer connected successfully!");
      }

      if (this.pc.connectionState === "failed") {
        console.error("[Parallel Stream] ❌ Connection failed");
      }
    };

    // ICE connection state
    this.pc.oniceconnectionstatechange = () => {
      console.log("[Parallel Stream] 🧊 ICE state:", this.pc.iceConnectionState);
    };

    // ICE gathering state
    this.pc.onicegatheringstatechange = () => {
      console.log("[Parallel Stream] 🧊 ICE gathering:", this.pc.iceGatheringState);
    };

    // Signaling state
    this.pc.onsignalingstatechange = () => {
      console.log("[Parallel Stream] 📡 Signaling state:", this.pc.signalingState);
    };
  }

  stop() {
    console.log("[Parallel Stream] ⏹️ Stopping...");

    // Останавливаем треки
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
        console.log("[Parallel Stream] ⏹️ Stopped track:", track.kind);
      });
      this.stream = null;
    }

    // Закрываем peer connection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
      console.log("[Parallel Stream] 🔌 PeerConnection closed");
    }

    // Закрываем websocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
      this.ws = null;
      console.log("[Parallel Stream] 🔌 WebSocket closed");
    }

    this.isStreaming = false;
    this.reconnectAttempts = 0;
    this.updateUI();

    this.sendStatus("parallel-stream-stopped");

    console.log("[Parallel Stream] ✅ Stopped completely");
  }

  updateUI() {
    this.sendStatus("parallel-stream-status", {
      isStreaming: this.isStreaming,
    });
  }

  sendStatus(type, data = {}) {
    window.postMessage({
      type: type,
      ...data,
    }, "*");
  }
}

// Инициализация
const parallelStreamer = new ParallelStreamer();

console.log("[Parallel Stream] ✅ Ready and waiting for commands");
console.log("[Parallel Stream] 💡 Will use getDisplayMedia() for screen selection");