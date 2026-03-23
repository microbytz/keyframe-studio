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
        background: '#EFF2F3',
        foreground: '#454D52',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#454D52',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#454D52',
        },
        primary: {
          DEFAULT: '#454D52',
          foreground: '#EFF2F3',
        },
        secondary: {
          DEFAULT: '#E2E8F0',
          foreground: '#454D52',
        },
        muted: {
          DEFAULT: '#E2E8F0',
          foreground: '#718096',
        },
        accent: {
          DEFAULT: '#82C9C9',
          foreground: '#454D52',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: '#CBD5E0',
        input: '#CBD5E0',
        ring: '#82C9C9',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: '#EFF2F3',
          foreground: '#454D52',
          primary: '#82C9C9',
          'primary-foreground': '#FFFFFF',
          accent: '#CBD5E0',
          'accent-foreground': '#454D52',
          border: '#CBD5E0',
          ring: '#82C9C9',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
