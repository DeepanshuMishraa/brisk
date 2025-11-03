import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  isOnboarded: boolean;
  currentStep: number;
  authorizationCompleted: boolean;
  setOnboarded: (value: boolean) => void;
  setCurrentStep: (step: number) => void;
  setAuthorizationCompleted: (value: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      isOnboarded: false,
      currentStep: 0,
      authorizationCompleted: false,
      
      setOnboarded: (value: boolean) => set({ isOnboarded: value }),
      
      setCurrentStep: (step: number) => set({ currentStep: step }),
      
      setAuthorizationCompleted: (value: boolean) => 
        set({ authorizationCompleted: value }),
      
      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < 3) {
          set({ currentStep: currentStep + 1 });
        }
      },
      
      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },
      
      reset: () => set({ 
        isOnboarded: false, 
        currentStep: 0, 
        authorizationCompleted: false 
      }),
    }),
    {
      name: "focus-onboarding",
    }
  )
);
