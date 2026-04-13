# ---- Build frontend ----
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- Production image ----
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Data directory for SQLite
RUN mkdir -p /data
ENV DATABASE_URL=sqlite:////data/tmcms.db
ENV PORT=8000

EXPOSE 8000

# PORT env var support for Railway/Render
CMD uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}
