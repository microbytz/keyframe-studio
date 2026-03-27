import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ["'PT Sans'", 'sans-serif'],
        headline: ["'PT Sans'", 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: '#000000',
        foreground: '#F8FAFC',
        card: {
          DEFAULT: '#020617',
          foreground: '#F8FAFC',
        },
        popover: {
          DEFAULT: '#020617',
          foreground: '#F8FAFC',
        },
        primary: {
          DEFAULT: '#1E293B',
          foreground: '#F8FAFC',
        },
        secondary: {
          DEFAULT: '#0F172A',
          foreground: '#F8FAFC',
        },
        muted: {
          DEFAULT: '#1E293B',
          foreground: '#94A3B8',
        },
        accent: {
          DEFAULT: '#FFFFFF',
          foreground: '#000000',
        },
        destructive: {
          DEFAULT: '#7F1D1D',
          foreground: '#F8FAFC',
        },
        border: '#1E293B',
        input: '#1E293B',
        ring: '#FFFFFF',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;