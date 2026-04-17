export const metadata = {
  title: 'Privacy Policy — Mayil',
  description: 'How Mayil collects, uses, and protects your data.',
}

const LAST_UPDATED = 'April 17, 2026'

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <p className="label-section mb-3">Legal</p>
      <h1 className="font-display text-3xl text-ink mb-2">Privacy Policy</h1>
      <p className="text-[13px] text-muted mb-12">Last updated: {LAST_UPDATED}</p>

      <div className="prose-mayil">

        <Section title="1. Who we are">
          <p>
            Mayil ("<strong>we</strong>", "<strong>us</strong>", "<strong>our</strong>") is a competitive
            intelligence service operated by Mayil Technologies. Our platform delivers weekly AI-interpreted
            briefs on competitor activity to founders and marketing teams. We are accessible at{' '}
            <a href="https://emayil.com">emayil.com</a>.
          </p>
          <p>
            For privacy-related questions, contact us at{' '}
            <a href="mailto:legal@emayil.com">legal@emayil.com</a>.
          </p>
        </Section>

        <Section title="2. What data we collect">
          <h3>Account information</h3>
          <p>
            When you sign up, we collect your name, email address, and company name via Clerk
            (our authentication provider). If you use Google SSO, we receive your name and email
            from Google.
          </p>

          <h3>Brand and competitor data</h3>
          <p>
            You provide us with the names and domains of your brand and competitors you want tracked.
            We store this to configure your weekly brief.
          </p>

          <h3>Connected channel tokens (OAuth)</h3>
          <p>
            If you choose to connect social or analytics channels (Instagram, Google, LinkedIn),
            we store access tokens in our database to retrieve data on your behalf. We store only
            the access token, refresh token (where applicable), and the time of connection.
            We never store your channel passwords.
          </p>
          <p>
            Specifically for <strong>Instagram Business Login</strong>: we request the following permissions:
          </p>
          <ul>
            <li>
              <strong>instagram_business_basic</strong> — your connected account's name, follower
              count, and media count, used to display your baseline in the brief.
            </li>
            <li>
              <strong>instagram_business_manage_insights</strong> — post reach, impressions, and
              engagement rate for your own account, used as a benchmark against competitor data.
            </li>
          </ul>
          <p>
            We access this data on your behalf and use it solely to generate your weekly brief.
            We do not sell, share, or use your Instagram data for advertising or profiling purposes.
          </p>

          <h3>Usage data</h3>
          <p>
            We collect standard server logs (IP addresses, page views, request timestamps) for
            security monitoring and debugging. We do not use third-party analytics trackers.
          </p>

          <h3>Payment data</h3>
          <p>
            Payments are processed by Razorpay (India) or Stripe (international). We do not store
            card numbers or bank details — only your plan status and subscription ID.
          </p>
        </Section>

        <Section title="3. How we use your data">
          <ul>
            <li>To generate and deliver your weekly competitive intelligence brief</li>
            <li>To send transactional emails (brief delivery, account notifications)</li>
            <li>To manage your subscription and process payments</li>
            <li>To improve the service and debug issues</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p>
            We do not use your data for advertising, sell it to third parties, or share it with
            anyone except the sub-processors listed in Section 5.
          </p>
        </Section>

        <Section title="4. Data retention">
          <ul>
            <li>
              <strong>OAuth tokens</strong> — retained until you disconnect the channel or delete
              your account.
            </li>
            <li>
              <strong>Brief data</strong> — retained for 12 months, then anonymised.
            </li>
            <li>
              <strong>Account data</strong> — retained until account deletion. Deleted within 30
              days of a deletion request.
            </li>
            <li>
              <strong>Payment records</strong> — retained for 7 years as required by Indian tax law.
            </li>
          </ul>
        </Section>

        <Section title="5. Sub-processors">
          <p>We use the following third-party services to operate Mayil:</p>
          <table>
            <thead>
              <tr><th>Service</th><th>Purpose</th><th>Data shared</th></tr>
            </thead>
            <tbody>
              <tr><td>Supabase</td><td>Database hosting</td><td>All account and brief data</td></tr>
              <tr><td>Clerk</td><td>Authentication</td><td>Name, email, session tokens</td></tr>
              <tr><td>Vercel</td><td>Web hosting</td><td>Server logs, IP addresses</td></tr>
              <tr><td>Railway</td><td>Background workers</td><td>Account IDs, OAuth tokens (read-only)</td></tr>
              <tr><td>Resend</td><td>Email delivery</td><td>Recipient email addresses, brief content</td></tr>
              <tr><td>Anthropic</td><td>AI signal interpretation</td><td>Anonymised competitor activity data</td></tr>
              <tr><td>Apify</td><td>Public data collection</td><td>Competitor brand names and handles</td></tr>
              <tr><td>Razorpay / Stripe</td><td>Payment processing</td><td>Email, subscription amount</td></tr>
            </tbody>
          </table>
        </Section>

        <Section title="6. Instagram data">
          <p>
            Mayil uses the Instagram API with Instagram Business Login. By connecting your Instagram
            account you authorise us to access your business account's basic profile data and
            insights as described in Section 2.
          </p>
          <p>
            <strong>We do not:</strong> read your direct messages, post content on your behalf,
            access follower lists, or share your Instagram data with any third party outside of
            the sub-processors listed above.
          </p>
          <p>
            <strong>Disconnecting Instagram:</strong> you can disconnect at any time from Settings
            → Channels → Disconnect. This immediately revokes our access. Any cached data from
            your account will be deleted within 30 days.
          </p>
          <p>
            <strong>Deauthorisation via Instagram:</strong> if you remove Mayil from your Instagram
            app settings, we will be notified via a webhook and your token will be deleted
            automatically within 24 hours.
          </p>
          <p>
            <strong>Data deletion requests</strong> can be submitted via Instagram's Privacy Center
            or by emailing <a href="mailto:legal@emayil.com">legal@emayil.com</a>. We will delete
            all Instagram-derived data within 30 days and provide a confirmation code.
          </p>
        </Section>

        <Section title="7. Your rights">
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li><strong>Access</strong> — request a copy of the data we hold about you</li>
            <li><strong>Correction</strong> — ask us to correct inaccurate data</li>
            <li><strong>Deletion</strong> — request deletion of your account and all associated data</li>
            <li><strong>Portability</strong> — receive your data in a machine-readable format</li>
            <li><strong>Objection</strong> — object to processing for direct marketing</li>
          </ul>
          <p>
            To exercise any of these rights, email{' '}
            <a href="mailto:legal@emayil.com">legal@emayil.com</a>. We will respond within 30 days.
          </p>
          <p>
            To delete your account, go to Settings → Profile → Delete account, or email us.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            We use only functional cookies necessary for authentication (set by Clerk) and
            short-lived OAuth state tokens (deleted immediately after connection completes).
            We do not use advertising or tracking cookies.
          </p>
        </Section>

        <Section title="9. Security">
          <p>
            All data is encrypted in transit (TLS 1.2+) and at rest. OAuth tokens are stored in
            a managed PostgreSQL database with row-level security. Access to production data is
            restricted to authorised personnel only.
          </p>
        </Section>

        <Section title="10. Changes to this policy">
          <p>
            We may update this policy from time to time. We will notify you by email if we make
            material changes. Continued use of Mayil after notification constitutes acceptance of
            the updated policy.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Mayil Technologies<br />
            Email: <a href="mailto:legal@emayil.com">legal@emayil.com</a>
          </p>
        </Section>

      </div>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-xl text-ink mb-4">{title}</h2>
      <div className="flex flex-col gap-3 text-[14px] text-muted leading-relaxed [&_strong]:text-ink [&_a]:text-gold-dark [&_a]:hover:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:mt-2 [&_table]:w-full [&_table]:text-[13px] [&_th]:text-left [&_th]:text-ink [&_th]:font-semibold [&_th]:pb-2 [&_th]:border-b [&_th]:border-border [&_td]:py-2 [&_td]:pr-4 [&_td]:border-b [&_td]:border-border [&_td]:align-top">
        {children}
      </div>
    </section>
  )
}
