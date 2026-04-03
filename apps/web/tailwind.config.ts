import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base:      'var(--bg-base)',
        sidebar:   'var(--bg-sidebar)',
        surface:   'var(--bg-surface)',
        elevated:  'var(--bg-elevated)',
        input:     'var(--bg-input)',
        hover:     'var(--bg-hover)',
        border: {
          strong:  'var(--border-strong)',
          subtle:  'var(--border-subtle)',
          faint:   'var(--border-faint)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          faint:     'var(--text-faint)',
          ghost:     'var(--text-ghost)',
        },
        accent:    'var(--accent)',
        green:     'var(--green)',
        blue:      'var(--blue)',
        amber:     'var(--amber)',
        red:       'var(--red)',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        mono:    ['Fragment Mono', 'monospace'],
      },
      borderRadius: {
        sm:  'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg:  'var(--radius-lg)',
      },
      boxShadow: {
        card:     'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
      },
    },
  },
  plugins: [],
}

export default config
