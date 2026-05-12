# VaakSiddhi 🎙️

**Children's Speech Therapy · Phoneme Verification · POC**

> A parent anywhere in India opens our app, gives their child a tablet, and that child plays games for 15 minutes a day. In those 15 minutes, the child's voice is being analysed, their speech is improving, and their parent is learning what to do next — all automatically.

---

## What This Is

VaakSiddhi is a proof-of-concept speech therapy platform that listens to a child say a word, breaks their speech into phonemes, compares it to the expected pronunciation, and gives immediate feedback — all running **fully offline**, **no external APIs**, **open source**.

This POC focuses on **articulation disorders** — the most common speech problem in school-age children. A child mispronounces a sound (say, "wabbit" for "rabbit"), and VaakSiddhi tells them exactly which phoneme was wrong and how to fix it.

---

## Demo

| Step | What happens |
|---|---|
| Therapist types a word | App auto-generates expected phonemes |
| Child records themselves saying it | Browser captures audio via MediaRecorder |
| Backend transcribes + analyses | Whisper → phoneme converter → comparison |
| Rainbow Painter lights up | Each correct phoneme paints a stripe |
| Feedback appears | LLM or rule-based therapy tip |

---

## Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| React + Vite | UI framework |
| Tailwind CSS | Styling |
| Web Audio API | Mic gain normalization + noise processing |
| MediaRecorder API | Audio capture |
| JetBrains Mono | IPA phoneme display font |

### Backend
| Tool | Purpose |
|---|---|
| FastAPI | API server |
| faster-whisper (large-v3) | Speech-to-text — runs fully offline |
| g2p-en | English text → ARPAbet/IPA phonemes |
| epitran (hin-Deva) | Hindi text → IPA phonemes |
| noisereduce | Background noise removal before transcription |
| Ollama + phi3:mini | Local LLM for natural therapy feedback |
| Plain Python | Levenshtein distance for phoneme comparison |

### Key design decisions
- **No external APIs** — everything runs on your machine
- **No database** — session state lives in React, no persistence needed for POC
- **No cloud dependency** — designed for low-connectivity Indian clinics
- **Offline-first** — once models are downloaded, works with no internet

---

## Pipeline

```
Mic input
    ↓
Web Audio API (gain normalization + compression)
    ↓
MediaRecorder → WebM blob → POST /compare
    ↓
noisereduce (backend noise cleaning)
    ↓
faster-whisper → transcript text
    ↓
g2p-en / epitran → detected phonemes
    ↓
epitran / g2p-en → expected phonemes (from target word)
    ↓
Levenshtein distance → accuracy %  +  per-phoneme match
    ↓
Ollama phi3:mini → therapy tip  (falls back to rule-based dict)
    ↓
JSON response → React UI → Rainbow Painter game
```

---

## Running Locally

### Prerequisites
- Python 3.11 (use pyenv if needed)
- Node.js 18+
- Homebrew (Mac)
- Ollama installed: https://ollama.ai

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/vaaksiddhi-poc.git
cd vaaksiddhi-poc
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn faster-whisper epitran g2p-en noisereduce python-multipart httpx
uvicorn main:app --reload
```

The first startup downloads the Whisper `large-v3` model (~3GB). Subsequent starts take 30–60 seconds to load it into memory.

### 3. Ollama setup (for LLM feedback)
```bash
brew install ollama
ollama pull phi3:mini
ollama serve
```

If Ollama isn't running, the app falls back to rule-based feedback automatically.

### 4. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## Project Structure

```
vaaksiddhi-poc/
├── backend/
│   ├── main.py          # FastAPI app — all endpoints
│   └── venv/            # Python virtual environment
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main React component — Rainbow Painter game
│   │   └── index.css    # Global styles
│   ├── index.html
│   └── vite.config.js
└── README.md
```

---

## API Endpoints

### `POST /compare`
Takes an audio file and target word, returns phoneme analysis.

**Request:** `multipart/form-data`
- `audio` — WAV/WebM audio file
- `target_word` — the word the child was asked to say
- `language` — `english` (default) or `hindi`

**Response:**
```json
{
  "transcript": "wabbit",
  "target_word": "rabbit",
  "expected_phonemes": ["R", "AE", "B", "IH", "T"],
  "detected_phonemes": ["W", "AE", "B", "IH", "T"],
  "matches": [
    { "expected": "R", "detected": "W", "correct": false },
    { "expected": "AE", "detected": "AE", "correct": true },
    ...
  ],
  "accuracy": 80,
  "feedback": "Try curling your tongue tip toward the roof of your mouth."
}
```

### `POST /phonemes`
Converts a word to its expected phoneme sequence (used for live preview as therapist types).

**Request:** `multipart/form-data`
- `word` — target word
- `language` — `english` or `hindi`

**Response:**
```json
{ "phonemes": ["R", "AE", "B", "IH", "T"] }
```

### `GET /`
Health check — returns `{ "status": "VaakSiddhi backend running" }`.

---

## Why VaakSiddhi

India has **26 million+ children with disability** and a shortage of **80,000+ speech therapists**. A parent in a small town with no SLP within 100km has no tools. VaakSiddhi is built specifically for this gap — Indian languages, Indian phoneme sets, works on a ₹8,000 Android tablet, offline-first.

No other product addresses anti-epileptic medication speech side effects in children. That's our unique territory.

---

## License

MIT

---

*Every child has a voice. VaakSiddhi helps them find it.*
