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
								<p className="flex gap-2 items-center text-[16px] font-semibold text-gray-900 leading-6">
									<span className='w-10 h- block rounded-md border border-neutral-300'>
										<svg width="96" height="96" viewBox="0 0 96 96" fill="none" className='w-full h-full object-contain'>
											<rect width="96" height="96" rx="48" fill="white" />
											<path d="M65.59 42.0834C65.59 41.5617 65.1669 41.1386 64.6452 41.1386H54.7273V37.3604H64.6452C67.2536 37.3604 69.3682 39.475 69.3682 42.0834V68.5311H65.59V42.0834Z" fill="#FEBC12" />
											<path d="M80.2303 41.7527C80.2302 42.5699 79.8354 43.3368 79.1703 43.8118L76.9245 45.4157V68.5306H73.1463V43.4717L76.4344 41.1225C75.9497 32.0411 65.0349 27.4097 58.1574 33.6424L49.3837 41.5934L46.8463 38.7938L55.62 30.8423C65.0832 22.2664 80.2303 28.9816 80.2303 41.7527Z" fill="#001769" />
											<path d="M76.9244 50.9243C76.9244 50.652 76.8064 50.3931 76.6015 50.2137L73.1457 47.1897V42.082C73.1457 35.5014 65.2867 32.0998 60.489 36.6037L53.1864 43.4595L50.6 40.7049L57.903 33.8492C65.1131 27.0805 76.9244 32.1925 76.9244 42.082V45.4755L79.0894 47.37C80.1143 48.2668 80.7026 49.5625 80.7026 50.9243V68.5301H76.9244V50.9243Z" fill="#06EDC4" />
											<path d="M69.368 68.53V42.0818C69.368 38.2204 64.591 36.4106 62.0326 39.3028L61.8096 39.5551L61.7714 39.5983L55.1995 46.1702V68.53H51.4213V44.6055L59.0164 37.0098L59.2026 36.7996C64.0659 31.3019 73.1462 34.7417 73.1462 42.0818V68.53C73.1462 69.8341 74.2036 70.8915 75.5077 70.8915H76.9244V74.6697H75.5077C72.1169 74.6697 69.368 71.9208 69.368 68.53Z" fill="#FF4B40" />
											<path d="M47.643 42.082C47.643 35.5014 39.784 32.0998 34.9863 36.6037L27.6837 43.4595L25.0973 40.7049L32.4004 33.8492C39.6104 27.0805 51.4217 32.1925 51.4217 42.082V68.5301H47.643V42.082Z" fill="#001769" />
											<path d="M46.8534 60.3991C47.432 61.2672 47.1971 62.4401 46.329 63.0188C45.461 63.5974 44.288 63.3625 43.7093 62.4945L37.0977 52.5765C36.519 51.7084 36.7534 50.5354 37.6215 49.9567C38.4896 49.3781 39.6626 49.613 40.2413 50.4811L46.8534 60.3991Z" fill="#FEBC12" />
											<path d="M43.8648 42.082C43.8648 38.1967 39.065 36.3682 36.4799 39.2687L27.8008 49.0063L24.9801 46.4924L33.6597 36.7547C38.5548 31.2627 47.643 34.725 47.643 42.082V68.5302H43.8648V42.082Z" fill="#06EDC4" />
											<path d="M27.3344 47.656C27.3343 46.962 27.0795 46.292 26.6184 45.7733L25.2262 44.2071C24.1504 42.9968 23.5562 41.4337 23.5562 39.8143V29.8027H27.3344V39.8143C27.3344 40.5083 27.5892 41.1784 28.0503 41.6971L29.4425 43.2633C30.5183 44.4736 31.1125 46.0367 31.1126 47.656V68.5304H27.3344V47.656Z" fill="#FEBC12" />
											<path d="M54.7266 41.7527C54.7265 42.5699 54.3317 43.3368 53.6667 43.8118L50.6294 45.9813C49.7804 46.5876 48.6009 46.3911 47.9945 45.5422C47.388 44.6932 47.5845 43.5132 48.4335 42.9067L50.9308 41.1225C50.4461 32.0411 39.5312 27.4097 32.6538 33.6424L23.8801 41.5934C23.107 42.294 21.912 42.2352 21.2113 41.4621C20.5109 40.689 20.5697 39.4944 21.3427 38.7938L30.1163 30.8423C39.5795 22.2664 54.7266 28.9816 54.7266 41.7527Z" fill="#FEBC12" />
											<path d="M40.0864 42.0823C40.0864 41.5606 39.6633 41.1375 39.1416 41.1375H31.1128C29.0261 41.1374 27.3346 39.4459 27.3346 37.3592V29.8027H31.1128V37.3592H39.1416C41.75 37.3592 43.8646 39.4739 43.8646 42.0823V68.5304H40.0864V42.0823Z" fill="#FF4B40" />
											<path d="M16 29.8027H19.7782V68.5304H16V29.8027Z" fill="#FEBC12" />
											<path d="M48.4848 42.8717C49.3529 42.2931 50.5258 42.528 51.1045 43.3961C51.6831 44.2642 51.4482 45.4371 50.5802 46.0158L40.6623 52.6275C39.7942 53.2062 38.6212 52.9717 38.0425 52.1037C37.4639 51.2355 37.6988 50.0626 38.5669 49.4839L48.4848 42.8717Z" fill="#FEBC12" />
											<path d="M19.7787 29.8027H23.5569V68.5304H19.7787V29.8027Z" fill="#001769" />
											<path d="M23.5564 48.1284C23.5564 47.4344 23.302 46.7644 22.841 46.2457L17.6701 40.4289C16.5942 39.2185 16 37.6554 16 36.0361V29.8027H19.7782V36.0361C19.7782 36.7301 20.0331 37.4002 20.4942 37.9188L25.6646 43.7357C26.7404 44.946 27.3346 46.509 27.3346 48.1284V68.5304H23.5564V48.1284Z" fill="#06EDC4" />
										</svg>
									</span>
									앱으로 더 편리하게 사용하세요
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
									{ step: '1', text: '브라우저는 사파리를 사용해야 해요' },
									{ step: '2', text: '하단 공유 버튼(□↑)을 탭하세요' },
									{ step: '3', text: '\'홈 화면에 추가\'를 탭하세요' },
									{ step: '4', text: '우측 상단 \'추가\'를 탭하면 완료!' },
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
