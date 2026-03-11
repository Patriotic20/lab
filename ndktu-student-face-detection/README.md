# NDKTU Student Face Detection API

A production-ready REST API that analyzes video files and live camera streams to detect whether two human faces appear simultaneously. Built with FastAPI and MediaPipe.

---

## Features

- **`POST /v1/video/analyze`** — Upload a video file, receive `{ "has_two_faces": bool }`
- **`WS /v1/video/stream`** — Stream live camera frames, receive per-frame results
- **Efficient frame sampling** — Samples at 2 FPS with early-exit on first match
- **Non-blocking** — OpenCV processing runs off the async event loop
- **Typed error responses** — Every failure maps to a deterministic HTTP status code
- **25 automated tests** — Unit + integration coverage

---

## Requirements

- Python 3.12+
- [`uv`](https://github.com/astral-sh/uv) (recommended) or `pip`

---

## Setup

```bash
git clone <repo-url>
cd ndktu-student-face-detection

uv venv
source .venv/bin/activate
uv sync

cp .env.example .env
```

---

## Running

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## API Reference

### POST `/v1/video/analyze` — Video file upload

Upload a pre-recorded video. Returns `true` if any frame contains exactly two simultaneous faces.

```bash
curl -X POST http://localhost:8000/v1/video/analyze \
  -F "file=@your_video.mp4;type=video/mp4"
```

**Response:**
```json
{ "has_two_faces": true }
```

**Supported formats:** `mp4`, `avi`, `mov`, `mkv`, `webm` — max **200 MB**

| Code | Reason |
|------|--------|
| `400` | Unsupported format or corrupted video |
| `413` | File exceeds 200 MB |
| `422` | No file provided |

---

### WS `/v1/video/stream` — Real-time camera stream

Connect a WebSocket and send JPEG frames from the browser camera. The server replies with a detection result for every frame.

**Client → Server:** base64-encoded JPEG string (e.g. `canvas.toDataURL('image/jpeg', 0.6)`)

**Server → Client:**
```json
{ "has_two_faces": true, "face_count": 2 }
```

**Frontend JavaScript:**

```javascript
const ws = new WebSocket('ws://localhost:8000/v1/video/stream');

const video = document.createElement('video');
navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    video.srcObject = stream;
    video.play();
});

// Send frames at 10 FPS
setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) return;
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    ws.send(canvas.toDataURL('image/jpeg', 0.6));
}, 100);

// Receive result per frame
ws.onmessage = (event) => {
    const { has_two_faces, face_count } = JSON.parse(event.data);
    console.log('Two faces:', has_two_faces, '| Count:', face_count);
};
```

---

## Project Structure

```
app/
├── main.py              # FastAPI app factory, lifespan, exception handlers
├── core/
│   ├── config.py        # Environment-driven settings (Pydantic)
│   ├── exceptions.py    # Custom exception hierarchy
│   └── logging.py       # Structured logger
├── models/
│   └── schemas.py       # Response schemas
├── api/
│   ├── router.py        # Route aggregator
│   └── v1/
│       ├── video.py     # POST /v1/video/analyze
│       └── stream.py    # WS  /v1/video/stream
├── services/
│   ├── face_detector.py # MediaPipe Tasks API wrapper
│   └── video_service.py # Analysis pipeline (sampling + detection)
└── utils/
    ├── file_utils.py    # MIME + size validation
    └── video_utils.py   # Frame extraction helpers
tests/
├── unit/                # Mocked logic tests
└── integration/         # HTTP endpoint tests
```

---

## Configuration

All settings are read from `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_PATH` | `blaze_face_short_range.tflite` | Path to MediaPipe model |
| `SAMPLE_FPS` | `2` | Frames per second to sample (file upload only) |
| `MIN_DETECTION_CONFIDENCE` | `0.5` | Minimum face detection confidence |
| `MAX_FILE_SIZE_MB` | `200` | Upload size limit |
| `LOG_LEVEL` | `INFO` | Logging verbosity |

---

## Testing

```bash
python -m pytest tests/ -v
```

---

## Detection Logic

**File upload (`/analyze`):**
1. Sample video uniformly at `SAMPLE_FPS` frames per second
2. For each frame run MediaPipe face detector
3. Return `true` on the first frame with **exactly 2** faces; otherwise `false`

**Real-time stream (`/stream`):**
1. Detect faces on every received frame
2. Return `{ "has_two_faces": face_count == 2, "face_count": N }` immediately

Corrupted frames are skipped silently in both cases.
