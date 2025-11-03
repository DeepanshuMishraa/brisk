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
    <div className="h-screen w-full flex flex-col bg-white dark:bg-black overflow-hidden">
      <div className="flex-1 flex items-center justify-center overflow-y-auto py-8">
        <div className="w-full max-w-2xl mx-auto px-8">
          <div className="flex flex-col items-center">
            {/* Content */}
            <div className="w-full">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicators - Fixed at bottom */}
      <div className="flex-shrink-0 pb-8 flex justify-center">
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "bg-gray-900 dark:bg-white w-6"
                  : "bg-gray-300 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
