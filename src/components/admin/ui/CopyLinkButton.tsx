// components/studio/CopyLinkButton.tsx
'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface Props {
	url: string       // 복사할 URL — 외부에서 조합해서 전달
	title?: string    // 버튼 텍스트 (없으면 아이콘만)
	className?: string // 추가 클래스 (선택적)
}

export default function CopyLinkButton({ url, title = '', className = '' }: Props) {
	const [copied, setCopied] = useState(false)

	function handleCopy() {
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
			type="button"
			onClick={handleCopy}
			title="링크 복사"
			className={`inline-flex items-center  justify-center gap-1.5 py-1 px-2 text-xs transition-all rounded ${copied ? 'bg-primary-50 text-primary' : 'bg-white text-gray-700'} ${className}
				}`}
		>
			{copied ? (
				<>
					<Check size={16} className="text-primary" />
					복사됨
				</>
			) : (
				<>
					<Copy size={16} className="text-gray-700" />
					{title
						? <span>{title}</span>
						: <span className="hidden">링크 복사</span>
					}
				</>
			)}
		</button>
	)
}
