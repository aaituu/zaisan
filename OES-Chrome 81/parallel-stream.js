// parallel-stream.js - ПРАВИЛЬНАЯ ВЕРСИЯ с диалогом выбора экрана
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

    // Команды от content script
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

      // ВАЖНО: Используем стандартный Chrome API для выбора экрана
      // Это покажет диалог: "Весь экран / Окно / Вкладка Chrome"
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

      // Используем getDisplayMedia - это СТАНДАРТНЫЙ Chrome API
      // Он показывает диалог выбора:
      // ✅ Весь экран
      // ✅ Окно приложения
      // ✅ Вкладка Chrome
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
    // monitor, window, browser
          logicalSurface: true,
          cursor: "always", // always, motion, never
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false, // Можно включить: audio: true
      });

      console.log(
        "[Parallel Stream] ✅ Got stream:",
        stream.getTracks().map((t) => ({
          kind: t.kind,
          label: t.label,
          enabled: t.enabled,
        }))
      );
      // --- Начало вставки для отладки черного экрана ---
      const videoTrack = stream.getVideoTracks()[0]; //
      const settings = videoTrack.getSettings(); //

      console.log("[Parallel Stream] 📹 Video track settings:", settings); //
      console.log(
        '[Parallel Stream] 📹 Track state (ожидается "live"):',
        videoTrack.readyState
      ); //
      console.log(
        "[Parallel Stream] 📹 Track enabled (ожидается true):",
        videoTrack.enabled
      ); //
      // --- Конец вставки ---

      this.stream = stream;

      // Добавляем обработчик на случай если пользователь нажмет "Прекратить показ"
      stream.getVideoTracks()[0].onended = () => {
        console.log("[Parallel Stream] 🛑 User stopped sharing");
        this.stop();
      };

      // Подключаемся к серверу
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
      console.log("[Parallel Stream] 📊 Stream info:", {
        videoTrack: stream.getVideoTracks()[0].label,
        settings: stream.getVideoTracks()[0].getSettings(),
      });
    } catch (err) {
      console.error("[Parallel Stream] ❌ Capture error:", err);

      // Обработка ошибок
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

      // ВАЖНО: Устанавливаем binaryType для текстовых сообщений
      this.ws.binaryType = "blob";

      this.ws.onopen = () => {
        console.log("[Parallel Stream] ✅ Connected to server");
        this.reconnectAttempts = 0;

        // Отправляем broadcaster сообщение
        const broadcasterMsg = JSON.stringify({ type: "broadcaster" });
        console.log(
          "[Parallel Stream] 📤 Sending broadcaster message:",
          broadcasterMsg
        );
        this.ws.send(broadcasterMsg);

        resolve();
      };

      this.ws.onmessage = async (event) => {
        try {
          let data;

          // 1. ИСПРАВЛЕНИЕ BLOB-ОШИБКИ: Проверяем, если данные в виде Blob
          if (event.data instanceof Blob) {
            const text = await event.data.text();
            data = JSON.parse(text);
          } else {
            data = JSON.parse(event.data);
          }

          console.log("[Parallel Stream] 📨 Signaling:", data);

          if (data.type === "answer") {
            // ИСПРАВЛЕНИЕ: Добавлен 'this.'
            await this.pc.setRemoteDescription(
              new RTCSessionDescription(data.sdp)
            );
            console.log("[Parallel Stream] ✅ Answer received and set");
          } else if (data.type === "ice-candidate" && data.candidate) {
            // ИСПРАВЛЕНИЕ: Добавлен 'this.'
            await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            console.log("[Parallel Stream] 🧊 ICE candidate added");
          } else if (data.type === "viewer-count") {
            console.log("[Parallel Stream] 👥 Viewers:", data.count);
            // ИСПРАВЛЕНИЕ: Заменен 'sendToBackground' на 'this.sendStatus'
            this.sendStatus({
              type: "parallel-stream-viewers",
              count: data.count,
            });
          } else if (data.type === "viewer-join") {
            console.log(
              "[Parallel Stream] 👤 New viewer joined! Creating peer connection..."
            );

            // 👇 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ ДЛЯ ЧИСТОГО ЗАКРЫТИЯ
            if (this.pc) {
              console.log("[Parallel Stream] Closing old PeerConnection...");
              this.pc.close();
              this.pc = null;
            }

            await this.createPeerConnection();
            return;
          }
          // SDP offer/answer - тут уже 'this.pc' было верно
          else if (data.sdp) {
            if (!this.pc) {
              console.warn(
                "[Parallel Stream] ⚠️ Got SDP but no peer connection, creating one..."
              );
              await this.createPeerConnection();
            }

            console.log("[Parallel Stream] 📥 Received SDP:", data.sdp.type);
            await this.pc.setRemoteDescription(
              new RTCSessionDescription(data.sdp)
            );

            if (data.sdp.type === "offer") {
              const answer = await this.pc.createAnswer();
              await this.pc.setLocalDescription(answer);
              this.ws.send(JSON.stringify({ sdp: answer }));
              console.log("[Parallel Stream] 📤 Sent answer");
            }
          }

          // ICE candidate - тут уже 'this.pc' было верно
          else if (data.candidate) {
            if (this.pc) {
              await this.pc.addIceCandidate(
                new RTCIceCandidate(data.candidate)
              );
              console.log("[Parallel Stream] ✅ Added ICE candidate");
            }
          }
          // ... остальные типы
        } catch (err) {
          console.error("[Parallel Stream] Invalid message:", err);
        }
      };

      this.ws.onerror = (err) => {
        console.error("[Parallel Stream] ❌ WS error:", err);
        reject(
          new Error(
            "Не удалось подключиться к серверу. Запущен ли stream-server?"
          )
        );
      };

      this.ws.onclose = () => {
        console.log("[Parallel Stream] 🔌 WS closed");
        if (
          this.isStreaming &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.reconnectAttempts++;
          console.log(
            `[Parallel Stream] 🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
          );
          setTimeout(() => this.connectToSignaling(), 2000);
        }
      };
    });
  }

  // async handleSignaling(data) {
  //     console.log('[Parallel Stream] 📨 Signaling:', data);

  //     // Новый зритель

  //     // Обновление количества зрителей
  //     if (data.type === 'viewer-count') {
  //         console.log('[Parallel Stream] 👥 Viewers:', data.count);
  //         this.sendStatus('parallel-stream-viewers', {
  //             count: data.count
  //         });
  //         return;
  //     }

  // }

  async createPeerConnection() {
    const config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    };

    this.pc = new RTCPeerConnection(config);
    console.log("[Parallel Stream] 🔗 PeerConnection created");

    // Добавляем треки из stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        this.pc.addTransceiver(track, {
          direction: "sendonly", // Отправляем только
        });

        console.log(
          "[Parallel Stream] ✅ Added transceiver for track:",
          track.kind
        );
      });
    } else {
      console.error("[Parallel Stream] ❌ No stream available!");
      return;
    }

    // ICE candidates
    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ candidate: e.candidate }));
          console.log(
            "[Parallel Stream] 📤 Sent ICE candidate:",
            e.candidate.type,
            e.candidate.protocol
          );
        }
      } else {
        console.log("[Parallel Stream] ✅ All ICE candidates sent");
      }
    };

    // Connection state
    this.pc.onconnectionstatechange = () => {
      console.log(
        "[Parallel Stream] 🔗 Connection state:",
        this.pc.connectionState
      );

      if (this.pc.connectionState === "connected") {
        console.log(
          "[Parallel Stream] ✅ ✅ ✅ Viewer connected successfully!"
        );
      }

      if (this.pc.connectionState === "failed") {
        console.error("[Parallel Stream] ❌ Connection failed");
        if (this.pc) {
          this.pc.close();
          this.pc = null;
        }
      }

      if (this.pc.connectionState === "closed") {
        console.log("[Parallel Stream] 🔌 Connection closed");
      }
    };

    // ICE connection state
    this.pc.oniceconnectionstatechange = () => {
      console.log(
        "[Parallel Stream] 🧊 ICE connection state:",
        this.pc.iceConnectionState
      );
    };

    // ICE gathering state
    this.pc.onicegatheringstatechange = () => {
      console.log(
        "[Parallel Stream] 🧊 ICE gathering state:",
        this.pc.iceGatheringState
      );
    };

    // Signaling state
    this.pc.onsignalingstatechange = () => {
      console.log(
        "[Parallel Stream] 📡 Signaling state:",
        this.pc.signalingState
      );
    };

    // Создаем offer для viewer
    console.log("[Parallel Stream] 📝 Creating offer...");
    const offer = await this.pc.createOffer();
    console.log("[Parallel Stream] 📝 Offer created:", offer);

    await this.pc.setLocalDescription(offer);
    console.log("[Parallel Stream] ✅ Local description set");

    console.log("[Parallel Stream] 📤 Sending offer to server...");
    const offerMessage = JSON.stringify({ sdp: offer });
    console.log(
      "[Parallel Stream] 📤 Offer message:",
      offerMessage.substring(0, 100) + "..."
    );

    this.ws.send(offerMessage);
    console.log("[Parallel Stream] ✅ Offer sent successfully");
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

    // Уведомляем об остановке
    this.sendStatus("parallel-stream-stopped");

    console.log("[Parallel Stream] ✅ Stopped completely");
  }

  updateUI() {
    this.sendStatus("parallel-stream-status", {
      isStreaming: this.isStreaming,
    });
  }

  // Отправка статуса в content script
  sendStatus(type, data = {}) {
    window.postMessage(
      {
        type: type,
        ...data,
      },
      "*"
    );
  }
}

// Инициализация
const parallelStreamer = new ParallelStreamer();

console.log("[Parallel Stream] ✅ Ready and waiting for commands");
console.log(
  "[Parallel Stream] 💡 Will use getDisplayMedia() for screen selection"
);
