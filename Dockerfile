# Dockerfile - Backend FastAPI XELLE LIMS
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primero para aprovechar caché
COPY src/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del backend
COPY src/backend/ ./

# Copiar frontend para archivos estáticos
COPY src/frontend/ /app/static/

# Exponer puerto
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health', timeout=5)" || exit 1

# Comando para ejecutar
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
