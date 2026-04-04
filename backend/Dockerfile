# ── Base image ────────────────────────────────────────────────────────────────
FROM python:3.11-slim

# ── System deps ───────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── Working directory ─────────────────────────────────────────────────────────
WORKDIR /app

# ── Install Python deps ───────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Copy app ──────────────────────────────────────────────────────────────────
COPY app.py .

# ── Hugging Face Spaces requires port 7860 ────────────────────────────────────
ENV PORT=7860
ENV API_KEY=vocera_tts_key
ENV DEFAULT_VOICE=en-US-AvaNeural
ENV DEFAULT_RESPONSE_FORMAT=mp3
ENV DEFAULT_SPEED=1.0
ENV REQUIRE_API_KEY=True

EXPOSE 7860

# ── Health check ──────────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

# ── Start server ──────────────────────────────────────────────────────────────
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]