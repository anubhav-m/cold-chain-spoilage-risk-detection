const RISK_COLOR = {
  NO: "bg-emerald-500 text-black",
  LOW: "bg-lime-400 text-black",
  MEDIUM: "bg-amber-400 text-black",
  CRITICAL: "bg-red-500 text-white",
};

const RISK_LABEL = {
  NO: "NO RISK",
  LOW: "LOW RISK",
  MEDIUM: "MEDIUM RISK",
  CRITICAL: "CRITICAL RISK",
};

export default function RiskBadge({ risk = "NO" }) {
  const colorClass = RISK_COLOR[risk] || "bg-slate-600";
  const label = RISK_LABEL[risk] || `${risk} RISK`;
  return (
    <span className={`rounded-md px-3 py-1 text-sm font-semibold shadow-sm ${colorClass}`}>
      {label}
    </span>
  );
}
