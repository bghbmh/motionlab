import type { Config } from 'tailwindcss'

// Tailwind v4 — 색상·폰트 등 토큰은 globals.css @theme 에서 관리
// 이 파일은 content 경로만 유지
const config: Config = {
	content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
}

export default config