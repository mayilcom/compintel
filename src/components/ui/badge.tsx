import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-gold-bg text-gold-dark',
        threat:      'bg-[#FDECEA] text-threat',
        watch:       'bg-[#FBF5E4] text-[#7A5E1A]',
        opportunity: 'bg-[#EBF7EE] text-opportunity',
        trend:       'bg-[#E6F1FB] text-trend',
        silence:     'bg-[#F0EDE4] text-silence',
        outline:     'border border-border text-muted bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
