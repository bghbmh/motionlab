'use client'
// src/components/member/PullToRefresh.tsx
// 아래로 당기면 새로고침
// 인디케이터는 콘텐츠 상단에 자연스럽게 밀려나오는 방식
//
// [수정 내용]
// - window 전체가 아닌 컨테이너 ref 영역에만 터치 이벤트 등록
//   → GNB(하단 탭바) 터치가 PullToRefresh에 의해 차단되던 문제 해결
// - delta <= 0 일 때 startYRef 초기화 → 아래 스크롤 시 즉시 포기
// - preventDefault는 THRESHOLD의 절반(30px) 이상 당겼을 때만 호출
//   → 일반 탭/링크 터치의 클릭 이벤트가 억제되던 문제 해결

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 60
const MAX_PULL = 90
const PREVENT_THRESHOLD = 10  // 이 거리 이상 당겼을 때만 스크롤 차단

interface Props {
	children: React.ReactNode
}

export default function PullToRefresh({ children }: Props) {
	const router = useRouter()
	const containerRef = useRef<HTMLDivElement>(null)
	const startYRef = useRef<number | null>(null)
	const [pullDistance, setPullDistance] = useState(0)
	const [refreshing, setRefreshing] = useState(false)

	const handleTouchStart = useCallback((e: TouchEvent) => {
		// 최상단일 때만 pull-to-refresh 시작
		if (window.scrollY === 0) {
			startYRef.current = e.touches[0].clientY
		}
	}, [])

	const handleTouchMove = useCallback((e: TouchEvent) => {
		if (startYRef.current === null || refreshing) return

		const delta = e.touches[0].clientY - startYRef.current

		// 아래로 스크롤하는 경우 — 즉시 포기하고 이후 이벤트 무시
		if (delta <= 0) {
			setPullDistance(0)
			startYRef.current = null
			return
		}

		const distance = Math.min(delta * 0.5, MAX_PULL)
		setPullDistance(distance)

		// 충분히 당겼을 때만 브라우저 기본 동작(스크롤) 차단
		// PREVENT_THRESHOLD 미만이면 preventDefault 안 함 → 탭/클릭 정상 동작
		if (distance > PREVENT_THRESHOLD) {
			e.preventDefault()
		}
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
		const container = containerRef.current
		if (!container) return

		// window 전체가 아닌 콘텐츠 컨테이너에만 이벤트 등록
		// → GNB는 컨테이너 밖이므로 이벤트가 전달되지 않음
		container.addEventListener('touchstart', handleTouchStart, { passive: true })
		container.addEventListener('touchmove', handleTouchMove, { passive: false })
		container.addEventListener('touchend', handleTouchEnd, { passive: true })

		return () => {
			container.removeEventListener('touchstart', handleTouchStart)
			container.removeEventListener('touchmove', handleTouchMove)
			container.removeEventListener('touchend', handleTouchEnd)
		}
	}, [handleTouchStart, handleTouchMove, handleTouchEnd])

	const indicatorOpacity = Math.min(pullDistance / THRESHOLD, 1)
	const isTriggered = pullDistance >= THRESHOLD
	const showIndicator = pullDistance > 0 || refreshing
	const indicatorHeight = refreshing ? 48 : pullDistance

	return (
		<div ref={containerRef} style={{ minHeight: '100%' }}>
			{/* 새로고침 인디케이터 — 콘텐츠 상단에서 밀려나오는 방식 */}
			<div
				style={{
					height: showIndicator ? indicatorHeight : 0,
					overflow: 'hidden',
					transition: refreshing ? 'none' : 'height 0.05s ease-out',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					opacity: refreshing ? 1 : indicatorOpacity,
				}}
			>
				{refreshing ? (
					/* 스피너 */
					<svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none">
						<circle cx="12" cy="12" r="10" stroke="#0bb489" strokeWidth="2.5" strokeOpacity="0.2" />
						<path d="M12 2a10 10 0 0 1 10 10" stroke="#0bb489" strokeWidth="2.5" strokeLinecap="round" />
					</svg>
				) : (
					/* 화살표 */
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

			{children}
		</div>
	)
}
