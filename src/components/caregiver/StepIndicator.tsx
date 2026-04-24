interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const step = idx + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors
                  ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                  }
                `}
              >
                {isCompleted ? "✓" : step}
              </div>
              {step < totalSteps && (
                <div
                  className={`
                    flex-1 h-1 mx-2 rounded transition-colors
                    ${
                      isCompleted
                        ? "bg-primary"
                        : "bg-secondary"
                    }
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        Paso {currentStep} de {totalSteps}
      </p>
    </div>
  );
}
