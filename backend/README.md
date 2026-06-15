# Harmonic — backend (optional)

The Harmonic experience runs **entirely in the browser** for single-player: each
instrument player (`public/play/*.html`) does its own webcam hand-tracking via
MediaPipe and synthesises sound with the Web Audio API. **No backend is required
to pick an instrument and play it.**

This `backend/` folder is the Python stack from the original Harmonic repo, kept
for the optional features:

| Server | Port | Framework | Adds |
| --- | --- | --- | --- |
| `music_api.py` | 8766 | Flask | song library + MP3/MIDI → note transcription (practice/song-follow mode) |
| `session_server.py` | 8502 | FastAPI | multiplayer "jam" rooms (note broadcast over WebSocket) |
| `websocket_server.py` | 8765 | FastAPI | legacy spectator mode (superseded) |
| `ar_studio.py` | 8768 | Streamlit | the original desktop OpenCV/MediaPipe studio (standalone) |

The players already **fail gracefully** when these aren't running — song dropdowns
just stay empty and jam is unavailable; everything else works.

## Run everything with one command

From the **project root** (after a one-time backend install):

```bash
# one-time: install the backend deps into a venv the launcher will auto-detect
cd backend
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cd ..

# then, from the project root — starts the site + song + jam servers together
npm run dev:all                # dev (Vite :5173 + API :8766 + jam :8502)
npm run start:all              # same, but serves the production build (:4173)
```

`dev:all` is best-effort about Python: if it (or the deps) aren't present it still
serves the site and just logs a note — webcam instrument play works regardless.

## Or run the servers by hand

```bash
cd backend
python music_api.py                       # :8766  song library / transcription
uvicorn session_server:app --port 8502    # :8502  multiplayer jam
```

`ar_studio.py` additionally needs `opencv-python mediapipe streamlit simpleaudio numpy`
and the bundled `hand_landmarker.task` model; run it with `streamlit run ar_studio.py`.

## Notes
- Sample sound banks (`sounds/`, `drum_sounds/`, `Bass sounds/`) and `music_files/`
  are included so the API and desktop studio work out of the box.
- The browser players keep their own copy of the sounds under `public/play/`, so the
  website is fully standalone.
