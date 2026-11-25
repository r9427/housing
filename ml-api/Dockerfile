FROM python:3.12-slim

WORKDIR /app

COPY ml-api/requirements.txt .
# Large wheels such as SciPy often arrive truncated on a slow connection, and pip
# then reports a hash mismatch. Keep the download cache and retry the install.
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --retries 10 --timeout 120 -r requirements.txt \
    || pip install --retries 10 --timeout 120 -r requirements.txt \
    || pip install --retries 10 --timeout 120 -r requirements.txt

COPY ml-api/app ./app
COPY data/house_prices.csv ./data/house_prices.csv

ENV HOUSING_DATA_PATH=/app/data/house_prices.csv

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --retries=10 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
