# SAEDGE Embodied AI Studio - backend image (Jetson Orin Nano Super / x86_64)
FROM python:3.11-slim

WORKDIR /app

ENV SAEDGE_SIMULATION=true \
    SAEDGE_HOST=0.0.0.0 \
    SAEDGE_PORT=8000 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libssl-dev libffi-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Application code
COPY backend ./backend
COPY config ./config

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
