// src/components/member/ui/FutureCheckToast.tsx
// 미래 날짜 운동 체크 시도 시 표시되는 토스트
//
// 위치 결정 방식:
//   - NoteWorkoutItem에서 클릭/터치 시 document.body에
//     --toast-y CSS 변수를 인라인으로 설정
//   - 이 컴포넌트는 var(--toast-y) 를 읽어 top 위치 계산
//   - --toast-y 미설정 시 기본값: 화면 하단(GNB 위)에 표시

'use client'

import { useEffect, useState } from 'react'

const TOAST_HEIGHT = 68
const GAP = 12
// --toast-y 없을 때 fallback: 화면 하단 GNB(72px) 바로 위
const DEFAULT_BOTTOM = 96  // px (GNB 높이 + 여백)

interface Props {
	visible: boolean
	onHide: () => void
	duration?: number
}

export default function FutureCheckToast({ visible, onHide, duration = 3000 }: Props) {
	const [show, setShow] = useState(false)
	const [topPx, setTopPx] = useState<number | null>(null)

	useEffect(() => {
		if (!visible) {
			setShow(false)
			return
		}

		// body의 --toast-y 읽기
		const raw = getComputedStyle(document.body)
			.getPropertyValue('--toast-y')
			.trim()

		const touchY = raw ? parseFloat(raw) : null

		if (touchY !== null && touchY > 0) {
			// 터치 위치 바로 위에 배치, 화면 상단 8px 이하 넘침 방지
			setTopPx(Math.max(8, touchY - TOAST_HEIGHT - GAP))
		} else {
			setTopPx(null)  // null → 하단 고정 fallback 사용
		}

		const showTimer = setTimeout(() => setShow(true), 10)
		const hideTimer = setTimeout(() => {
			setShow(false)
			setTimeout(onHide, 300)
		}, duration)

		return () => {
			clearTimeout(showTimer)
			clearTimeout(hideTimer)
		}
	}, [visible, duration, onHide])

	if (!visible) return null

	// topPx가 있으면 터치 위치 기반, 없으면 하단 고정
	const positionStyle = topPx !== null
		? { top: topPx, bottom: 'auto' }
		: { bottom: DEFAULT_BOTTOM, top: 'auto' }

	return (
		<div
			style={{
				position: 'fixed',
				...positionStyle,
				left: '50%',
				transform: 'translateX(-50%)',
				zIndex: 300,
				width: 'calc(100% - 32px)',
				maxWidth: 370,
				opacity: show ? 1 : 0,
				transition: 'opacity 0.3s ease',
				pointerEvents: 'none',
			}}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 10,
					backgroundColor: '#1d211c',
					borderRadius: 14,
					padding: '12px 16px',
					boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
				}}
			>
				{/* 아이콘 */}
				<div
					style={{
						width: 32,
						height: 32,
						borderRadius: 8,
						backgroundColor: 'rgba(251,44,54,0.12)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						flexShrink: 0,
					}}
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M8 5v4M8 11h.01" stroke="#FB2C36" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
						<circle cx="8" cy="8" r="6.5" stroke="#FB2C36" strokeWidth="1.5" />
					</svg>
				</div>

				{/* 텍스트 */}
				<div style={{ flex: 1 }}>
					<p style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', margin: 0, lineHeight: 1.4 }}>
						아직 오지 않은 날이에요
					</p>
					<p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, marginTop: 2, lineHeight: 1.4 }}>
						미래 날짜의 운동은 체크할 수 없어요
					</p>
				</div>
			</div>
		</div>
	)
}
