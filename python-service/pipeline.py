from __future__ import annotations

import warnings
from pathlib import Path
from typing import Dict

import joblib
import numpy as np
import pandas as pd
import torch
from anomalybert.inference.detector import AnomalyDetector

warnings.filterwarnings("ignore", message=".*sklearn.utils.parallel.delayed.*", category=UserWarning)

MODEL_PATH = Path(__file__).parent / "models" / "transformer_model.pt"
RF_MODEL_PATH = Path(__file__).parent / "models" / "rf_model_stratified.pkl"

THRESHOLD = 0.6
MEMORY_LIMIT = 3
WINDOW_SIZE = 10

FEATURE_COLUMNS = [
    "time_above_threshold",
    "temp_mean_c",
    "temp_max_c",
    "temp_min_c",
    "temp_std_c",
    "temp_recovery_rate",
    "temp_excess",
    "temp_deficit",
    "violation_count",
    "humidity_mean",
    "door_open_count",
    "fill_ratio",
    "vibration_index",
]


def validate_model_files() -> None:
    missing = [str(path) for path in (MODEL_PATH, RF_MODEL_PATH) if not path.exists()]
    if missing:
        raise FileNotFoundError(
            "Missing model file(s): " + ", ".join(missing)
        )


def _build_features(df: pd.DataFrame) -> pd.DataFrame:
    feature_df = df.copy()

    feature_df["temp_mean_c"] = feature_df["value"].rolling(WINDOW_SIZE).mean()
    feature_df["temp_max_c"] = feature_df["value"].rolling(WINDOW_SIZE).max()
    feature_df["temp_min_c"] = feature_df["value"].rolling(WINDOW_SIZE).min()
    feature_df["temp_std_c"] = feature_df["value"].rolling(WINDOW_SIZE).std()

    feature_df["temp_excess"] = np.maximum(feature_df["value"] - 8, 0)
    feature_df["temp_deficit"] = np.maximum(2 - feature_df["value"], 0)

    feature_df["violation"] = (
        (feature_df["value"] < 2) | (feature_df["value"] > 8)
    ).astype(int)
    feature_df["violation_count"] = feature_df["violation"].rolling(WINDOW_SIZE).sum()
    feature_df["time_above_threshold"] = feature_df["violation"].rolling(WINDOW_SIZE).sum()
    feature_df["temp_recovery_rate"] = feature_df["value"].diff().fillna(0)

    feature_df["humidity_mean"] = feature_df["humidity"].rolling(WINDOW_SIZE).mean()
    feature_df["door_open_count"] = feature_df["door_open"].rolling(WINDOW_SIZE).sum()
    feature_df["fill_ratio"] = feature_df["fill_ratio"]
    feature_df["vibration_index"] = feature_df["vibration"]

    feature_df.fillna(0, inplace=True)
    return feature_df


def _get_final_risk(
    value: float, anomaly_score: float, sustained_anomaly: int, rf_probability: float
) -> str:
    rule_violation = int(value < 2 or value > 8)
    final_score = anomaly_score + sustained_anomaly + rule_violation + rf_probability

    if final_score < 0.5:
        return "NO"
    if final_score < 1.5:
        return "LOW"
    if final_score < 2.5:
        return "MEDIUM"
    return "CRITICAL"


class PipelineRunner:
    def __init__(self) -> None:
        validate_model_files()
        self.detector = AnomalyDetector(str(MODEL_PATH))
        self.rf_model = joblib.load(RF_MODEL_PATH)

    def run_pipeline(self, buffer_df: pd.DataFrame) -> Dict[str, float | int | str]:
        df = buffer_df.copy().reset_index(drop=True)
        values = df["value"].to_numpy(dtype=np.float64)

        normalizer = self.detector.normalizer
        tokenizer = self.detector.tokenizer

        norm_values = (
            normalizer.transform(values)
            if normalizer is not None
            else values.astype(np.float32)
        )
        idx = np.arange(len(values), dtype=np.int64)
        windows = tokenizer.tokenize(idx, norm_values)

        window_scores = []
        with torch.no_grad():
            for w in windows:
                input_tensor = torch.tensor(w["values"], dtype=torch.float32).unsqueeze(0)
                scores = self.detector.model(input_tensor)
                window_scores.append(scores.squeeze(0).cpu().numpy())

        all_scores = tokenizer.aggregate_scores_simple(window_scores, total_len=len(values))
        df["anomaly_score"] = all_scores

        count = 0
        memory_flags: list[int] = []
        for score in df["anomaly_score"]:
            if score > THRESHOLD:
                count += 1
            else:
                count = 0
            memory_flags.append(1 if count >= MEMORY_LIMIT else 0)
        df["sustained_anomaly"] = memory_flags

        features_df = _build_features(df)
        rf_probs = self.rf_model.predict_proba(features_df[FEATURE_COLUMNS])[:, 1]
        features_df["rf_probability"] = rf_probs

        latest = features_df.iloc[-1]
        anomaly_score = float(latest["anomaly_score"])
        sustained_anomaly = int(latest["sustained_anomaly"])
        rf_probability = float(latest["rf_probability"])
        final_risk = _get_final_risk(
            value=float(latest["value"]),
            anomaly_score=anomaly_score,
            sustained_anomaly=sustained_anomaly,
            rf_probability=rf_probability,
        )

        return {
            "anomaly_score": round(anomaly_score, 4),
            "sustained_anomaly": sustained_anomaly,
            "rf_probability": round(rf_probability, 4),
            "final_risk": final_risk,
        }


_runner: PipelineRunner | None = None


def run_pipeline(buffer_df: pd.DataFrame) -> Dict[str, float | int | str]:
    global _runner
    if _runner is None:
        _runner = PipelineRunner()
    return _runner.run_pipeline(buffer_df)
