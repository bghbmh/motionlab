'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function InAppGuide() {
	const searchParams = useSearchParams()
	const url = searchParams.get('url') ?? ''

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
				<div style={{ fontSize: '56px', marginBottom: '20px' }}>🌐</div>

				<p style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px', lineHeight: 1.4 }}>
					Safari에서 열어주세요
				</p>
				<p style={{ fontSize: '14px', color: '#666', lineHeight: 1.7, marginBottom: '28px' }}>
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
						marginBottom: '16px',
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
						3. "붙여넣기 및 이동"을 탭해요
					</p>
				</div>

				{url && (
					<div style={{
						marginTop: '12px',
						background: '#f1f5f9',
						borderRadius: '10px',
						padding: '12px 16px',
						fontSize: '11px',
						color: '#94a3b8',
						wordBreak: 'break-all',
						textAlign: 'left',
					}}>
						{url}
					</div>
				)}
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
