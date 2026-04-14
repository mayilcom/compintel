import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createServiceClient } from '@/lib/supabase/server'
import { PLAN_LIMITS, type Plan } from '@/lib/utils'
import { TeamInviteForm } from '@/components/settings/team-invite-form'
import { currentUser, clerkClient } from '@clerk/nextjs/server'

export const metadata = { title: 'Team — Settings' }

interface Member {
  id:       string
  name:     string
  email:    string
  role:     string
  joinedAt: string
}

export default async function TeamSettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [user, db] = await Promise.all([currentUser(), Promise.resolve(createServiceClient())])

  const { data: account } = await db
    .from('accounts')
    .select('account_id, plan, clerk_org_id')
    .eq('clerk_user_id', userId)
    .single()

  if (!account) redirect('/onboarding/brand')

  const acc = account as { account_id: string; plan: string; clerk_org_id: string | null }
  const limits = PLAN_LIMITS[acc.plan as Plan] ?? PLAN_LIMITS.trial
  const seatLimit = limits.seats === Infinity ? null : limits.seats

  const owner: Member = {
    id:       userId,
    name:     [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'You',
    email:    user?.emailAddresses[0]?.emailAddress ?? '',
    role:     'Owner',
    joinedAt: user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '',
  }

  let members: Member[] = [owner]

  if (acc.clerk_org_id) {
    try {
      const client = await clerkClient()
      const memberships = await client.organizations.getOrganizationMembershipList({
        organizationId: acc.clerk_org_id,
      })
      members = memberships.data.map((m) => ({
        id:       m.publicUserData?.userId ?? '',
        name:     [m.publicUserData?.firstName, m.publicUserData?.lastName].filter(Boolean).join(' ')
                  || m.publicUserData?.identifier ?? 'Unknown',
        email:    m.publicUserData?.identifier ?? '',
        role:     m.role === 'org:admin' ? 'Owner' : 'Member',
        joinedAt: new Date(m.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
        }),
      }))
    } catch {
      // Fall back to owner-only on Clerk API failure
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="font-display text-xl text-ink">Team</h1>
        <p className="mt-1 text-[13px] text-muted">
          Invite teammates to access your Mayil workspace.
          {seatLimit ? ` ${seatLimit} seat${seatLimit !== 1 ? 's' : ''} on ${acc.plan} plan.` : ' Unlimited seats.'}
        </p>
      </div>

      {/* Invite form (client component) */}
      <TeamInviteForm seatLimit={seatLimit} currentCount={members.length} />

      {/* Member list */}
      <Card>
        <CardContent className="p-0">
          <div className="px-5 py-3 border-b border-border">
            <p className="label-section">
              Members ({members.length}{seatLimit ? ` / ${seatLimit}` : ''})
            </p>
          </div>
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between px-5 py-3 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-bg text-gold-dark text-xs font-semibold shrink-0">
                  {member.name[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-ink">{member.name}</p>
                  <p className="text-[11px] text-muted">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="default" className="text-[10px]">{member.role}</Badge>
                <span className="text-[11px] text-muted">{member.joinedAt}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
