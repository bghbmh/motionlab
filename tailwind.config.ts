import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy:   '#0d1421',
        card:   '#141e2e',
        card2:  '#1a2740',
        mint:   '#3DDBB5',
        coral:  '#FF6B5B',
        amber:  '#FFB347',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
