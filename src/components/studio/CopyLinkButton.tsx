'use client'

import { useState } from 'react'

interface Props {
	accessToken: string
}

export default function CopyLinkButton({ accessToken }: Props) {
	const [copied, setCopied] = useState(false)

	function handleCopy() {
		const url = `${window.location.origin}/m/${accessToken}`

		if (navigator.clipboard?.writeText) {
			navigator.clipboard.writeText(url).then(() => {
				setCopied(true)
				setTimeout(() => setCopied(false), 2000)
			})
		} else {
			// fallback: textarea 방식 (HTTP 환경, 구형 브라우저 대응)
			const textarea = document.createElement('textarea')
			textarea.value = url
			textarea.style.position = 'fixed'
			textarea.style.opacity = '0'
			document.body.appendChild(textarea)
			textarea.focus()
			textarea.select()
			try {
				document.execCommand('copy')
				setCopied(true)
				setTimeout(() => setCopied(false), 2000)
			} catch {
				alert(`링크를 복사해주세요:\n${url}`)
			} finally {
				document.body.removeChild(textarea)
			}
		}
	}

	return (
		<button
			type='button'
			onClick={handleCopy}
			title="회원앱 접속 링크 복사"
			className="btn-ghost flex items-center gap-1.5 text-xs transition-all"
			style={{
				background: copied ? 'rgba(61,219,181,0.15)' : 'rgba(255,255,255,0.04)',
				border: copied ? '1px solid rgba(61,219,181,0.4)' : '1px solid rgba(255,255,255,0.1)',
				color: copied ? '#3DDBB5' : 'rgba(255,255,255,0.5)',
			}}
		>
			{copied ? (
				<>
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
						<path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5"
							strokeLinecap="round" strokeLinejoin="round" />
					</svg>
					복사됨
				</>
			) : (
				<>
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
						<rect x="4" y="1" width="7" height="8" rx="1.2"
							stroke="currentColor" strokeWidth="1.2" />
						<path d="M1 4h2v6.5A.5.5 0 003.5 11H8v1H3a2 2 0 01-2-2V4z"
							fill="currentColor" />
					</svg>
					회원 링크 복사
				</>
			)}
		</button>
	)
}
