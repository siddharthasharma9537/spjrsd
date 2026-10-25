# spjrsd backend on Google Cloud Run. Deploy notes: docs/deploy/CLOUD_RUN.md.
# Build context is this folder (backend/).
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /srv

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Cloud Run sets PORT; 8080 is its default. The app reads MONGO_URL and its other settings
# from the environment while importing, so they must be set on the service (docs/deploy/CLOUD_RUN.md).
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
