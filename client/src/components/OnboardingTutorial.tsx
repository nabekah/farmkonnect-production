import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronRight, ChevronLeft, X } from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to FarmKonnect",
    description: "Let's set up your farm profile and get you started with managing your agricultural operations.",
    icon: "🌾",
  },
  {
    id: "farm-setup",
    title: "Set Up Your Farm",
    description: "Create your first farm by providing basic information like location, size, and type of farming you do.",
    icon: "🚜",
    action: "/farms",
  },
  {
    id: "crop-tracking",
    title: "Track Your Crops",
    description: "Monitor your crop cycles, soil health, fertilizer applications, and yields all in one place.",
    icon: "🌱",
    action: "/crops",
  },
  {
    id: "livestock",
    title: "Manage Livestock",
    description: "Keep track of your animals, health records, breeding, and feeding schedules.",
    icon: "🐄",
    action: "/livestock",
  },
  {
    id: "marketplace",
    title: "Access Marketplace",
    description: "Buy and sell agricultural products, connect with other farmers, and grow your business.",
    icon: "🏪",
    action: "/marketplace",
  },
  {
    id: "weather",
    title: "Check Weather Insights",
    description: "Get real-time weather data and recommendations for your crops and livestock.",
    icon: "⛅",
    action: "/weather",
  },
];

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingTutorial({ isOpen, onClose, onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("onboarding_tutorial_seen");
    setHasSeenTutorial(!!seen);
  }, []);

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding_tutorial_seen", "true");
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_tutorial_seen", "true");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Getting Started with FarmKonnect</DialogTitle>
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="py-6">
          {/* Step indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Step {currentStep + 1} of {tutorialSteps.length}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step content */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">{step.icon}</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "bg-green-500 w-6"
                    : "bg-gray-300 dark:bg-gray-600 w-2"
                }`}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <Button
            variant="outline"
            onClick={handleSkip}
            className="text-gray-600 dark:text-gray-400"
          >
            Skip
          </Button>

          <Button
            onClick={handleNext}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            {isLastStep ? "Complete" : "Next"}
            {!isLastStep && <ChevronRight className="h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
