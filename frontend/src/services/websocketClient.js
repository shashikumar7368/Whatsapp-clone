export class WebSocketClient {
    constructor(userId, token, onMessageCallback) {
        this.userId = userId;
        this.token = token;
        this.onMessageCallback = onMessageCallback;
        this.reconnectAttempts = 0;
        this.ws = null;

        // Convert http(s) URL to ws(s) URL and remove /api/v1 prefix since WebSockets are root-mounted
        let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
        baseUrl = baseUrl.replace('/api/v1', '');
        this.wsUrl = baseUrl.replace(/^http/, 'ws');
    }

    connect() {
        if (!this.userId || !this.token) return;

        this.ws = new WebSocket(`${this.wsUrl}/ws/${this.userId}?token=${this.token}`);

        this.ws.onopen = () => {
            console.log('WebSocket Connected');
            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (this.onMessageCallback) {
                    this.onMessageCallback(data);
                }
            } catch (e) {
                console.error('WS Parse Error', e);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket Disconnected');
            // Exponential backoff reconnect
            setTimeout(() => {
                if (this.reconnectAttempts < 5) {
                    this.reconnectAttempts++;
                    this.connect();
                }
            }, Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000));
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket Error', error);
            this.ws.close();
        };
    }

    send(payload) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
        } else {
            console.warn('Cannot send, WebSocket not open');
        }
    }

    disconnect() {
        if (this.ws) {
            // Prevent auto-reconnection on purposeful disconnect
            this.reconnectAttempts = 999;
            this.ws.close();
            this.ws = null;
        }
    }

    // Helper methodologies
    sendMessage(chatId, text, tempId) {
        this.send({
            type: 'send_message',
            chat_id: chatId,
            message_type: 'text',
            text: text,
            client_temp_id: tempId
        });
    }

    sendTypingStatus(chatId, isTyping) {
        this.send({
            type: 'typing',
            chat_id: chatId,
            is_typing: isTyping
        });
    }

    markMessagesRead(chatId) {
        this.send({
            type: 'message_read',
            chat_id: chatId
        });
    }
}
