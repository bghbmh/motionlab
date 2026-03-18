import type { Viewport, Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

export const viewport: Viewport = {
	themeColor: '#0d1421',
	width: 'device-width',
	initialScale: 1,
	// 추가적인 설정들...
}

export const metadata: Metadata = {
	title: 'motion-log studio',
	description: '데이터 기반 온-오프라인 연동 운동 루틴 매니지먼트',
	manifest: '/manifest.json',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="ko" >
			<body className="bg-navy text-white font-sans antialiased">
				{children}
			</body>
		</html>
	)
}
