import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'



export const metadata: Metadata = {
	title: 'motion-log studio',
	description: '데이터 기반 온-오프라인 연동 운동 루틴 매니지먼트',
	manifest: '/manifest.json',
	themeColor: '#0d1421',
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
