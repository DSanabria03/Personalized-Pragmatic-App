"""
Pip's voice: turns text into speech. Three options, tried in this order:

  1. ElevenLabs  - very natural, online, needs your own free key (ELEVENLABS_API_KEY in backend/.env)
  2. Piper       - free, open source, runs on the laptop, no key and no account. Works for everyone.
                   Installed with:  uv sync --extra voice
  3. Browser     - if neither works, this endpoint says so and the screen uses the browser's built-in voice.

    POST /api/tts   {"text": "...", "language": "en" | "it", "speaker": "pip" | "customer"}  ->  audio
    GET  /api/tts/status                                                                     ->  which voice is used

Every sentence is saved in data/tts_cache/ after the first time, so it's only generated once.

Settings (environment variables or backend/.env), all optional:
    ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ELEVENLABS_CUSTOMER_VOICE_ID, ELEVENLABS_MODEL
    PIPER_VOICE_EN, PIPER_VOICE_IT                  Pip's Piper voices
    PIPER_CUSTOMER_VOICE_EN, PIPER_CUSTOMER_VOICE_IT  the customers' Piper voices
Listen to all Piper voices: https://rhasspy.github.io/piper-samples/
"""

import hashlib
import io
import os
import subprocess
import sys
import threading
import wave
from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["voice"])

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CACHE_DIR = DATA_DIR / "tts_cache"
VOICES_DIR = DATA_DIR / "piper_voices"      # Piper voice files are downloaded here the first time (needs internet once)


class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    speaker: str = "pip"     # "pip" or "customer"


# ---------------------------------------------------------------- ElevenLabs (optional, online)
ELEVEN_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
ELEVEN_DEFAULT_VOICE = "JBFqnCBsd6RMkjVDRZzb"   # "George", a ready-made ElevenLabs voice


def _eleven_settings(speaker: str):
    key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    pip_voice = os.getenv("ELEVENLABS_VOICE_ID", ELEVEN_DEFAULT_VOICE).strip()
    voice = os.getenv("ELEVENLABS_CUSTOMER_VOICE_ID", "").strip() if speaker == "customer" else ""
    model = os.getenv("ELEVENLABS_MODEL", "eleven_flash_v2_5").strip()
    return key, (voice or pip_voice), model


def _elevenlabs(text: str, speaker: str) -> bytes | None:
    key, voice, model = _eleven_settings(speaker)
    if not key:
        return None
    try:
        r = httpx.post(
            ELEVEN_URL.format(voice_id=voice),
            params={"output_format": "mp3_44100_128"},
            headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
            json={"text": text, "model_id": model},
            timeout=30,
        )
    except httpx.HTTPError as error:
        print(f"[tts] ElevenLabs not reachable ({type(error).__name__}), trying Piper")
        return None
    if r.status_code != 200:
        # 401 = wrong key, 402/429 = no credits left / too many requests, 422 = wrong voice or model id
        print(f"[tts] ElevenLabs error {r.status_code}: {r.text[:200]} - trying Piper")
        return None
    return r.content


# ---------------------------------------------------------------- Piper (free, local, for everyone)
PIPER_DEFAULTS = {
    ("en", "pip"): "en_US-lessac-medium",
    ("en", "customer"): "en_US-ryan-medium",
    ("it", "pip"): "it_IT-paola-medium",
    ("it", "customer"): "it_IT-riccardo-x_low",
}
_piper_voices = {}
_piper_lock = threading.Lock()

try:
    from piper import PiperVoice          # installed with: uv sync --extra voice
    PIPER_INSTALLED = True
except ImportError:
    PIPER_INSTALLED = False


def _piper_voice_name(language: str, speaker: str) -> str:
    lang = "it" if language == "it" else "en"
    who = "customer" if speaker == "customer" else "pip"
    env = f"PIPER_{'CUSTOMER_' if who == 'customer' else ''}VOICE_{lang.upper()}"
    return os.getenv(env, PIPER_DEFAULTS[(lang, who)]).strip()


def _download_piper_voice(name: str) -> Path:
    """Downloads a Piper voice (.onnx + .onnx.json, about 20-60 MB) the first time it's needed."""
    model = VOICES_DIR / f"{name}.onnx"
    if model.is_file() and Path(str(model) + ".json").is_file():
        return model
    VOICES_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[tts] downloading Piper voice {name} (only the first time)...")
    # 1) Piper's own downloader
    subprocess.run([sys.executable, "-m", "piper.download_voices", name],
                   cwd=VOICES_DIR, check=False, timeout=600)
    if model.is_file() and Path(str(model) + ".json").is_file():
        return model
    # 2) Backup: download the two files directly from Hugging Face (rhasspy/piper-voices)
    lang_code, speaker_name, quality = name.split("-", 2)
    base = (f"https://huggingface.co/rhasspy/piper-voices/resolve/main/"
            f"{lang_code.split('_')[0]}/{lang_code}/{speaker_name}/{quality}/{name}")
    for suffix in (".onnx", ".onnx.json"):
        r = httpx.get(base + suffix, follow_redirects=True, timeout=600)
        r.raise_for_status()
        (VOICES_DIR / f"{name}{suffix}").write_bytes(r.content)
    return model


def _piper(text: str, language: str, speaker: str) -> bytes | None:
    if not PIPER_INSTALLED:
        return None
    name = _piper_voice_name(language, speaker)
    try:
        with _piper_lock:
            if name not in _piper_voices:
                _piper_voices[name] = PiperVoice.load(str(_download_piper_voice(name)))
            voice = _piper_voices[name]
            buffer = io.BytesIO()
            with wave.open(buffer, "wb") as wav_file:
                voice.synthesize_wav(text, wav_file)
        return buffer.getvalue()
    except Exception as error:   # no internet for the first download, wrong voice name...
        print(f"[tts] Piper failed ({type(error).__name__}: {error}) - the browser voice will be used")
        return None


# ---------------------------------------------------------------- the endpoints
def _provider() -> str:
    if _eleven_settings("pip")[0]:
        return "elevenlabs"
    if PIPER_INSTALLED:
        return "piper"
    return "browser"


@router.get("/tts/status")
def tts_status():
    """Which voice is used. elevenlabs=true shows the 'Voice: ElevenLabs' credit on the screen."""
    provider = _provider()
    return {"provider": provider, "available": provider != "browser", "elevenlabs": provider == "elevenlabs"}


@router.post("/tts")
def text_to_speech(req: TTSRequest):
    text = req.text.strip()[:600]           # Pip's sentences are short; this keeps it fast
    if not text:
        raise HTTPException(400, "No text")
    provider = _provider()
    if provider == "browser":
        raise HTTPException(503, "No voice installed (run: uv sync --extra voice) - using the browser voice")

    # Already made this exact sentence before? Then reuse it.
    if provider == "elevenlabs":
        voice_id = _eleven_settings(req.speaker)[1]
    else:
        voice_id = _piper_voice_name(req.language, req.speaker)
    name = hashlib.sha256(f"{provider}|{voice_id}|{text}".encode("utf-8")).hexdigest()[:32]
    for ext, media in ((".mp3", "audio/mpeg"), (".wav", "audio/wav")):
        cached = CACHE_DIR / f"{name}{ext}"
        if cached.is_file():
            return Response(cached.read_bytes(), media_type=media)

    audio, ext, media = None, ".mp3", "audio/mpeg"
    if provider == "elevenlabs":
        audio = _elevenlabs(text, req.speaker)
    if audio is None:                        # no ElevenLabs, or it failed: Piper
        audio, ext, media = _piper(text, req.language, req.speaker), ".wav", "audio/wav"
    if audio is None:
        raise HTTPException(503, "Voice not available - using the browser voice")

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    (CACHE_DIR / f"{name}{ext}").write_bytes(audio)
    return Response(audio, media_type=media)
