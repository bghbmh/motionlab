'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function InAppGuide() {
	const searchParams = useSearchParams()
	const url = searchParams.get('url') ?? ''
	const [copied, setCopied] = useState(false)

	// 페이지 로드 시 자동으로 URL 복사
	useEffect(() => {
		if (!url) return
		try {
			if (navigator.clipboard) {
				navigator.clipboard.writeText(url).then(() => setCopied(true)).catch(() => fallbackCopy())
			} else {
				fallbackCopy()
			}
		} catch {
			fallbackCopy()
		}

		function fallbackCopy() {
			const t = document.createElement('textarea')
			t.value = url
			t.style.position = 'fixed'
			t.style.opacity = '0'
			document.body.appendChild(t)
			t.focus()
			t.select()
			try {
				document.execCommand('copy')
				setCopied(true)
			} catch { }
			document.body.removeChild(t)
		}
	}, [url])

	function openSafari() {
		window.location.href = 'x-web-search://?'
	}

	return (
		<div style={{
			fontFamily: '-apple-system, sans-serif',
			background: '#f8faf8',
			minHeight: '100vh',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			padding: '24px',
		}}>
			<div style={{
				background: '#fff',
				borderRadius: '20px',
				padding: '40px 28px',
				textAlign: 'center',
				maxWidth: '360px',
				width: '100%',
				boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
			}}>
				<div style={{ marginBottom: '20px' }}>
					<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
						<rect width="72" height="72" rx="16" fill="url(#safari-bg)" />
						<circle cx="36" cy="36" r="22" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" />
						<circle cx="36" cy="36" r="22" stroke="white" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="2 4" />
						{/* 나침반 바늘 — 빨강(북) / 흰색(남) */}
						<polygon points="36,18 38.2,34 33.8,34" fill="#FF3B30" />
						<polygon points="36,54 33.8,38 38.2,38" fill="white" />
						{/* 중앙 원 */}
						<circle cx="36" cy="36" r="3" fill="white" />
						{/* 눈금 4방향 */}
						<line x1="36" y1="14" x2="36" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
						<line x1="36" y1="54" x2="36" y2="58" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
						<line x1="14" y1="36" x2="18" y2="36" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
						<line x1="54" y1="36" x2="58" y2="36" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
						<defs>
							<linearGradient id="safari-bg" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
								<stop offset="0%" stopColor="#1E90FF" />
								<stop offset="100%" stopColor="#006FD6" />
							</linearGradient>
						</defs>
					</svg>
				</div>

				<p style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px', lineHeight: 1.4 }}>
					Safari에서 열어주세요
				</p>
				<p style={{ fontSize: '14px', color: '#666', lineHeight: 1.7, marginBottom: '8px' }}>
					카카오톡 내부 브라우저에서는<br />
					일부 기능이 제한될 수 있어요.
				</p>

				{/* 복사 상태 표시 */}
				<div style={{
					display: 'inline-flex',
					alignItems: 'center',
					gap: '6px',
					background: copied ? '#e6faf5' : '#f1f5f9',
					color: copied ? '#0bb489' : '#94a3b8',
					borderRadius: '20px',
					padding: '6px 14px',
					fontSize: '13px',
					fontWeight: 500,
					marginBottom: '24px',
				}}>
					{copied ? '✅ URL이 복사됐어요!' : '🔗 URL 복사 중...'}
				</div>

				<button
					onClick={openSafari}
					style={{
						display: 'block',
						width: '100%',
						background: '#0bb489',
						color: '#fff',
						border: 'none',
						borderRadius: '12px',
						padding: '16px',
						fontSize: '16px',
						fontWeight: 600,
						cursor: 'pointer',
						marginBottom: '20px',
					}}
				>
					Safari로 열기
				</button>

				<div style={{
					background: '#f8faf8',
					borderRadius: '12px',
					padding: '16px',
					textAlign: 'left',
				}}>
					<p style={{ fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '8px' }}>
						📋 Safari에서 여는 방법
					</p>
					<p style={{ fontSize: '13px', color: '#666', lineHeight: 1.8 }}>
						1. 위 버튼을 탭해 Safari를 열어요<br />
						2. 주소창을 길게 터치해요<br />
						3. &quot;붙여넣기 및 이동&quot;을 탭해요
					</p>
				</div>
			</div>
		</div>
	)
}

export default function InAppPage() {
	return (
		<Suspense>
			<InAppGuide />
		</Suspense>
	)
}
