// parallel-stream.js - ИСПРАВЛЕННАЯ ВЕРСИЯ С ПРАВИЛЬНОЙ ПОСЛЕДОВАТЕЛЬНОСТЬЮ

class ParallelStreamer {
  constructor() {
    this.stream = null;
    this.pc = null;
    this.ws = null;
    this.isStreaming = false;
    this.serverUrl =
      window.location.protocol === "https:"
        ? "wss://unemployed-immorally-salma.ngrok-free.dev/signal"
        : "ws://localhost:8080/signal";

    // Слушаем команды
    window.addEventListener("message", (e) => this.handleMessage(e));

  }

  handleMessage(event) {
    if (!event.data || typeof event.data !== "object") return;
    const data = event.data;

    if (data.type === "parallel-stream-command") {
      if (data.action === "start") {
        this.start();
      }
      if (data.action === "stop") {
        this.stop();
      }
      return;
    }
  }

  async start() {
    if (this.isStreaming) {
      return;
    }

    try {
      await this.requestScreenCaptureWithDialog();
    } catch (err) {
      this.sendStatus("parallel-stream-error", {
        error: err.message,
      });
      this.stop();
    }
  }

  async requestScreenCaptureWithDialog() {
    try {

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


      const videoTrack = stream.getVideoTracks()[0];


      this.stream = stream;

      // Обработчик закрытия
      stream.getVideoTracks()[0].onended = () => {
        this.stop();
      };

      // 2. КРИТИЧЕСКИ ВАЖНО: Создаем PeerConnection ДО подключения к серверу!
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

    } catch (err) {

      if (err.name === "NotAllowedError") {
        throw new Error('-');
      } else if (err.name === "NotFoundError") {
        throw new Error("-");
      } else if (err.name === "AbortError") {
        throw new Error("-");
      } else {
        throw err;
      }
    }
  }

  async connectToSignaling() {
    return new Promise((resolve, reject) => {

      this.ws = new WebSocket(this.serverUrl);
      this.ws.binaryType = "blob";

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;

        // Отправляем broadcaster сообщение
        const broadcasterMsg = JSON.stringify({ type: "broadcaster" });
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


          // НОВЫЙ VIEWER ПОДКЛЮЧИЛСЯ
          if (data.type === "viewer-join") {
   

            // Закрываем старое соединение если есть
            if (this.pc) {
              this.pc.close();
              this.pc = null;
            }

            // Создаем НОВОЕ соединение для этого viewer
            await this.createPeerConnectionForViewer();
            return;
          }

          // ОТВЕТ ОТ VIEWER (answer)
          if (
            data.type === "answer" ||
            (data.sdp && data.sdp.type === "answer")
          ) {
            if (this.pc) {
              await this.pc.setRemoteDescription(
                new RTCSessionDescription(data.sdp)
              );
            }
            return;
          }

          // ICE CANDIDATE от viewer
          if (data.candidate) {
            if (this.pc) {
              await this.pc.addIceCandidate(
                new RTCIceCandidate(data.candidate)
              );
            }
            return;
          }

          // Количество зрителей
          if (data.type === "viewer-count") {
            this.sendStatus("parallel-stream-viewers", {
              count: data.count,
            });
          }
        } catch (err) {
        }
      };

      this.ws.onerror = (err) => {
        reject(new Error("Не удалось подключиться к серверу"));
      };

      this.ws.onclose = () => {
        if (
          this.isStreaming &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.reconnectAttempts++;
 
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

    // Добавляем треки из stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        const sender = this.pc.addTrack(track, this.stream);



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

    // Создаем offer
    const offer = await this.pc.createOffer();

    await this.pc.setLocalDescription(offer);

    // Отправляем offer viewer'у
    this.ws.send(JSON.stringify({ sdp: offer }));
  }

  // Настройка логирования состояния соединения
  setupConnectionLogging() {
    if (!this.pc) return;

    // ICE candidates
    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ candidate: e.candidate }));
   
        }
      } 
    };

    
  }

  stop() {

    // Останавливаем треки
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }

    // Закрываем peer connection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    // Закрываем websocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
      this.ws = null;
    }

    this.isStreaming = false;
    this.reconnectAttempts = 0;
    this.updateUI();

    this.sendStatus("parallel-stream-stopped");
  }

  updateUI() {
    this.sendStatus("parallel-stream-status", {
      isStreaming: this.isStreaming,
    });
  }

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

