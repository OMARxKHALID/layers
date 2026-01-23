import React from "react";
const steps = ["Add", "Set", "Run", "Done"];

export const StepIndicator = ({ currentStep }) => {
  return (
    <div className="w-full flex justify-center py-8 select-none animate-fade-in relative z-50">
      <div className="flex items-center gap-8">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-2">
              <span
                className={`
                  text-[10px] font-bold uppercase tracking-[0.4em] transition-all duration-700 pixel-font
                  ${
                    index === currentStep
                      ? "text-gray-900 scale-110 drop-shadow-[0_0_12px_rgba(0,0,0,0.15)]"
                      : "text-gray-400/40"
                  }
                  ${index < currentStep ? "text-gray-900" : ""}
                `}
              >
                {step}
              </span>
              <div
                className={`w-1 h-1 rounded-full transition-all duration-700 ${index <= currentStep ? "bg-black scale-125 shadow-[0_0_8px_rgba(0,0,0,0.2)]" : "bg-black/10"}`}
              />
            </div>
            {index < steps.length - 1 && (
              <div className="w-12 h-[1px] bg-black/[0.04]" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
