import { create } from "zustand";

interface SessionStore {
  goal: string;
  duration: number;
  timeLeft: number;
  blockedApps: string[];
  setSession: (goal: string, duration: number, blockedApps?: string[]) => void;
  updateTimeLeft: (timeLeft: number | ((prev: number) => number)) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  goal: "",
  duration: 0,
  timeLeft: 0,
  blockedApps: [],
  setSession: (goal, duration, blockedApps = []) => set({ goal, duration, timeLeft: duration, blockedApps }),
  updateTimeLeft: (timeLeft) => 
    set((state) => ({ 
      timeLeft: typeof timeLeft === 'function' ? timeLeft(state.timeLeft) : timeLeft 
    })),
  reset: () => set({ goal: "", duration: 0, timeLeft: 0, blockedApps: [] }),
}));

