import { ReactNode } from "react";

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
}

export function OnboardingLayout({ 
  children, 
  currentStep, 
  totalSteps 
}: OnboardingLayoutProps) {
  return (
    <div className="h-screen w-full flex flex-col bg-white dark:bg-black">
      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto px-12">
          {children}
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex-shrink-0 pb-16 flex justify-center">
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "bg-black dark:bg-white scale-100"
                  : "bg-black/20 dark:bg-white/20 scale-75"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
