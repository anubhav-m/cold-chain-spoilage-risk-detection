import { useState } from "react";
import SimulatorPage from "./pages/SimulatorPage";
import DashboardPage from "./pages/DashboardPage";
import { useColdChainStore } from "./store/useColdChainStore";

export default function App() {
  const [showNotifications, setShowNotifications] = useState(false);
  const alerts = useColdChainStore((state) => state.alerts);
  const clearAlerts = useColdChainStore((state) => state.clearAlerts);

  return (
    <div className="mx-auto h-screen max-w-[1400px] flex flex-col overflow-hidden p-4">
      <header className="mb-4 flex-none rounded-xl border border-violet-700 bg-black p-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-violet-300">Cold Chain Monitoring</h1>
          <p className="text-sm text-violet-100/90">
            AI-based system for predicting spoilage risk in cold-chain logistics using temperature, duration, and environmental data.
          </p>
        </div>

        {/* Notifications Top Right */}
        <div className="relative mt-1">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-violet-300 transition-colors hover:text-violet-100 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {alerts.length > 0 && (
              <span className="absolute right-0 top-0 inline-flex flex-shrink-0 items-center justify-center h-5 w-5 rounded-full border-2 border-black bg-red-500 text-[10px] font-bold text-white">
                {alerts.length > 99 ? "99+" : alerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-lg border border-violet-700 bg-black p-3 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-violet-300">Notifications</h3>
                <button onClick={clearAlerts} className="text-xs text-violet-400 hover:underline">
                  Clear all
                </button>
              </div>
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {alerts.length === 0 ? (
                  <p className="py-4 text-center text-xs text-violet-100/60">No pending alerts.</p>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="rounded border border-red-500 bg-red-950/20 p-2">
                      <p className="text-xs text-red-400">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Single Page Content */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-4 pb-2">
        {/* Left Column: Simulator & Live Status */}
        <div className="h-full overflow-y-auto custom-scrollbar flex flex-col space-y-4">
          <SimulatorPage />
        </div>

        {/* Right Column: Dashboard Chart */}
        <div className="h-full min-w-0 overflow-hidden">
          <DashboardPage />
        </div>
      </div>
    </div>
  );
}
