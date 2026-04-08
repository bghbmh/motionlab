// src/app/m/[token]/manifest.ts
// 회원별 동적 manifest — start_url에 토큰 포함
// 홈 화면 추가 시 /m/[token] 으로 바로 실행되도록

import type { MetadataRoute } from 'next'

export default function manifest(
	{ params }: { params: { token: string } }
): MetadataRoute.Manifest {
	const token = params.token

	return {
		name: 'motion-log',
		short_name: 'motion-log',
		description: '데이터 기반 온-오프라인 연동 운동 루틴 매니지먼트',
		start_url: `/m/${token}`,   // ← 토큰 포함된 URL
		display: 'standalone',
		background_color: '#0d1421',
		theme_color: '#0d1421',
		orientation: 'portrait',
		icons: [
			{ src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
			{ src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
			{ src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
			{ src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
			{ src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
			{ src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
			{ src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
			{ src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
		],
	}
}
