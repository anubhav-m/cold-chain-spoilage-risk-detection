import {
  CartesianGrid,
  Dot,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useColdChainStore } from "../store/useColdChainStore";
import RiskBadge from "../components/RiskBadge";
import { Card, CardTitle } from "../components/ui/Card";

export default function DashboardPage() {
  const data = useColdChainStore((state) => state.data);
  const latestResult = useColdChainStore((state) => state.latestResult);

  return (
    <Card className="h-[70%] flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between flex-none">
        <CardTitle>Risk Dashboard</CardTitle>
        <RiskBadge risk={latestResult?.final_risk || "NO"} />
      </div>

      <div className="flex-1 min-h-0 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(t) => new Date(t * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
              tick={{ fill: "#ddd6fe", fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              domain={[-5, 15]}
              tick={{ fill: "#ddd6fe", fontSize: 12 }}
              label={{ value: "Temperature", angle: -90, position: "insideLeft", fill: "#ddd6fe", style: { textAnchor: "middle" } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 1]}
              tick={{ fill: "#ddd6fe", fontSize: 12 }}
              label={{ value: "Anomaly Score, Sustained Anomaly, RF Probability", angle: 90, position: "insideRight", fill: "#ddd6fe", style: { textAnchor: "middle" } }}
            />
            <Tooltip
              labelFormatter={(label) => new Date(label * 1000).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="value" name="Temperature" stroke="#22c55e" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="anomaly_score"
              name="Anomaly Score"
              stroke="#ef4444"
              dot={(props) => {
                const { payload } = props;
                const showMarker =
                  payload?.sustained_anomaly === 1 || payload?.final_risk === "CRITICAL";
                if (!showMarker) return <Dot {...props} r={0} />;
                return <Dot {...props} r={5} fill="#ef4444" stroke="#ef4444" />;
              }}
            />
            <Line yAxisId="right" type="stepAfter" dataKey="sustained_anomaly" name="Sustained Anomaly" stroke="#0ea5e9" strokeDasharray="3 3" dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="rf_probability" name="RF Probability" stroke="#eab308" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
