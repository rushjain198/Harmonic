const NGROK_URL = 'unsurpliced-qualitatively-tressa.ngrok-free.dev';
const IS_NGROK = window.location.hostname.includes('ngrok-free.app') ||
    window.location.hostname.includes('ngrok-free.dev') ||
    window.location.hostname.includes('ngrok.io');

window.JAM_SESSION_WS_URL = IS_NGROK ? `wss://${NGROK_URL}` : `ws://${window.location.hostname || 'localhost'}:8502`;
window.JAM_SESSION_HTTP_URL = IS_NGROK ? `https://${NGROK_URL}` : `http://${window.location.hostname || 'localhost'}:8502`;
// AR Studio iframe points to the Streamlit proxy (/streamlit)
window.AR_STUDIO_BASE_URL = IS_NGROK
    ? `https://${NGROK_URL}/streamlit`
    : `http://${window.location.hostname || 'localhost'}:8768/streamlit`;

console.log('[Jam] Config:', { IS_NGROK, WS: window.JAM_SESSION_WS_URL, HTTP: window.JAM_SESSION_HTTP_URL, AR: window.AR_STUDIO_BASE_URL });

class JamSessionManager {
    constructor() {
        this.ws = null;
        this.roomId = null;
        this.playerId = null;
        this.connected = false;
        this.onRemoteNote = null;
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect(roomId, playerId, instrument) {
        console.log('[Jam] Connecting...', { roomId, playerId, instrument });
        this.roomId = roomId;
        this.playerId = playerId;
        this.instrument = instrument || 'piano';
        this.reconnectAttempts = 0;
        this._initWebSocket();
    }

    _initWebSocket() {
        if (!this.roomId || !this.playerId) {
            console.error('[Jam] Missing room or player ID');
            return;
        }
        const base = window.JAM_SESSION_WS_URL.replace(/\/$/, '');
        const wsUrl = `${base}/ws/${encodeURIComponent(this.roomId)}/${encodeURIComponent(this.playerId)}`;
        console.log('[Jam] Opening WebSocket:', wsUrl);

        try {
            this.ws = new WebSocket(wsUrl);
            this.ws.onopen = () => {
                console.log('[Jam] WebSocket OPENED');
                this.connected = true;
                this.reconnectAttempts = 0;
                this.ws.send(JSON.stringify({
                    type: 'join',
                    room_id: this.roomId,
                    player_id: this.playerId,
                    instrument: this.instrument
                }));
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'note' && data.player_id !== this.playerId) {
                        if (this.onRemoteNote) {
                            this.onRemoteNote({
                                note: data.note,
                                velocity: data.velocity,
                                instrument: data.instrument
                            });
                        }
                    } else if (data.type === 'player_joined' && data.player_id !== this.playerId) {
                        console.log('[Jam] Player joined:', data.player_id);
                        if (this.onPlayerJoined) this.onPlayerJoined(data.player_id);
                        this.showToast(`Player joined: ${data.player_id}`);
                        this.showPopup(`🎵 Someone joined!`, `Player ID: ${data.player_id} is now in the room.`);
                    } else if (data.type === 'player_left' && data.player_id !== this.playerId) {
                        console.log('[Jam] Player left:', data.player_id);
                        if (this.onPlayerLeft) this.onPlayerLeft(data.player_id);
                        this.showToast(`Player left: ${data.player_id}`);
                    }
                } catch (e) {
                    console.error('[Jam] Error parsing message', e);
                }
            };

            this.ws.onclose = () => {
                console.log('[Jam] WebSocket connection closed');
                this.connected = false;
                if (this.roomId && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`[Jam] Reconnecting... Attempt ${this.reconnectAttempts}`);
                    setTimeout(() => this._initWebSocket(), 2000);
                }
            };

            this.ws.onerror = (err) => {
                console.error('[Jam] WebSocket connection error', err);
            };
        } catch (e) {
            console.error('[Jam] Failed to create WebSocket', e);
        }
    }

    sendNote(note, velocity = 0.8) {
        if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'note',
                room_id: this.roomId,
                player_id: this.playerId,
                instrument: this.instrument,
                note: String(note),
                velocity: velocity
            }));
        }
    }

    disconnect() {
        this.roomId = null;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        this.logDebug('Disconnected from session.');
    }

    showToast(message) {
        console.log('[Jam] Toast:', message);
        this.logDebug(message);
        let toast = document.getElementById('jam-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'jam-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: rgba(0, 255, 136, 0.9);
                color: #000;
                padding: 12px 24px;
                border-radius: 8px;
                font-family: 'Inter', sans-serif;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                z-index: 10000;
                transition: opacity 0.5s ease;
                opacity: 0;
            `;
            document.body.appendChild(toast);
        }

        toast.innerText = message;
        toast.style.opacity = '1';

        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.style.opacity = '0';
        }, 3000);
    }

    logDebug(msg) {
        const consoleEl = document.getElementById('jam-debug-console');
        const logsEl = document.getElementById('jam-debug-logs');
        const statusEl = document.getElementById('jam-debug-status');
        if (!consoleEl || !logsEl) return;

        consoleEl.style.display = 'block';
        const div = document.createElement('div');
        div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        logsEl.appendChild(div);
        logsEl.scrollTop = logsEl.scrollHeight;

        if (this.connected) {
            statusEl.textContent = 'WS: Online';
            statusEl.style.color = '#00ff88';
        } else {
            statusEl.textContent = 'WS: Offline';
            statusEl.style.color = '#ff4444';
        }
    }

    showPopup(title, message) {
        console.log('[Jam] Popup:', title, message);
        let overlay = document.getElementById('jam-modal-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'jam-modal-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.85);
                display: flex; align-items: center; justify-content: center;
                z-index: 20000;
                backdrop-filter: blur(10px);
                opacity: 0;
                transition: opacity 0.4s ease;
                pointer-events: none;
            `;
            overlay.innerHTML = `
                <div style="background: #1a1a2e; border: 2px solid #00ff88; border-radius: 24px; padding: 40px; text-align: center; max-width: 400px; box-shadow: 0 0 50px rgba(0,255,136,0.2);">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🎉</div>
                    <h2 id="jam-modal-title" style="color: #00ff88; margin-bottom: 12px; font-size: 1.8rem;"></h2>
                    <p id="jam-modal-msg" style="color: #fff; opacity: 0.8; line-height: 1.6; margin-bottom: 30px;"></p>
                    <button onclick="document.getElementById('jam-modal-overlay').style.opacity='0'; document.getElementById('jam-modal-overlay').style.pointerEvents='none';" style="background: #00ff88; color: #000; border: none; padding: 12px 30px; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 1rem; transition: transform 0.2s;">Great!</button>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        document.getElementById('jam-modal-title').innerText = title;
        document.getElementById('jam-modal-msg').innerText = message;
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';

        // Auto Close after 5 seconds if not closed manually
        setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
        }, 5000);
    }
}
window.JamSessionManager = JamSessionManager;
