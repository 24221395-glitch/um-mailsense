# Build from the repo root: docker build -f backend/Dockerfile .
FROM python:3.11-slim
WORKDIR /srv
COPY ai ./ai
COPY backend ./backend
WORKDIR /srv/backend
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
