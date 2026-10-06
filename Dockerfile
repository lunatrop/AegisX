# Multi-stage security-hardened production Dockerfile
FROM python:3.11-slim as builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final minimal runtime image
FROM python:3.11-slim as runner

WORKDIR /app

ENV PATH=/root/.local/bin:$PATH \
    PYTHONPATH=/app/backend \
    PORT=8000

COPY --from=builder /root/.local /root/.local
COPY backend /app/backend

# Non-root security best practice
RUN groupadd -r aegisfin && useradd -r -g aegisfin aegisfin && \
    chown -R aegisfin:aegisfin /app
USER aegisfin

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
