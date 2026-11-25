# Harbor Housing

Demo for estimating a home's price and exploring a small housing market. One linear regression model is shared by a property estimator and a market analysis API. A web portal sits in front of both.

The model trains on `data/house_prices.csv` when the model service starts. Each row has an `id` (ignored by the model), seven features, and a `price`. The features are `square_footage`, `bedrooms`, `bathrooms`, `year_built`, `lot_size`, `distance_to_city_center`, and `school_rating`. `bathrooms` is a float, so values such as `1.5` and `2.5` are valid.

## Services

| Service | Stack | Port | Role |
| --- | --- | --- | --- |
| `web` | Next.js | 3010 | Portal at `/`, `/estimator`, and `/market` |
| `ml-api` | Python, FastAPI, scikit-learn | 8000 | Trains the model and serves predictions |
| `estimator-api` | Python, FastAPI | 8001 | Calls the model, stores estimates in SQLite, and compares them |
| `market-api` | Java 21, Spring Boot | 8080 | Summarizes the sample dataset and runs what-if predictions |

The browser talks to the Next.js app. The estimator and what-if forms call the portal routes under `/api`, which proxy to the Python and Java services. Page loads on `/` and `/market` call those services directly from the server.

## Run the stack

From the repository root:

```bash
docker compose up --build
```

Then open [http://localhost:3010](http://localhost:3010).

- **Value estimator** (`/estimator`) submits a property, stores the prediction, and compares two to four saved estimates.
- **Market analysis** (`/market`) filters the sample, groups prices, and varies one feature to see how the predicted price moves.

Stop the stack with `docker compose down`. Estimate history is kept in the `estimates` volume. `docker compose down -v` deletes that volume.

## Run locally

Use this while developing. Each process reloads or restarts on its own, and the ports match Compose. Stop the Compose stack first so ports `8000`, `8001`, `8080`, and `3010` are free:

```bash
docker compose stop
```

One-time setup. Python 3.12, JDK 21, Maven, and Node.js are required. Each Python service has its own virtualenv.

```bash
python -m venv ml-api\.venv
ml-api\.venv\Scripts\python.exe -m pip install -r ml-api\requirements.txt

python -m venv estimator-api\.venv
estimator-api\.venv\Scripts\python.exe -m pip install -r estimator-api\requirements.txt

npm install --prefix web
```

Start each service in its own terminal:

```bash
# model, from ml-api
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The model service finds `data/house_prices.csv` at the repository root.

```bash
# estimator, from estimator-api
.\.venv\Scripts\Activate.ps1
export ML_API_URL="http://127.0.0.1:8000"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Saved estimates go to `data/estimates.db`.

```bash
# market, from market-api
export ML_API_URL="http://127.0.0.1:8000"
mvn spring-boot:run
```

```bash
# portal, from web
npm run dev
```

Then open [http://localhost:3010](http://localhost:3010). Saving a Python file restarts that API. Saving a portal file refreshes the browser. Restart `mvn spring-boot:run` after a Java change.

From Cursor, run the task **all services** (Terminal → Run Task), or start **All services** from Run and Debug. The debug configurations are `ML API`, `Estimator API`, `Market API`, and `Web`. Those Python launches use `ml-api/.venv` and `estimator-api/.venv`. Run the model tests with `ml-api\.venv\Scripts\python.exe -m pytest` from `ml-api`. The Market API configuration needs the Java extension. When editing a Python file, choose that service's interpreter with Python: Select Interpreter.

Python APIs also publish interactive docs:

- [http://localhost:8000/docs](http://localhost:8000/docs)
- [http://localhost:8001/docs](http://localhost:8001/docs)

## API paths

JSON fields use snake_case on every service.

### Model API (`http://localhost:8000`)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service and model status |
| `GET` | `/model-info` | Feature coefficients, intercept, and R², MAE, RMSE |
| `POST` | `/predict` | Price for one property, or a batch under `instances` (1–500 rows) |

A single prediction:

```bash
curl -s http://localhost:8000/predict \
  -H "content-type: application/json" \
  -d "{\"square_footage\":1550,\"bedrooms\":3,\"bathrooms\":2,\"year_built\":1997,\"lot_size\":6800,\"distance_to_city_center\":4.1,\"school_rating\":7.6}"
```

A batch uses the same feature object inside `instances`:

```json
{
  "instances": [
    {
      "square_footage": 1550,
      "bedrooms": 3,
      "bathrooms": 2,
      "year_built": 1997,
      "lot_size": 6800,
      "distance_to_city_center": 4.1,
      "school_rating": 7.6
    }
  ]
}
```

Accepted ranges: `square_footage` 0–100000, `bedrooms` 0–20, `bathrooms` 0–20, `year_built` 1800–2100, `lot_size` 0–1000000, `distance_to_city_center` 0–100, `school_rating` 0–10. `square_footage` and `lot_size` must be greater than 0.

### Estimator API (`http://localhost:8001`)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service status |
| `POST` | `/estimates` | Predict a property, store it, and return the price plus per-feature contributions |
| `GET` | `/estimates` | Saved estimates, newest first |
| `POST` | `/estimates/compare` | Compare 2–4 saved estimates by id |

`POST /estimates` takes the same feature fields as `/predict`, plus an optional `label` (max 80 characters).

```bash
curl -s http://localhost:8001/estimates \
  -H "content-type: application/json" \
  -d "{\"label\":\"Sample\",\"square_footage\":1550,\"bedrooms\":3,\"bathrooms\":2,\"year_built\":1997,\"lot_size\":6800,\"distance_to_city_center\":4.1,\"school_rating\":7.6}"
```

```bash
curl -s http://localhost:8001/estimates/compare \
  -H "content-type: application/json" \
  -d "{\"ids\":[1,2]}"
```

The compare response includes each estimate, `highest_id`, `lowest_id`, and `price_spread`. Unknown ids return 404. If the model service is down, estimate creation returns 503.

### Market API (`http://localhost:8080`)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Service status |
| `GET` | `/api/market/summary` | Sample size, price range, and median features |
| `GET` | `/api/market/properties` | Filtered, sorted properties from the CSV |
| `GET` | `/api/market/stats` | Price segments grouped by `bedrooms`, `decade`, or `school_band` |
| `POST` | `/api/market/what-if` | Predict a baseline, then a range of one feature |
| `GET` | `/api/market/cache` | Cache hit and miss counts |

`GET /api/market/properties` accepts `bedrooms`, `minYear`, `maxYear`, `minPrice`, `maxPrice`, `minSchool`, `maxDistance`, `sort`, and `dir`. `sort` is one of `id`, `price`, `square_footage`, `bedrooms`, `bathrooms`, `year_built`, `lot_size`, `distance_to_city_center`, or `school_rating`. `dir` is `asc` (default) or `desc`.

```bash
curl -s "http://localhost:8080/api/market/properties?bedrooms=3&sort=price&dir=desc"
curl -s "http://localhost:8080/api/market/stats?groupBy=decade"
```

`POST /api/market/what-if` keeps `baseline` fixed and varies `vary` from `start` to `end` across `steps` points (`steps` is 2–21).

```bash
curl -s http://localhost:8080/api/market/what-if \
  -H "content-type: application/json" \
  -d "{\"baseline\":{\"square_footage\":1550,\"bedrooms\":3,\"bathrooms\":2,\"year_built\":1997,\"lot_size\":6800,\"distance_to_city_center\":4.1,\"school_rating\":7.6},\"vary\":\"square_footage\",\"start\":1200,\"end\":2200,\"steps\":5}"
```

### Portal routes (`http://localhost:3010`)

These are the paths the browser calls. They forward the JSON body to the service behind them.

| Method | Path | Forwards to |
| --- | --- | --- |
| `GET`, `POST` | `/api/estimates` | `GET` or `POST /estimates` on the estimator API |
| `POST` | `/api/estimates/compare` | `POST /estimates/compare` |
| `POST` | `/api/market/what-if` | `POST /api/market/what-if` |
