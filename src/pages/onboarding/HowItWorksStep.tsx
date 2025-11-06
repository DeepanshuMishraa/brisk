interface HowItWorksStepProps {
  onNext: () => void;
  onPrev: () => void;
}

export function HowItWorksStep({ onNext, onPrev }: HowItWorksStepProps) {
  const steps = [
    "Set your intention",
    "Choose your duration",
    "Block distractions",
    "Do the work",
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-16 w-full max-w-xl">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-white">
            How it works
          </h1>
        </div>
        <div className="w-full flex flex-col gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-center gap-8"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black dark:bg-white flex-shrink-0">
                <span className="text-sm font-semibold text-white dark:text-black">
                  {index + 1}
                </span>
              </div>
              <span className="text-xl text-black dark:text-white">
                {step}
              </span>
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
