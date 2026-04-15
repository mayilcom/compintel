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
        paper:       '#F7F4ED',
        surface:     '#FFFFFF',
        'surface-2': '#F0EDE4',
        ink:         '#0D0D0A',
        muted:       '#6B6860',   // text-muted = secondary text
        border:      '#E0DDD4',
        gold:        '#B8922A',
        'gold-bg':   '#FBF5E4',
        'gold-dark': '#7A5E1A',
        // Signal colours
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
        card: '0 1px 4px rgba(13,13,10,0.06)',
      },
    },
  },
  plugins: [],
}

export default config
