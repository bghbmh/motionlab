'use client'
// src/components/member/PullToRefresh.tsx
// 아래로 당기면 새로고침
// 인디케이터는 콘텐츠 상단에 자연스럽게 밀려나오는 방식

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 60
const MAX_PULL = 90

interface Props {
	children: React.ReactNode
}

export default function PullToRefresh({ children }: Props) {
	const router = useRouter()
	const startYRef = useRef<number | null>(null)
	const [pullDistance, setPullDistance] = useState(0)
	const [refreshing, setRefreshing] = useState(false)

	const handleTouchStart = useCallback((e: TouchEvent) => {
		if (window.scrollY === 0) {
			startYRef.current = e.touches[0].clientY
		}
	}, [])

	const handleTouchMove = useCallback((e: TouchEvent) => {
		if (startYRef.current === null || refreshing) return
		const delta = e.touches[0].clientY - startYRef.current
		if (delta <= 0) {
			setPullDistance(0)
			return
		}
		const distance = Math.min(delta * 0.5, MAX_PULL)
		setPullDistance(distance)
		if (distance > 0) e.preventDefault()
	}, [refreshing])

	const handleTouchEnd = useCallback(async () => {
		if (startYRef.current === null) return
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
		window.addEventListener('touchstart', handleTouchStart, { passive: true })
		window.addEventListener('touchmove', handleTouchMove, { passive: false })
		window.addEventListener('touchend', handleTouchEnd, { passive: true })
		return () => {
			window.removeEventListener('touchstart', handleTouchStart)
			window.removeEventListener('touchmove', handleTouchMove)
			window.removeEventListener('touchend', handleTouchEnd)
		}
	}, [handleTouchStart, handleTouchMove, handleTouchEnd])

	const indicatorOpacity = Math.min(pullDistance / THRESHOLD, 1)
	const isTriggered = pullDistance >= THRESHOLD
	const showIndicator = pullDistance > 0 || refreshing
	const indicatorHeight = refreshing ? 48 : pullDistance

	return (
		<>
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
		</>
	)
}
