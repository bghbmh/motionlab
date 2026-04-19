'use client'
// src/components/member/ProfileModal.tsx
// 개인설정 모달 — 이름 클릭 시 표시
// 항목: 앱 설치 유도, 푸시 알림 설정, 앱 초기화

import { useEffect, useState } from 'react'
import { X, Download, Bell, BellOff, ChevronRight } from 'lucide-react'
import { usePushNotification } from '@/hooks/usePushNotification'

const SUBSCRIBED_KEY = 'push_subscribed'

function isStandalone(): boolean {
	if (typeof window === 'undefined') return false
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		('standalone' in window.navigator && (window.navigator as any).standalone === true)
	)
}

function isIOS(): boolean {
	if (typeof window === 'undefined') return false
	return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

interface Props {
	token: string
	memberName: string
	registeredAt: string   // 'YYYY-MM-DD'
	onClose: () => void
}

export default function ProfileModal({ token, memberName, registeredAt, onClose }: Props) {
	const [visible, setVisible] = useState(false)
	const [installed, setInstalled] = useState(false)
	const [os, setOs] = useState<'ios' | 'android' | 'other'>('other')
	const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
	const [showIosGuide, setShowIosGuide] = useState(false)
	const [resetDone, setResetDone] = useState(false)

	const { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe, debugMessage } =
		usePushNotification({ token })

	useEffect(() => {
		const t = requestAnimationFrame(() => setVisible(true))
		setInstalled(isStandalone())
		setOs(isIOS() ? 'ios' : 'android')

		const handler = (e: Event) => {
			e.preventDefault()
			setDeferredPrompt(e)
		}
		window.addEventListener('beforeinstallprompt', handler)
		return () => {
			cancelAnimationFrame(t)
			window.removeEventListener('beforeinstallprompt', handler)
		}
	}, [])

	function handleClose() {
		setVisible(false)
		setTimeout(onClose, 280)
	}

	async function handleInstall() {
		if (os === 'ios') {
			setShowIosGuide(true)
			return
		}
		if (deferredPrompt) {
			deferredPrompt.prompt()
			const { outcome } = await deferredPrompt.userChoice
			if (outcome === 'accepted') setInstalled(true)
			setDeferredPrompt(null)
		} else {
			setShowIosGuide(true)
		}
	}

	async function handlePush() {
		const success = await subscribe()
		if (success) {
			localStorage.setItem(SUBSCRIBED_KEY, 'true')
		}
	}

	async function handleUnsubscribe() {
		await unsubscribe()
		localStorage.removeItem(SUBSCRIBED_KEY)
	}

	async function handleReset() {
		// 1. localStorage 초기화
		localStorage.removeItem(SUBSCRIBED_KEY)

		// 2. 서비스워커 캐시 전체 초기화
		if ('caches' in window) {
			const keys = await caches.keys()
			await Promise.all(keys.map(key => caches.delete(key)))
		}

		setResetDone(true)

		// 2초 후 앱 새로고침
		setTimeout(() => {
			window.location.reload()
		}, 2000)
	}

	const pushEnabled = permission === 'granted' || isSubscribed

	const pushLabel = (() => {
		if (!isSupported) return '이 기기에서는 지원하지 않아요'
		if (pushEnabled) return '알림 허용됨'
		if (permission === 'denied') return '브라우저 설정에서 허용해주세요'
		return '알림 허용하기'
	})()

	return (
		<>
			{/* 딤 배경 */}
			<div
				className="fixed inset-0 z-50 bg-black/30 transition-opacity duration-280"
				style={{ opacity: visible ? 1 : 0 }}
				onClick={handleClose}
			/>

			{/* 모달 — 아래에서 슬라이드업 */}
			<div className="fixed inset-x-0 bottom-0 z-100 flex h-[80vh] justify-center">
				<div
					className="w-full bg-white rounded-t-[28px] shadow-2xl overflow-hidden"
					style={{
						maxWidth: '480px',
						transform: visible ? 'translateY(0)' : 'translateY(100%)',
						transition: 'transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
					}}
					onClick={e => e.stopPropagation()}
				>
					{/* 핸들 */}
					<div className="flex justify-center pt-3 pb-1">
						<div className="w-10 h-1 rounded-full bg-neutral-200" />
					</div>

					{/* 헤더 */}
					<div className="flex items-center justify-between px-6 pt-3 pb-4">
						<div>
							<p className="text-xs text-neutral-400 leading-4">개인설정</p>
							<p className="text-base font-bold text-gray-900 leading-6">{memberName}님</p>
						</div>
						<button
							type="button"
							onClick={handleClose}
							className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
						>
							<X size={16} />
						</button>
					</div>

					<div className="px-4 pb-8 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 100px)' }}>

						{/* ── 앱 설치 섹션 ── */}
						{!installed && (
							<div className="rounded-2xl bg-neutral-50 overflow-hidden">
								<div className="px-4 py-3 border-b border-neutral-100">
									<p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">앱 설치</p>
								</div>

								{!showIosGuide ? (
									<div className="px-4 py-4 flex flex-col gap-3">
										<div className="flex items-start gap-3">
											<div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
												<Download size={18} className="text-primary" />
											</div>
											<div className="flex flex-col gap-0.5">
												<p className="text-sm font-semibold text-gray-900">홈 화면에 추가하기</p>
												<p className="text-xs text-neutral-500 leading-4">
													앱으로 설치하면 더 빠르고 편리하게 사용할 수 있어요
												</p>
											</div>
										</div>
										<button
											type="button"
											onClick={handleInstall}
											className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold transition-colors hover:bg-[#09a07a]"
										>
											{os === 'ios' ? '홈 화면에 추가하는 방법' : '앱 설치하기'}
										</button>
									</div>
								) : (
									<div className="px-4 py-4 flex flex-col gap-3">
										<p className="text-sm font-semibold text-gray-900">아이폰은 직접 설치해야 해요</p>
										<p className="text-xs text-neutral-500">사파리 브라우저에서 아래 순서대로 따라해주세요</p>
										<div className="flex flex-col gap-2.5">
											{[
												'브라우저는 사파리를 사용해야 해요',
												'하단 공유 버튼(□↑)을 탭하세요',
												'\'홈 화면에 추가\'를 탭하세요',
												'우측 상단 \'추가\'를 탭하면 완료!',
											].map((text, i) => (
												<div key={i} className="flex items-start gap-2.5">
													<div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
														<span className="text-[11px] font-bold text-white">{i + 1}</span>
													</div>
													<span className="text-xs text-gray-700 leading-5 pt-px">{text}</span>
												</div>
											))}
										</div>
										<button
											type="button"
											onClick={handleClose}
											className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold"
										>
											홈 화면에 추가했어요
										</button>
									</div>
								)}
							</div>
						)}

						{/* ── 푸시 알림 섹션 ── */}
						{isStandalone() && (
							<div className="rounded-2xl bg-neutral-50 overflow-hidden">
								<div className="px-4 py-3 border-b border-neutral-100">
									<p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">알림</p>
								</div>

								<button
									type="button"
									onClick={!pushEnabled && isSupported && permission !== 'denied' ? handlePush : undefined}
									disabled={isLoading || !isSupported || permission === 'denied' || pushEnabled}
									className="w-full px-4 py-4 flex items-center gap-3 text-left disabled:opacity-60"
								>
									<div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pushEnabled ? 'bg-primary/10' : 'bg-neutral-100'}`}>
										{pushEnabled
											? <Bell size={18} className="text-primary" />
											: <BellOff size={18} className="text-neutral-400" />
										}
									</div>
									<div className="flex flex-col gap-0.5 flex-1">
										<p className="text-sm font-semibold text-gray-900">운동 알림</p>
										<p className="text-xs text-neutral-500">{pushLabel}</p>
									</div>
									{!pushEnabled && isSupported && permission !== 'denied' && (
										<ChevronRight size={16} className="text-neutral-300" />
									)}
								</button>

								{/* 구독 해제 버튼 */}
								{pushEnabled && isSupported && (
									<div className="px-4 pb-4">
										<button
											type="button"
											onClick={handleUnsubscribe}
											disabled={isLoading}
											className="w-full py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-400 font-medium transition-colors hover:bg-neutral-100"
											style={{ opacity: isLoading ? 0.5 : 1 }}
										>
											{isLoading ? '처리 중...' : '알림 해제하기'}
										</button>
									</div>
								)}

								{/* 임시 디버그 메시지 — 테스트 후 삭제 */}
								{debugMessage && (
									<p className="px-4 pb-4 text-[11px] text-center break-all text-neutral-400">
										{debugMessage}
									</p>
								)}
							</div>
						)}

						{/* ── 앱 설정 섹션 ── */}
						<div className="rounded-2xl bg-neutral-50 overflow-hidden">
							<div className="px-4 py-3 border-b border-neutral-100">
								<p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">앱 설정</p>
							</div>
							<button
								type="button"
								onClick={handleReset}
								disabled={resetDone}
								className="w-full px-4 py-4 flex items-center gap-3 text-left disabled:opacity-50"
							>
								<div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
									<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
										<path d="M9 2a7 7 0 1 0 4.95 11.95" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
										<path d="M14 9V6h-3" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								</div>
								<div className="flex flex-col gap-0.5 flex-1">
									<p className="text-sm font-semibold text-gray-900">앱 초기화</p>
									<p className="text-xs text-neutral-500">
										{resetDone ? '초기화 완료! 잠시 후 재시작돼요' : '앱이 이상하게 동작할 때 초기화해보세요'}
									</p>
								</div>
								{!resetDone && <ChevronRight size={16} className="text-neutral-300" />}
							</button>
						</div>

					</div>
				</div>
			</div>
		</>
	)
}
