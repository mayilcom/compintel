import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Mayil design tokens (direct hex — use these in className)
        // PREVIEW: Direction 3 — cool slate base, gold + signal accents unchanged
        paper:       '#F7F8FA',   // was #F7F4ED — cool slate-50
        surface:     '#FFFFFF',
        'surface-2': '#EFF1F4',   // was #F0EDE4 — cool slate-100
        ink:         '#0A0E1A',   // was #0D0D0A — very dark cool, almost-blue near-black
        muted:       '#5A6373',   // was #6B6860 — cool grey-blue
        border:      '#DCE0E8',   // was #E0DDD4 — cool light border
        gold:        '#B8922A',   // unchanged — pops as warm accent against cool base
        'gold-bg':   '#FBF5E4',   // unchanged
        'gold-dark': '#7A5E1A',   // unchanged
        // Signal colours — unchanged (pop maximally against cool base)
        threat:      '#C0392B',
        watch:       '#B8922A',
        opportunity: '#2D7A4F',
        trend:       '#1A5FA8',
        silence:     '#888780',

        // ── shadcn/ui CSS-variable bridge (hsl() format)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        input: 'hsl(var(--input))',
        ring:  'hsl(var(--ring))',
      },
      fontFamily: {
        display: ['DM Serif Display', 'Georgia', 'serif'],
        body:    ['Instrument Sans', '-apple-system', 'sans-serif'],
        mono:    ['DM Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        // Strengthened so cards lift visibly on the lighter cool base
        card: '0 1px 2px rgba(10,14,26,0.04), 0 4px 12px rgba(10,14,26,0.04)',
      },
    },
  },
  plugins: [],
}

export default config
