import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
interface StepperProps {
  steps: string[];
  currentStep: number;
}
export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step} className={cn('relative', stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : '')}>
            {stepIdx < currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-primary" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary"
                >
                  <Check className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                </div>
              </>
            ) : stepIdx === currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background"
                  aria-current="step"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-background"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-transparent"
                    aria-hidden="true"
                  />
                </div>
              </>
            )}
             <p className="absolute -bottom-6 w-max text-center text-xs font-medium text-muted-foreground" style={{ transform: 'translateX(-50%)', left: '50%' }}>
                {step}
            </p>
          </li>
        ))}
      </ol>
    </nav>
  );
}