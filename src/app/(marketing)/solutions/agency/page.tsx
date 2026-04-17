import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Mayil for Agencies — Solutions',
  description: 'Run competitive intelligence for all your clients from one workspace. Separate briefs, shared team access, custom domain sending.',
}

const SIGNALS = [
  { type: 'threat' as const, channel: 'Meta Ads', headline: 'Client A\'s top competitor launched 18 new Meta ads', body: 'Creative theme shift to "trusted by 1 lakh customers". Budget up 3× vs last month. Client A\'s brief flagged this Sunday — Monday pitch prep sorted.' },
  { type: 'opportunity' as const, channel: 'Amazon', headline: 'Client B\'s rival hero SKU dropped to 3.9 stars', body: '52 new 1-star reviews citing delivery delays. Client B\'s sales team alerted. Brief included recommended talking points for trade partners.' },
  { type: 'watch' as const, channel: 'Instagram', headline: 'Client C\'s category seeing 40% more influencer activity', body: 'Nano-influencer campaigns from 3 competitors in the same week. Paid push likely within 3 weeks. Flagged in Client C\'s brief with suggested counter-strategy.' },
]

const VARIANT_MAP = {
  threat: { bar: 'border-l-4 border-threat bg-[#FDECEA]', badge: 'threat' as const },
  opportunity: { bar: 'border-l-4 border-opportunity bg-[#EBF7EE]', badge: 'opportunity' as const },
  watch: { bar: 'border-l-4 border-watch bg-[#FBF5E4]', badge: 'watch' as const },
}

const USE_CASES = [
  { title: 'Walk into every client meeting with a competitive update', body: 'Each client\'s brief arrives Sunday at 7am. Your team reviews before Monday. You\'re the agency that always knows what the competition did last week.' },
  { title: 'Spot category shifts before your clients do', body: 'When three clients in the same category show similar competitor signals, you\'re seeing a market shift early. That\'s the kind of strategic call that wins retainers.' },
  { title: 'White-label briefs under your domain', body: 'Briefs send from your agency domain. Your clients see your branding — not ours. Configurable per client with custom sender name and reply-to.' },
]

const WORKSPACE_FEATURES = [
  { title: 'Separate workspaces per client', body: 'Each client has isolated brand settings, competitor lists, and brief history. No bleed between accounts.' },
  { title: 'Team access with role controls', body: 'Add account managers to specific client workspaces. Senior team members can access all clients. Permissions are per-workspace.' },
  { title: 'Custom brief cadence per client', body: 'Weekly for active clients, fortnightly for retained-but-quiet ones. Delivery day and time configurable per workspace.' },
  { title: 'Dedicated solutions manager', body: 'One point of contact who knows your client roster. Onboarding new clients, changing brief structure, priority support — all through one person.' },
]

export default function AgencySolutionPage() {
  return (
    <div className="min-h-screen bg-paper font-body">

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <Link href="/solutions" className="text-[12px] text-muted hover:text-ink transition-colors mb-6 block">← All solutions</Link>
        <p className="label-section mb-3">Agencies</p>
        <h1 className="font-display text-4xl text-ink leading-tight mb-6 max-w-3xl">
          Competitive intelligence for every client — from one workspace.
        </h1>
        <p className="text-[15px] text-muted leading-relaxed max-w-2xl mb-8">
          Running competitive tracking for 10 clients manually is a Friday afternoon nobody has.
          Mayil gives your agency one workspace to manage all clients — separate briefs, shared team access, and white-label sending under your domain.
        </p>
        <Link href="/contact"><Button size="lg">See a demo for your agency →</Button></Link>
      </section>

      {/* Sample signals */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="label-section mb-3">What lands in your brief</p>
          <h2 className="font-display text-2xl text-ink mb-10">Client signals, ready for Monday.</h2>
          <div className="flex flex-col gap-4 max-w-2xl">
            {SIGNALS.map(s => (
              <div key={s.headline} className={`rounded-r-[10px] p-4 ${VARIANT_MAP[s.type].bar}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={VARIANT_MAP[s.type].badge}>{s.type.charAt(0).toUpperCase() + s.type.slice(1)}</Badge>
                  <span className="text-xs text-muted">{s.channel}</span>
                </div>
                <p className="text-sm font-semibold text-ink">{s.headline}</p>
                <p className="text-[13px] text-muted mt-1">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workspace features */}
      <section className="border-t border-border bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="label-section mb-3">Built for agencies</p>
          <h2 className="font-display text-2xl text-ink mb-10">Everything you need to run it at scale.</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {WORKSPACE_FEATURES.map(f => (
              <div key={f.title} className="rounded-[10px] border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-ink mb-2">{f.title}</h3>
                <p className="text-[13px] text-muted leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="label-section mb-3">Use cases</p>
          <h2 className="font-display text-2xl text-ink mb-10">How agencies use Mayil.</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {USE_CASES.map(uc => (
              <div key={uc.title} className="rounded-[10px] border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-ink mb-2">{uc.title}</h3>
                <p className="text-[13px] text-muted leading-relaxed">{uc.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="font-display text-xl text-ink mb-1">Ready to scale competitive intelligence across your clients?</h2>
            <p className="text-[13px] text-muted">Agency plan starts at ₹5,999/mo. Includes 10 brands and a dedicated solutions manager.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/contact"><Button>Request a demo</Button></Link>
            <Link href="/sign-up"><Button variant="outline">Start free trial</Button></Link>
          </div>
        </div>
      </section>

    </div>
  )
}
