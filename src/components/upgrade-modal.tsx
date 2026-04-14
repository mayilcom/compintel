'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PLAN_LIMITS, UPGRADE_REASONS, type Plan } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────

export type UpgradeReason = 'competitors' | 'recipients' | 'channels' | 'brands' | 'seats'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  reason: UpgradeReason
  currentPlan: Plan
}

// ── Plan that unlocks each limit ──────────────────────────────
// For a given reason + current plan, determine the cheapest upgrade that helps.

const NEXT_PLAN: Record<Plan, Plan | null> = {
  trial:      'starter',
  starter:    'growth',
  growth:     'agency',
  agency:     'enterprise',
  enterprise: null,
}

const PLAN_NAMES: Record<Plan, string> = {
  trial:      'Trial',
  starter:    'Starter',
  growth:     'Growth',
  agency:     'Agency',
  enterprise: 'Enterprise',
}

// Limit values per plan (readable labels)
function limitLabel(plan: Plan, reason: UpgradeReason): string {
  if (plan === 'enterprise') return 'Unlimited'
  const limits = PLAN_LIMITS[plan]
  const value = limits[reason as keyof typeof limits]
  if (typeof value === 'number' && !isFinite(value)) return 'Unlimited'
  return value != null ? `${value}` : 'Unlimited'
}

// ── Component ─────────────────────────────────────────────────
export function UpgradeModal({ open, onClose, reason, currentPlan }: UpgradeModalProps) {
  const router = useRouter()
  const nextPlan = NEXT_PLAN[currentPlan]

  const reasonMessage = UPGRADE_REASONS[reason] ?? "You've reached a plan limit."

  const REASON_LABELS: Record<UpgradeReason, string> = {
    competitors: 'Competitors',
    recipients:  'Recipients',
    channels:    'Channels',
    brands:      'Brands',
    seats:       'Team seats',
  }

  function handleUpgrade() {
    onClose()
    if (nextPlan && nextPlan !== 'enterprise') {
      router.push(`/upgrade?reason=${reason}&plan=${nextPlan}`)
    } else {
      router.push(`/upgrade?reason=${reason}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to add more {REASON_LABELS[reason].toLowerCase()}</DialogTitle>
          <DialogDescription>{reasonMessage}</DialogDescription>
        </DialogHeader>

        {/* Plan comparison rows */}
        {nextPlan && (
          <div className="mt-4 rounded-[8px] border border-border overflow-hidden">
            {/* Current plan */}
            <div className="flex items-center justify-between px-4 py-3 bg-surface-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-muted font-mono uppercase tracking-widest">
                  Current — {PLAN_NAMES[currentPlan]}
                </span>
                <span className="text-sm text-muted">
                  {limitLabel(currentPlan, reason)} {REASON_LABELS[reason].toLowerCase()}
                </span>
              </div>
            </div>
            {/* Upgrade plan */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-gold-bg">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-gold-dark font-mono uppercase tracking-widest">
                  {PLAN_NAMES[nextPlan]}
                </span>
                <span className="text-sm text-ink font-medium">
                  {limitLabel(nextPlan, reason)} {REASON_LABELS[reason].toLowerCase()}
                </span>
              </div>
              <span className="text-[13px] text-gold-dark font-medium">
                {nextPlan === 'starter' && '₹999/mo'}
                {nextPlan === 'growth'  && '₹2,499/mo'}
                {nextPlan === 'agency'  && '₹5,999/mo'}
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Maybe later
          </Button>
          <Button onClick={handleUpgrade}>
            {nextPlan && nextPlan !== 'enterprise'
              ? `Upgrade to ${PLAN_NAMES[nextPlan]}`
              : 'View plans'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
