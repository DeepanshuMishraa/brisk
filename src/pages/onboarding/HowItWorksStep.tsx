import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface HowItWorksStepProps {
  onNext: () => void;
  onPrev: () => void;
}

export function HowItWorksStep({ onNext, onPrev }: HowItWorksStepProps) {
  const steps = [
    "Set your goal",
    "Choose duration",
    "Block distracting sites",
    "Stay focused",
  ];

  return (
    <div className="flex flex-col items-center text-center py-8 min-h-0">
      <h1 className="text-4xl font-semibold text-gray-900 dark:text-white mb-4">
        How Focus Works
      </h1>
      <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-md">
        Four simple steps to maintain your focus
      </p>
      <div className="space-y-4 mb-8 w-full max-w-sm">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex items-center gap-4 text-left border border-gray-200 dark:border-gray-800 rounded-lg p-4"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-900 dark:border-white flex items-center justify-center">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {index + 1}
              </span>
            </div>
            <span className="text-gray-900 dark:text-white font-medium">
              {step}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <Button
          onClick={onPrev}
          variant="ghost"
          className="px-6 py-6 text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="px-8 py-6 text-base bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 border-0"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
