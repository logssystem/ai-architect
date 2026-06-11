'use client'

import { Check } from 'lucide-react'
import { STEP_LABELS } from '@/lib/system-prompt'
import { cn } from '@/lib/utils'

// Trilha vertical com as 10 etapas da sessão. Destaca a etapa atual e marca
// as concluídas.
export function StepProgress({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Progresso da sessão" className="flex flex-col gap-0.5">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1
        const isDone = step < currentStep
        const isCurrent = step === currentStep
        return (
          <div
            key={label}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors',
              isCurrent && 'bg-primary/10 text-foreground',
              !isCurrent && 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium',
                isDone &&
                  'border-primary bg-primary text-primary-foreground',
                isCurrent && 'border-primary text-primary',
                !isDone && !isCurrent && 'border-border',
              )}
            >
              {isDone ? <Check className="size-3" /> : step}
            </span>
            <span className={cn('truncate', isCurrent && 'font-medium')}>
              {label}
            </span>
          </div>
        )
      })}
    </nav>
  )
}
