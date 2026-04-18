'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function InAppGuide() {
	const searchParams = useSearchParams()
	const url = searchParams.get('url') ?? ''

	function openSafari() {
		try {
			if (navigator.clipboard) {
				navigator.clipboard.writeText(url).catch(() => fallbackCopy())
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
			try { document.execCommand('copy') } catch { }
			document.body.removeChild(t)
		}

		setTimeout(() => {
			window.location.href = 'x-web-search://?'
		}, 300)
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
				{/* Safari 아이콘 인라인 SVG */}
				<div style={{
					marginBottom: '20px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}>
					<img src="/inapp/safari.svg" alt="사파리" style={{ width: '64px', height: '64px' }} />
				</div>

				<p style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px', lineHeight: 1.4 }}>
					Safari에서 열어주세요
				</p>
				<p style={{ fontSize: '14px', color: '#666', lineHeight: 1.7, marginBottom: '24px' }}>
					카카오톡 내부 브라우저에서는<br />
					일부 기능이 제한될 수 있어요.
				</p>

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
						1. 위 버튼을 터치하면 주소가 자동으로 복사돼요<br />
						2. Safari가 열리면 주소창을 길게 터치해요<br />
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
