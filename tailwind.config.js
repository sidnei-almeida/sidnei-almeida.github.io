/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#050505',
          raised: '#080808',
          surface: '#0B0D0E',
        },
        panel: {
          DEFAULT: '#0E1011',
          raised: '#111315',
          elevated: '#151719',
        },
        line: {
          DEFAULT: '#242628',
          soft: '#2C2F31',
        },
        ink: {
          primary: '#E6E3DD',
          bright: '#F2EFE8',
          secondary: '#A19D94',
          muted: '#66645F',
          faint: '#66645F',
          ghost: '#66645F',
          body: '#A19D94',
          label: '#8C8982',
        },
        accent: {
          DEFAULT: '#E3342F',
          text: '#E02E2A',
          deep: '#C92A26',
          bright: '#E3342F',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      letterSpacing: {
        label: '0.18em',
        brand: '0.32em',
        overline: '0.28em',
        nav: '2.5px',
        'section-label': '3px',
        button: '2px',
        'mono-link': '1.5px',
        'metric-label': '2px',
        'tech-tag': '0.8px',
      },
      borderRadius: {
        card: '4px',
        btn: '4px',
      },
      maxWidth: {
        page: '2200px',
      },
      spacing: {
        section: '64px',
        gutter: '40px',
      },
    },
  },
  plugins: [],
};
