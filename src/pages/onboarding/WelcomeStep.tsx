import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center text-center py-8 min-h-0">
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl border border-gray-900 dark:border-white flex items-center justify-center">
          <span className="text-3xl font-semibold text-gray-900 dark:text-white">F</span>
        </div>
      </div>
      <h1 className="text-4xl font-semibold text-gray-900 dark:text-white mb-4">
        Welcome to Focus
      </h1>
      <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md leading-relaxed mb-8">
        A minimal focus session tool to help you stay productive and eliminate distractions
      </p>
      <Button
        onClick={onNext}
        className="px-8 py-6 text-base bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 border-0"
      >
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
