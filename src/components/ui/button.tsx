import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-gold text-white hover:bg-gold-dark active:scale-[0.98]',
        outline:
          'border border-border bg-surface text-ink hover:bg-surface-2 active:scale-[0.98]',
        ghost:
          'text-ink hover:bg-surface-2 active:scale-[0.98]',
        link:
          'text-gold underline-offset-4 hover:underline p-0 h-auto',
        destructive:
          'bg-threat text-white hover:opacity-90 active:scale-[0.98]',
        secondary:
          'bg-surface-2 text-ink hover:bg-border active:scale-[0.98]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm:      'h-8 px-3 text-xs',
        lg:      'h-11 px-6 text-base',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
