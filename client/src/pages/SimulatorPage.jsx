import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { useColdChainStore } from "../store/useColdChainStore";
import RiskBadge from "../components/RiskBadge";
import Button from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";

const initialManual = {
  value: 5,
  humidity: 75,
  door_open: 0,
  fill_ratio: 0.7,
  vibration: 0.2,
};

export default function SimulatorPage() {
  const pushPoint = useColdChainStore((state) => state.pushPoint);
  const latestResult = useColdChainStore((state) => state.latestResult);

  const [mode, setMode] = useState("auto");
  const [manual, setManual] = useState(initialManual);
  const [autoLive, setAutoLive] = useState(initialManual);


  const currentRisk = latestResult?.final_risk || "NO";

  const autoSeed = useMemo(
    () => ({ temp: 5, humidity: 75, fill: 0.7, vibration: 0.2 }),
    []
  );

  const simulatedTimeRef = useRef(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(async () => {
      simulatedTimeRef.current += 300; // Fast forward 5 minutes.
      const currentSimulatedTime = simulatedTimeRef.current;

      let payload;
      if (mode === "auto") {
        const newDoorOpen = Math.random() > 0.9 ? 1 : 0;
        autoSeed.temp = Math.min(15, Math.max(-5, autoSeed.temp + (Math.random() - 0.45)));
        autoSeed.humidity = Math.min(
          100,
          Math.max(0, autoSeed.humidity + (Math.random() - 0.5) * 2)
        );
        
        if (newDoorOpen === 1) {
          autoSeed.fill = Math.min(1, Math.max(0, autoSeed.fill + (Math.random() - 0.5) * 0.02));
        }

        autoSeed.vibration = Math.min(
          1,
          Math.max(0, autoSeed.vibration + (Math.random() - 0.5) * 0.03)
        );

        payload = {
          timestamp: currentSimulatedTime,
          value: Number(autoSeed.temp.toFixed(2)),
          humidity: Number(autoSeed.humidity.toFixed(2)),
          door_open: newDoorOpen,
          fill_ratio: Number(autoSeed.fill.toFixed(2)),
          vibration: Number(autoSeed.vibration.toFixed(2)),
        };
        setAutoLive({
          value: payload.value,
          humidity: payload.humidity,
          door_open: payload.door_open,
          fill_ratio: payload.fill_ratio,
          vibration: payload.vibration,
        });
      } else {
        payload = {
          timestamp: currentSimulatedTime,
          ...manual,
        };
      }

      try {
        const { data: result } = await axios.post("/api/predict", payload);
        pushPoint(payload, result);


      } catch (err) {
        // Keep simulator running even if one request fails.
        console.error(err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, manual, pushPoint, autoSeed]);

  const setManualField = (key, value) => {
    setManual((prev) => ({ ...prev, [key]: value }));
  };
  const activeValues = mode === "auto" ? autoLive : manual;
  const controlsDisabled = mode === "auto";

  return (
    <>
      <Card className="flex-none p-4">
        <CardTitle className="mb-4">Simulator Controls</CardTitle>
        <div className="mb-4 flex gap-2">
          <Button
            onClick={() => setMode("auto")}
            variant={mode === "auto" ? "default" : "secondary"}
          >
            Auto
          </Button>
          <Button
            onClick={() => setMode("manual")}
            variant={mode === "manual" ? "default" : "secondary"}
          >
            Manual
          </Button>
        </div>

        {mode === "auto" ? (
          <div className="space-y-2">
            <MetricSlider label="Temperature (°C)" min={-5} max={15} step={0.1} value={activeValues.value} />
            <MetricSlider label="Humidity (%)" min={0} max={100} step={1} value={activeValues.humidity} />
            <MetricSlider label="Fill Ratio" min={0} max={1} step={0.01} value={activeValues.fill_ratio} />
            <MetricSlider label="Vibration" min={0} max={1} step={0.01} value={activeValues.vibration} />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-medium text-violet-100">Door Open</span>
              <span className={`text-sm font-bold ${activeValues.door_open ? "text-red-400" : "text-green-400"}`}>
                {activeValues.door_open ? "YES" : "NO"}
              </span>
            </div>
          </div>
        ) : (
          <>
            <Control
              label={`Temperature: ${activeValues.value} C`}
              min={-5}
              max={15}
              step={0.1}
              value={activeValues.value}
              onChange={(v) => setManualField("value", v)}
              disabled={controlsDisabled}
            />
            <Control
              label={`Humidity: ${activeValues.humidity}%`}
              min={0}
              max={100}
              step={1}
              value={activeValues.humidity}
              onChange={(v) => setManualField("humidity", v)}
              disabled={controlsDisabled}
            />
            <Control
              label={`Fill Ratio: ${activeValues.fill_ratio} ${activeValues.door_open === 0 ? "(Door Closed)" : ""}`}
              min={0}
              max={1}
              step={0.01}
              value={activeValues.fill_ratio}
              onChange={(v) => setManualField("fill_ratio", v)}
              disabled={controlsDisabled || activeValues.door_open === 0}
            />
            <Control
              label={`Vibration: ${activeValues.vibration}`}
              min={0}
              max={1}
              step={0.01}
              value={activeValues.vibration}
              onChange={(v) => setManualField("vibration", v)}
              disabled={controlsDisabled}
            />

            <label className="mt-2 flex items-center gap-3">
              <span className="text-sm font-medium text-violet-100">Door Open</span>
              <input
                type="checkbox"
                checked={activeValues.door_open === 1}
                onChange={(e) => setManualField("door_open", e.target.checked ? 1 : 0)}
                disabled={controlsDisabled}
                className="h-4 w-4 accent-violet-400"
              />
            </label>
          </>
        )}
      </Card>

      <Card className="flex-none p-4 flex flex-col items-center justify-center">
        <CardTitle className="mb-2 text-center">Live Status</CardTitle>

        <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-md border border-violet-800 bg-black px-3 py-1 text-sm font-semibold text-violet-200">
            MODE: {mode.toUpperCase()}
          </span>
          <RiskBadge risk={currentRisk} />
        </div>

        <div className="w-full max-w-md space-y-2">
          <MetricSlider
            label="Anomaly Score"
            value={Number(latestResult?.anomaly_score ?? 0)}
            min={0}
            max={1}
            step={0.01}
          />
          <MetricSlider
            label="Sustained Anomaly"
            value={Number(latestResult?.sustained_anomaly ?? 0)}
            min={0}
            max={1}
            step={1}
          />
          <MetricSlider
            label="RF Probability"
            value={Number(latestResult?.rf_probability ?? 0)}
            min={0}
            max={1}
            step={0.01}
          />

        </div>
      </Card>
    </>
  );
}

function Control({ label, min, max, step, value, onChange, disabled }) {
  return (
    <div className="mb-2">
      <label className="mb-1 block text-sm font-medium text-violet-100">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer rounded-lg disabled:opacity-70"
        disabled={disabled}
      />
    </div>
  );
}

function MetricSlider({ label, value, min, max, step }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-violet-100">{label}</span>
        <span className="text-sm text-violet-300">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="w-full rounded-lg opacity-90"
      />
    </div>
  );
}
