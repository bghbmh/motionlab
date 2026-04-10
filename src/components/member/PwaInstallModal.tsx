'use client'
// src/components/member/PwaInstallModal.tsx
// PWA 설치 유도 모달
//
// 위치: 화면 상단 — 헤더 알림 버튼 아래 말풍선 형태
// OS별 동작:
//   Android → "앱 설치" 클릭 시 브라우저 설치 프롬프트 실행 → 설치 완료 시 자동 닫힘
//   iOS     → "홈 화면에 추가" 클릭 시 3단계 안내로 전환
//             → "홈 화면에 추가했어요" 클릭 시 닫힘
//
// 표시 규칙:
//   - standalone 모드(설치 완료)면 표시 안 함
//   - "오늘 하루 안 보기" 클릭 → 오늘 하루 숨김 (localStorage)

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'pwa_install_dismissed_date'

function isStandalone(): boolean {
	if (typeof window === 'undefined') return false
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		('standalone' in window.navigator && (window.navigator as any).standalone === true)
	)
}

function todayStr(): string {
	return new Date().toISOString().split('T')[0]
}

function isIOS(): boolean {
	if (typeof window === 'undefined') return false
	return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export default function PwaInstallModal() {
	const [visible, setVisible] = useState(false)
	const [showIosGuide, setShowIosGuide] = useState(false)
	const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
	const [os, setOs] = useState<'ios' | 'android' | 'other'>('other')

	useEffect(() => {
		if (isStandalone()) return

		const dismissed = localStorage.getItem(STORAGE_KEY)
		if (dismissed === todayStr()) return

		setOs(isIOS() ? 'ios' : 'android')

		const handler = (e: Event) => {
			e.preventDefault()
			setDeferredPrompt(e)
		}
		window.addEventListener('beforeinstallprompt', handler)
		setVisible(true)

		return () => {
			window.removeEventListener('beforeinstallprompt', handler)
		}
	}, [])

	if (!visible) return null

	function handleDismiss() {
		localStorage.setItem(STORAGE_KEY, todayStr())
		setVisible(false)
	}

	async function handleInstall() {
		if (os === 'ios') {
			setShowIosGuide(true)
			return
		}
		if (deferredPrompt) {
			deferredPrompt.prompt()
			const { outcome } = await deferredPrompt.userChoice
			if (outcome === 'accepted') {
				setVisible(false)
			}
			setDeferredPrompt(null)
		} else {
			setShowIosGuide(true)
		}
	}

	return (
		<>
			{/* 모달 컨테이너 — 헤더 높이(약 56px) 바로 아래, 우측 정렬 */}
			<div className=" relative mt-5 " style={{ marginBottom: '-10px' }}>


				{/* 모달 본체 */}
				{/** border border-neutral-300 */}
				<div className="bg-white rounded-[24px]  overflow-hidden shadow-[0px_0px_16px_0px_rgba(0,0,0,0.1),0px_10px_10px_0px_rgba(0,0,0,0.04)] ">

					{!showIosGuide ? (
						/* ── 기본 모달 ── */
						<div className="flex flex-col gap-[16px] p-[24px]">

							{/* 닫기 버튼 */}
							<button
								type="button"
								onClick={handleDismiss}
								className="absolute top-[18px] right-[18px] opacity-70"
								aria-label="닫기"
							>
								<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
									<path d="M11 1L1 11M1 1L11 11" stroke="#020618" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</button>

							{/* 헤더 */}
							<div className="flex flex-col gap-[6px] pr-[24px]">
								<p className="text-[16px] font-semibold text-gray-900 leading-6">
									앱으로 더 편리하게 사용하세요 📲
								</p>
							</div>

							{/* 장점 목록 */}
							<div className="flex flex-col gap-[6px]">
								{[
									'홈 화면에서 바로 실행할 수 있어요',
									'알림을 받을 수 있어요',
									'더 빠르게 로딩돼요',
								].map((text) => (
									<div key={text} className="flex items-center gap-[6px]">
										<svg width="2" height="2" viewBox="0 0 2 2" fill="none">
											<circle cx="1" cy="1" r="1" fill="#82827C" />
										</svg>
										<span className="text-[12px] text-[#525252] leading-4">{text}</span>
									</div>
								))}
							</div>

							{/* 버튼 */}
							<div className="flex gap-[10px] pt-[4px]">
								<button
									type="button"
									onClick={handleDismiss}
									className=" bg-[#f1f5f9] text-[#364153] text-[14px] font-medium rounded-[8px] px-[16px] py-[12px] leading-5"
								>
									오늘 하루 안 보기
								</button>
								<button
									type="button"
									onClick={handleInstall}
									className="flex-1 bg-[#0bb489] text-white text-[14px] font-medium rounded-[8px] px-[16px] py-[12px] leading-5"
								>
									{os === 'ios' ? '홈 화면에 추가' : '앱 설치'}
								</button>
							</div>
						</div>

					) : (
						/* ── iOS 홈 화면 추가 안내 ── */
						<div className="flex flex-col gap-[16px] p-[24px]">

							<div className="flex flex-col gap-[6px]">
								<p className="text-[16px] font-semibold text-gray-900 leading-6">
									홈 화면에 추가하는 방법
								</p>
								<p className="text-[12px] text-[#525252] leading-4">
									Safari 브라우저에서 아래 순서대로 따라해주세요
								</p>
							</div>

							<div className="flex flex-col gap-[12px]">
								{[
									{ step: '1', text: '하단 공유 버튼(□↑)을 탭하세요' },
									{ step: '2', text: '\'홈 화면에 추가\'를 탭하세요' },
									{ step: '3', text: '우측 상단 \'추가\'를 탭하면 완료!' },
								].map(({ step, text }) => (
									<div key={step} className="flex items-start gap-[10px]">
										<div className="shrink-0 w-[20px] h-[20px] rounded-full bg-[#0bb489] flex items-center justify-center">
											<span className="text-[11px] font-bold text-white">{step}</span>
										</div>
										<span className="text-[13px] text-gray-700 leading-5 pt-[1px]">{text}</span>
									</div>
								))}
							</div>

							<button
								type="button"
								onClick={handleDismiss}
								className="w-full bg-[#0bb489] text-white text-[14px] font-medium rounded-[8px] px-[16px] py-[12px] leading-5"
							>
								홈 화면에 추가했어요
							</button>
						</div>
					)}
				</div>

				{/* 말풍선 꼬리 — 모달 위 우측 */}
				<div className="absolute flex justify-end pr-[12px]"
					style={{ bottom: "-6px", right: '32px' }}>
					<div className="rotate-45 w-[12px] h-[12px] bg-white mt-[6px]"
					/>
					{/** style={{ borderRight: '1px solid var(--color-neutral-300)', borderBottom: '1px solid var(--color-neutral-300)' }}  */}
				</div>
			</div>
		</>
	)
}
