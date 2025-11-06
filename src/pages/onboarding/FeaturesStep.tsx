interface FeaturesStepProps {
  onNext: () => void;
  onPrev: () => void;
}

export function FeaturesStep({ onNext, onPrev }: FeaturesStepProps) {
  const features = [
    {
      title: "Website Blocking",
      description: "Automatically blocks distracting sites during sessions"
    },
    {
      title: "Focus Widget",
      description: "Always visible timer keeps you on track"
    },
    {
      title: "Session History",
      description: "Track your focus time and build consistency"
    },
    {
      title: "Zero Exceptions",
      description: "No way to bypass blocks once you start"
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-16 w-full max-w-2xl">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-white">
            Built for focus
          </h1>
        </div>
        <div className="w-full grid grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col gap-3"
            >
              <h3 className="text-lg font-semibold text-black dark:text-white">
                {feature.title}
              </h3>
              <p className="text-base text-black/60 dark:text-white/60 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 w-full justify-center mt-4">
          <button
            onClick={onPrev}
            className="px-8 py-3.5 text-sm font-semibold text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
          >
            Back
          </button>
          <button
            onClick={onNext}
            className="px-10 py-3.5 text-sm font-semibold rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
