/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  corePlugins: {
    preflight: false,
    container: false,
  },
  theme: {
    extend: {
      colors: {
        ink: '#0e1712',
        'ink-2': '#101d16',
        forest: '#15271f',
        'forest-2': '#1d3529',
        'forest-line': 'rgba(245, 239, 227, 0.12)',
        'forest-line-2': 'rgba(245, 239, 227, 0.07)',
        brass: '#c3a15b',
        'brass-bright': '#ddbe85',
        'brass-deep': '#9c7f43',
        bone: '#f5efe3',
        'bone-2': '#ece4d4',
        'bone-3': '#e0d7c3',
        sage: '#9aa69c',
        'sage-2': '#77857a',
        'ink-text': '#1c2e26',
        'ink-soft': '#37493f',
        'ink-muted': '#566a60',
        st: {
          available: '#6e9b7a',
          occupied: '#c3a15b',
          cleaning: '#7c93a6',
          maintenance: '#b4614f',
          reserved: '#9c86a6',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Cormorant Garamond', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Jost', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        xs: '3px',
        sm: '6px',
        md: '10px',
        lg: '18px',
        xl: '28px',
        pill: '999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(14, 23, 18, 0.06), 0 2px 8px rgba(14, 23, 18, 0.05)',
        md: '0 10px 30px -12px rgba(14, 23, 18, 0.25)',
        lg: '0 30px 70px -25px rgba(14, 23, 18, 0.45)',
        brass: '0 18px 40px -18px rgba(156, 127, 67, 0.55)',
      },
      keyframes: {
        shimmer: {
          '0%': { 'background-position': '180% 0' },
          '100%': { 'background-position': '-80% 0' },
        },
        kenburns: {
          to: { transform: 'scale(1)' },
        },
        scrollpulse: {
          '0%, 100%': { transform: 'scaleY(0.4)', opacity: '0.5' },
          '50%': { transform: 'scaleY(1)', opacity: '1' },
        },
        pinPulse: {
          '0%, 100%': {
            'box-shadow':
              '0 0 0 8px rgba(195, 161, 91, 0.18), var(--shadow-brass)',
          },
          '50%': {
            'box-shadow':
              '0 0 0 14px rgba(195, 161, 91, 0.05), var(--shadow-brass)',
          },
        },
        loginZoom: {
          from: { transform: 'scale(1)' },
          to: { transform: 'scale(1.08)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s infinite',
        kenburns: 'kenburns 18s ease-out forwards',
        'scroll-pulse': 'scrollpulse 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        'pin-pulse': 'pinPulse 3s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        'login-zoom': 'loginZoom 20s ease-in-out infinite alternate',
        refresh: 'spin 1s linear infinite',
      },
      transitionTimingFunction: {
        ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
    },
  },
  plugins: [],
}