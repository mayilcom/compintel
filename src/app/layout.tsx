import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Mayil — Competitive intelligence, weekly',
    template: '%s | Mayil',
  },
  description:
    'A weekly AI-powered competitive intelligence brief for founders and marketing heads. Track 12+ channels. Delivered every Sunday.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://emayil.com'
  ),
  openGraph: {
    title: 'Mayil — Competitive intelligence, weekly',
    description:
      'A weekly AI-powered competitive intelligence brief for founders and marketing heads.',
    url: 'https://emayil.com',
    siteName: 'Mayil',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mayil',
    description: 'Competitive intelligence, weekly.',
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#B8922A',
          colorBackground: '#F7F4ED',
          colorInputBackground: '#FFFFFF',
          colorInputText: '#0D0D0A',
          borderRadius: '0.625rem',
          fontFamily: 'Plus Jakarta Sans, Instrument Sans, -apple-system, sans-serif',
        },
        elements: {
          formButtonPrimary:
            'bg-gold hover:bg-gold-dark text-white font-body font-medium',
          card: 'shadow-card border border-border',
          headerTitle: 'font-display text-ink',
        },
      }}
    >
      <html lang="en" style={{ colorScheme: 'light' }}>
        <head>
          <meta name="color-scheme" content="light" />
          {gtmId && (
            <Script id="gtm-head" strategy="beforeInteractive">
              {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
            </Script>
          )}
        </head>
        <body>
          {gtmId && (
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
              />
            </noscript>
          )}
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
