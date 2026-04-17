export const metadata = {
  title: 'Terms of Service — Mayil',
  description: 'Terms governing your use of the Mayil platform.',
}

const LAST_UPDATED = 'April 17, 2026'

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <p className="label-section mb-3">Legal</p>
      <h1 className="font-display text-3xl text-ink mb-2">Terms of Service</h1>
      <p className="text-[13px] text-muted mb-12">Last updated: {LAST_UPDATED}</p>

      <div className="flex flex-col gap-10">

        <Section title="1. Agreement">
          <p>
            By creating an account or using Mayil ("<strong>Service</strong>"), you agree to these
            Terms of Service ("<strong>Terms</strong>") on behalf of yourself or the organisation
            you represent. If you do not agree, do not use the Service.
          </p>
          <p>
            These Terms form a binding agreement between you and Mayil Technologies
            ("<strong>Mayil</strong>", "<strong>we</strong>", "<strong>us</strong>").
          </p>
        </Section>

        <Section title="2. The Service">
          <p>
            Mayil is a competitive intelligence platform that monitors publicly available competitor
            activity across 12+ channels (Instagram, YouTube, LinkedIn, Meta Ads, Amazon, Google
            Search Trends, News/PR, and others), interprets the data using AI, and delivers a
            weekly brief to your nominated email recipients every Sunday morning.
          </p>
          <p>
            You may also connect your own brand's social and analytics channels via OAuth to
            enrich your brief with your own performance data as a baseline.
          </p>
        </Section>

        <Section title="3. Free trial and subscriptions">
          <p>
            New accounts receive a <strong>14-day free trial</strong> with no credit card required.
            Trial accounts are limited to 1 brand, 3 competitors, 2 recipients, and 1 team seat.
          </p>
          <p>
            After the trial, continued use requires a paid subscription (Starter, Growth, or Agency).
            Subscriptions are billed monthly or annually in advance. Indian customers are billed in
            INR via Razorpay. International customers are billed in USD or EUR via Stripe.
          </p>
          <p>
            Annual subscriptions receive 2 months free (equivalent to a ~16% discount). No
            partial-month refunds are provided for downgrades or cancellations mid-cycle.
          </p>
        </Section>

        <Section title="4. Cancellation and refunds">
          <p>
            You may cancel your subscription at any time from Settings → Subscription. Cancellation
            takes effect at the end of the current billing period. You retain access until then.
          </p>
          <p>
            We offer a full refund within <strong>7 days</strong> of the first charge of a new
            subscription if no brief has been delivered. Contact{' '}
            <a href="mailto:hello@emayil.com">hello@emayil.com</a> to request a refund.
          </p>
          <p>
            We reserve the right to suspend or terminate accounts for non-payment, abuse, or
            violation of these Terms.
          </p>
        </Section>

        <Section title="5. Acceptable use">
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service to monitor individuals rather than brands or businesses</li>
            <li>Resell, sublicense, or redistribute brief content without written permission</li>
            <li>Attempt to reverse-engineer, scrape, or extract data from the Mayil platform itself</li>
            <li>Use the Service in a way that violates applicable laws or the terms of any connected platform (Instagram, Google, LinkedIn, etc.)</li>
            <li>Submit false, misleading, or fraudulent information during onboarding</li>
            <li>Share your account credentials with users outside your purchased seat count</li>
          </ul>
        </Section>

        <Section title="6. Connected channels and third-party platforms">
          <p>
            When you connect a channel (Instagram, Google, LinkedIn) via OAuth, you authorise
            Mayil to access data from that platform on your behalf within the scope you approve.
            We access only the permissions listed at the point of connection.
          </p>
          <p>
            You are responsible for ensuring your use of connected channels complies with the
            respective platform's terms of service. Mayil is not responsible for changes to
            third-party platform APIs, policies, or data availability.
          </p>
          <p>
            You may disconnect any channel at any time from Settings → Channels.
          </p>
        </Section>

        <Section title="7. Data and intellectual property">
          <p>
            <strong>Your data</strong> — you retain ownership of all data you provide to Mayil
            (brand names, competitors, connected channel data). You grant us a limited licence to
            process it solely to provide the Service.
          </p>
          <p>
            <strong>Brief content</strong> — the weekly briefs generated for your account are
            licensed to you for internal business use. You may share briefs within your organisation
            and with clients in an account management context. You may not republish or commercially
            redistribute brief content.
          </p>
          <p>
            <strong>Mayil platform</strong> — all intellectual property in the Mayil platform,
            including software, design, and AI models, belongs to Mayil Technologies.
          </p>
        </Section>

        <Section title="8. Disclaimer of warranties">
          <p>
            The Service is provided "<strong>as is</strong>" and "<strong>as available</strong>"
            without warranties of any kind. We do not guarantee that:
          </p>
          <ul>
            <li>Briefs will be free from errors or omissions</li>
            <li>Competitor data collected is complete or fully accurate</li>
            <li>The Service will be available uninterrupted at all times</li>
            <li>AI-interpreted signals will be correct or actionable in your specific context</li>
          </ul>
          <p>
            Mayil is a decision-support tool. All business decisions based on brief content are
            made at your sole discretion and risk.
          </p>
        </Section>

        <Section title="9. Limitation of liability">
          <p>
            To the maximum extent permitted by applicable law, Mayil Technologies shall not be
            liable for any indirect, incidental, special, or consequential damages, including loss
            of profits, revenue, or business opportunity, arising from your use of the Service —
            even if we have been advised of the possibility of such damages.
          </p>
          <p>
            Our total cumulative liability for any claim arising under these Terms shall not exceed
            the amount you paid us in the three months preceding the claim.
          </p>
        </Section>

        <Section title="10. Governing law">
          <p>
            These Terms are governed by the laws of India. Any disputes shall be subject to the
            exclusive jurisdiction of the courts in Bengaluru, Karnataka, India.
          </p>
        </Section>

        <Section title="11. Changes to these Terms">
          <p>
            We may update these Terms from time to time. We will notify you by email at least
            14 days before material changes take effect. Continued use of the Service after the
            effective date constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            For questions about these Terms, contact us at{' '}
            <a href="mailto:hello@emayil.com">hello@emayil.com</a>.
          </p>
          <p>
            Mayil Technologies<br />
            Email: <a href="mailto:hello@emayil.com">hello@emayil.com</a>
          </p>
        </Section>

      </div>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl text-ink mb-4">{title}</h2>
      <div className="flex flex-col gap-3 text-[14px] text-muted leading-relaxed [&_strong]:text-ink [&_a]:text-gold-dark [&_a]:hover:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
        {children}
      </div>
    </section>
  )
}
