# Cold Chain Risk AI

Full-stack cold chain monitoring app with:
- React (Vite) frontend simulator + dashboard
- Node.js (Express) API gateway
- Python (FastAPI) ML microservice with multi-stage pipeline

## Project Structure

```text
cold-chain-risk-ai/
├── client/
├── server/
└── python-service/
```

## 1) Python ML Service

```bash
cd python-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Place model files in:
- `python-service/models/transformer_model.pt`
- `python-service/models/rf_model_stratified.pkl`

> NOTE: Due to its size (~1GB), the Random Forest model is hosted externally.

Download it from:

https://huggingface.co/anubhav-m/context-aware-risk-prediction-system-random-forest/tree/main

After downloading:

- Place the file inside:
  
  ```
  ./python-service/models/
  ```
  
- Do NOT rename the file

API:
- `POST /predict`
- `GET /health`

## 2) Node API Gateway

```bash
cd server
copy .env.example .env
npm install
npm run dev
```

API:
- `POST /api/predict`
- `GET /health`

`PYTHON_API` defaults to `http://localhost:8000`

## 3) Frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`

## Features Implemented

- Real-time simulator every 5 second
- Auto mode (drift-based) and manual mode (sliders/toggle)
- Zustand store:
  - `data`
  - `latestResult`
  - `alerts`
- Dashboard:
  - temperature graph
  - anomaly score graph
  - anomaly markers (red dots)
  - color-coded risk badge (`NO`, `LOW`, `MEDIUM`, `CRITICAL`)
  - alert panel
- Critical alerts:
  - alert panel entry
  - popup (`window.alert`)

## Expected Risk Behavior

- Small fluctuations should mostly stay in `NO` or `LOW`
- Sustained anomalies increase to `MEDIUM`
- Severe sustained conditions trend to `CRITICAL`
