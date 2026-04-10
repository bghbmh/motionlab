'use client'
// src/components/member/PullToRefresh.tsx
// 당겨서 새로고침
//
// [수정 내용]
//   - containerRef 제거 → window에 터치 이벤트 등록
//   - children을 div 감싸지 않고 독립적으로 렌더링
//   - passive: true 유지 → GNB 터치 등 모든 터치에 간섭 없음
//
// 동작 조건:
//   1. window.scrollY === 0 (최상단)
//   2. 아래 방향 제스처 (delta > 0)
//   3. data-no-pull 속성 요소 내부 터치가 아닐 것

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 64   // 새로고침 발동 거리 (px)
const MAX_PULL = 96   // 최대 당김 거리 (px)
const RESISTANCE = 0.4  // 당김 저항감

interface Props {
	children: React.ReactNode
}

export default function PullToRefresh({ children }: Props) {
	const router = useRouter()
	const startYRef = useRef<number | null>(null)
	const [pullDistance, setPullDistance] = useState(0)
	const [refreshing, setRefreshing] = useState(false)

	const handleTouchStart = useCallback((e: TouchEvent) => {
		// 조건 1: 최상단이 아니면 무시
		if (window.scrollY !== 0) return

		// 조건 2: data-no-pull 영역(모달 등) 내부면 무시
		const target = e.target as HTMLElement
		if (target.closest('[data-no-pull]')) return

		startYRef.current = e.touches[0].clientY
	}, [])

	const handleTouchMove = useCallback((e: TouchEvent) => {
		if (startYRef.current === null || refreshing) return

		const delta = e.touches[0].clientY - startYRef.current

		// 위로 스크롤 → 대기 종료
		if (delta <= 0) {
			startYRef.current = null
			setPullDistance(0)
			return
		}

		setPullDistance(Math.min(delta * RESISTANCE, MAX_PULL))
	}, [refreshing])

	const handleTouchEnd = useCallback(async () => {
		if (startYRef.current === null && pullDistance === 0) return
		startYRef.current = null

		if (pullDistance >= THRESHOLD) {
			setRefreshing(true)
			setPullDistance(0)
			router.refresh()
			await new Promise(r => setTimeout(r, 1000))
			setRefreshing(false)
		} else {
			setPullDistance(0)
		}
	}, [pullDistance, router])

	useEffect(() => {
		// window에 등록 — passive: true라 GNB 등 터치에 간섭 없음
		window.addEventListener('touchstart', handleTouchStart, { passive: true })
		window.addEventListener('touchmove', handleTouchMove, { passive: true })
		window.addEventListener('touchend', handleTouchEnd, { passive: true })

		return () => {
			window.removeEventListener('touchstart', handleTouchStart)
			window.removeEventListener('touchmove', handleTouchMove)
			window.removeEventListener('touchend', handleTouchEnd)
		}
	}, [handleTouchStart, handleTouchMove, handleTouchEnd])

	const isTriggered = pullDistance >= THRESHOLD
	const indicatorHeight = refreshing ? 48 : pullDistance
	const opacity = refreshing ? 1 : Math.min(pullDistance / THRESHOLD, 1)

	return (
		<>
			{/* 인디케이터 — 콘텐츠 상단에서 자연스럽게 밀려 나옴 */}
			{(pullDistance > 0 || refreshing) && (
				<div
					style={{
						height: indicatorHeight,
						overflow: 'hidden',
						transition: refreshing ? 'none' : 'height 0.05s ease-out',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						opacity,
					}}
				>
					{refreshing ? (
						<svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none">
							<circle cx="12" cy="12" r="10" stroke="#0bb489" strokeWidth="2.5" strokeOpacity="0.2" />
							<path d="M12 2a10 10 0 0 1 10 10" stroke="#0bb489" strokeWidth="2.5" strokeLinecap="round" />
						</svg>
					) : (
						<svg
							width="22" height="22" viewBox="0 0 24 24" fill="none"
							style={{
								transform: `rotate(${isTriggered ? '180deg' : '0deg'})`,
								transition: 'transform 0.2s',
								color: isTriggered ? '#0bb489' : '#9ca3af',
							}}
						>
							<path
								d="M12 5v14M5 12l7 7 7-7"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					)}
				</div>
			)}

			{children}
		</>
	)
}
