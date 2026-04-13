import { create } from "zustand";

const MAX_POINTS = 100;

export const useColdChainStore = create((set, get) => ({
  data: [],
  latestResult: {},
  alerts: [],
  pushPoint: (point, result) => {
    const nextData = [...get().data, { ...point, ...result }].slice(-MAX_POINTS);
    const nextAlerts = [...get().alerts];

    if (result.final_risk === "CRITICAL") {
      nextAlerts.unshift({
        id: `${point.timestamp}`,
        timestamp: point.timestamp,
        message: `CRITICAL risk at ${new Date(point.timestamp * 1000).toLocaleTimeString()}`,
      });
    }

    set({
      data: nextData,
      latestResult: result,
      alerts: nextAlerts.slice(0, 20),
    });
  },
  clearAlerts: () => set({ alerts: [] }),
}));
