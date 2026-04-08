import os
import io
import logging
import asyncio
import edge_tts
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Config from env ───────────────────────────────────────────────────────────
API_KEY          = os.getenv("EDGE_TTS_API_KEY", "vocera_tts_key")
DEFAULT_VOICE    = os.getenv("DEFAULT_VOICE", "en-US-AvaNeural")
DEFAULT_FORMAT   = os.getenv("DEFAULT_RESPONSE_FORMAT", "mp3")
DEFAULT_SPEED    = float(os.getenv("DEFAULT_SPEED", "1.0"))
REQUIRE_API_KEY  = os.getenv("REQUIRE_API_KEY", "True").lower() == "true"

# ── OpenAI voice → Edge TTS voice map ────────────────────────────────────────
VOICE_MAP: dict[str, str] = {
    "alloy":   "en-US-AvaNeural",
    "echo":    "en-US-AndrewNeural",
    "fable":   "en-GB-SoniaNeural",
    "onyx":    "en-US-EricNeural",
    "nova":    "en-US-JennyNeural",
    "shimmer": "en-US-EmmaNeural",
}

# ── Format → MIME type map ────────────────────────────────────────────────────
MIME_MAP: dict[str, str] = {
    "mp3":  "audio/mpeg",
    "opus": "audio/opus",
    "aac":  "audio/aac",
    "flac": "audio/flac",
    "wav":  "audio/wav",
    "pcm":  "audio/pcm",
}

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Edge TTS — OpenAI Compatible API",
    description="Free TTS API powered by Microsoft Edge TTS",
    version="1.0.0",
)

security = HTTPBearer(auto_error=False)


def verify_api_key(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    if not REQUIRE_API_KEY:
        return True
    if credentials is None or credentials.credentials != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
    return True


# ── Request schema (OpenAI-compatible) ───────────────────────────────────────
class TTSRequest(BaseModel):
    model: str = "tts-1"              # ignored — kept for OpenAI compatibility
    input: str
    voice: str = DEFAULT_VOICE
    response_format: str = DEFAULT_FORMAT
    speed: float = DEFAULT_SPEED


# ── Helpers ───────────────────────────────────────────────────────────────────
def resolve_voice(voice: str) -> str:
    """Map OpenAI voice name → Edge TTS voice. Pass through if already an Edge voice."""
    return VOICE_MAP.get(voice.lower(), voice)


def speed_to_rate(speed: float) -> str:
    """Convert OpenAI speed (0.25–4.0) to Edge TTS rate string (+25%, -10%, etc.)."""
    percentage = round((speed - 1.0) * 100)
    if percentage >= 0:
        return f"+{percentage}%"
    return f"{percentage}%"


async def synthesize(text: str, voice: str, rate: str) -> bytes:
    """Generate audio bytes using edge_tts."""
    communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate)
    audio_chunks: list[bytes] = []

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])

    if not audio_chunks:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Edge TTS returned no audio. Try a different voice or shorter text.",
        )

    return b"".join(audio_chunks)


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Vocera AI Edge-TTS API is running!", "status": "active"}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "edge-tts"}


@app.get("/v1/models")
async def list_models(_: bool = Depends(verify_api_key)):
    return {
        "object": "list",
        "data": [
            {"id": "tts-1",    "object": "model"},
            {"id": "tts-1-hd", "object": "model"},
        ],
    }


@app.get("/v1/voices")
async def list_voices(_: bool = Depends(verify_api_key)):
    voices = await edge_tts.list_voices()
    return {"voices": voices}


@app.post("/v1/audio/speech")
async def text_to_speech(
    body: TTSRequest,
    _: bool = Depends(verify_api_key),
):
    edge_voice = resolve_voice(body.voice)
    rate       = speed_to_rate(body.speed)
    mime_type  = MIME_MAP.get(body.response_format, "audio/mpeg")

    logger.info(f"TTS request → voice={edge_voice}, format={body.response_format}, chars={len(body.input)}")

    audio_bytes = await synthesize(body.input, edge_voice, rate)

    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type=mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="speech.{body.response_format}"',
            "Content-Length": str(len(audio_bytes)),
        },
    )