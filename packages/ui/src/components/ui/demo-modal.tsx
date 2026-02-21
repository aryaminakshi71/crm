"use client";

import * as React from "react";
import { Button } from "./button";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName: string;
  demoContent?: React.ReactNode;
}

export const DemoModal: React.FC<DemoModalProps> = ({
  isOpen,
  onClose,
  appName,
  demoContent,
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultDemoSteps = [
    {
      title: "Welcome to " + appName,
      description:
        "Discover the powerful features that make this platform unique.",
      image: "🎯",
    },
    {
      title: "Real-Time Updates",
      description:
        "Experience instant updates and live collaboration features.",
      image: "⚡",
    },
    {
      title: "Advanced Analytics",
      description: "Get insights with comprehensive dashboards and reports.",
      image: "📊",
    },
    {
      title: "AI-Powered Features",
      description: "Leverage artificial intelligence for smarter workflows.",
      image: "🤖",
    },
  ];

  const steps = demoContent ? [] : defaultDemoSteps;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      setCurrentStep(steps.length - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-foreground shadow-2xl">
        <div className="flex items-center justify-between border-border border-b p-6">
          <h2 className="font-bold text-2xl text-background">{appName} Demo</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-background"
            aria-label="Close demo"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {demoContent ? (
            demoContent
          ) : (
            <div className="text-center">
              <div className="mb-6 animate-bounce text-8xl">
                {steps[currentStep]?.image}
              </div>
              <h3 className="mb-4 font-bold text-3xl text-background">
                {steps[currentStep]?.title}
              </h3>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                {steps[currentStep]?.description}
              </p>

              <div className="mt-8 rounded-lg border border-border bg-foreground/90 p-8">
                <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/90">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-card bg-opacity-20">
                      <svg
                        className="h-10 w-10 text-background"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-background">
                      Interactive Demo Video
                    </p>
                    <p className="mt-2 text-background text-sm opacity-75">
                      Experience the full power of {appName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-border border-t p-6">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep ? "bg-primary" : "bg-muted/80"
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handlePrev}
              disabled={steps.length === 0}
            >
              Previous
            </Button>
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={steps.length === 0}
            >
              {currentStep === steps.length - 1 ? "Restart" : "Next"}
            </Button>
            <Button variant="primary" onClick={onClose}>
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
