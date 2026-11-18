FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV ESTIMATES_DB_PATH=/data/estimates.db
ENV ML_API_URL=http://ml-api:8000

EXPOSE 8001

HEALTHCHECK --interval=10s --timeout=5s --retries=10 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8001/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
