interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-20">
        <div className="relative">
          <img src="/brisk.png" alt="Brisq" className="w-24 h-24 select-none" />
        </div>
        <div className="flex flex-col items-center gap-8 max-w-lg">
          <h1 className="text-5xl font-semibold tracking-tight text-black dark:text-white">
            Welcome to Brisq
          </h1>
          <p className="text-xl leading-relaxed text-center text-black/70 dark:text-white/70">
            Deep work requires deep focus.
            <br />
            Block distractions. Stay in flow.
          </p>
        </div>
        <button
          onClick={onNext}
          className="mt-4 px-10 py-3.5 text-sm font-semibold rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
