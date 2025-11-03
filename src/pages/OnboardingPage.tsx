import { useOnboardingStore } from "@/store/onboardingStore";
import { OnboardingLayout } from "@/components/OnboardingLayout";
import { WelcomeStep } from "./onboarding/WelcomeStep";
import { HowItWorksStep } from "./onboarding/HowItWorksStep";
import { FeaturesStep } from "./onboarding/FeaturesStep";
import { AuthorizationStep } from "./onboarding/AuthorizationStep";
import { motion, AnimatePresence } from "motion/react";

const TOTAL_STEPS = 4;

export function OnboardingPage() {
  const { currentStep, nextStep, prevStep } = useOnboardingStore();

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={nextStep} />;
      case 1:
        return <HowItWorksStep onNext={nextStep} onPrev={prevStep} />;
      case 2:
        return <FeaturesStep onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <AuthorizationStep onPrev={prevStep} />;
      default:
        return <WelcomeStep onNext={nextStep} />;
    }
  };

  return (
    <OnboardingLayout currentStep={currentStep} totalSteps={TOTAL_STEPS}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  );
}
