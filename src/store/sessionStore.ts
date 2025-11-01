import { create } from "zustand";

interface SessionStore {
  goal: string;
  duration: number;
  timeLeft: number;
  setSession: (goal: string, duration: number) => void;
  updateTimeLeft: (timeLeft: number | ((prev: number) => number)) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  goal: "",
  duration: 0,
  timeLeft: 0,
  setSession: (goal, duration) => set({ goal, duration, timeLeft: duration }),
  updateTimeLeft: (timeLeft) => 
    set((state) => ({ 
      timeLeft: typeof timeLeft === 'function' ? timeLeft(state.timeLeft) : timeLeft 
    })),
  reset: () => set({ goal: "", duration: 0, timeLeft: 0 }),
}));

