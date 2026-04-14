'use client'

import { cn } from '@/lib/utils'

const STEPS = [
  { number: 1, label: 'Your brand' },
  { number: 2, label: 'Competitors' },
  { number: 3, label: 'Channels' },
  { number: 4, label: 'Recipients' },
  { number: 5, label: 'Done' },
]

export function OnboardingProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const isDone    = step.number < currentStep
          const isActive  = step.number === currentStep
          const isPending = step.number > currentStep
          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isDone   && 'bg-gold text-white',
                    isActive && 'bg-ink text-paper',
                    isPending && 'bg-border text-muted'
                  )}
                >
                  {isDone ? '✓' : step.number}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium whitespace-nowrap',
                    isActive  ? 'text-ink' : 'text-muted'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-px flex-1 mx-2 mb-4 transition-colors',
                    step.number < currentStep ? 'bg-gold' : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
