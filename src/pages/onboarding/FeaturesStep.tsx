import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Globe, Minimize2, BarChart3, Shield } from "lucide-react";

interface FeaturesStepProps {
  onNext: () => void;
  onPrev: () => void;
}

export function FeaturesStep({ onNext, onPrev }: FeaturesStepProps) {
  const features = [
    {
      icon: Globe,
      text: "Block websites automatically",
    },
    {
      icon: Minimize2,
      text: "Minimal widget interface",
    },
    {
      icon: BarChart3,
      text: "Track your focus sessions",
    },
    {
      icon: Shield,
      text: "No distractions, no exceptions",
    },
  ];

  return (
    <div className="flex flex-col items-center text-center py-8 min-h-0">
      <h1 className="text-4xl font-semibold text-gray-900 dark:text-white mb-4">
        Features
      </h1>
      <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-md">
        Everything you need to stay focused
      </p>
      <div className="grid grid-cols-1 gap-4 mb-8 w-full max-w-md">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-4 text-left border border-gray-200 dark:border-gray-800 rounded-lg p-4"
            >
              <div className="flex-shrink-0">
                <Icon className="h-5 w-5 text-gray-900 dark:text-white" strokeWidth={1.5} />
              </div>
              <span className="text-gray-900 dark:text-white">
                {feature.text}
              </span>
            </div>
          );
        })}
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
