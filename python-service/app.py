from collections import deque
from typing import Deque, Dict, List

import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from pipeline import run_pipeline, validate_model_files


class SensorInput(BaseModel):
    timestamp: int = Field(..., description="Epoch timestamp")
    value: float = Field(..., description="Temperature value")
    humidity: float = Field(..., ge=0, le=100)
    door_open: int = Field(..., ge=0, le=1)
    fill_ratio: float = Field(..., ge=0, le=1)
    vibration: float = Field(..., ge=0)


app = FastAPI(title="Cold Chain ML Service")
buffer: Deque[Dict[str, float | int]] = deque(maxlen=50)


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def startup_validation() -> None:
    validate_model_files()


@app.post("/predict")
def predict(payload: SensorInput) -> Dict[str, float | int | str]:
    try:
        buffer.append(payload.model_dump())
        rows: List[Dict[str, float | int]] = list(buffer)
        buffer_df = pd.DataFrame(rows)

        result = run_pipeline(buffer_df)
        return result
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc)) from exc
