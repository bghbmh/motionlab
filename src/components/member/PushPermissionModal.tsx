'use client'
// src/components/member/PushPermissionModal.tsx
// standalone 모드(홈 화면 앱)로 실행 시 1회 표시
// 푸시 알림 허용 요청 커스텀 모달
//
// 표시 조건:
//   - standalone 모드일 때만
//   - 푸시 알림 미허용 상태
//   - 이미 구독 중이 아닌 경우
//   - "나중에" 클릭으로 닫지 않은 경우

import { useState, useEffect } from 'react'
import { usePushNotification } from '@/hooks/usePushNotification'

interface Props {
	token: string
}

function isStandalone(): boolean {
	if (typeof window === 'undefined') return false
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		('standalone' in window.navigator && (window.navigator as any).standalone === true)
	)
}

export default function PushPermissionModal({ token }: Props) {
	const { permission, isSubscribed, isLoading, isSupported, subscribe } =
		usePushNotification({ token })

	const [visible, setVisible] = useState(false)

	useEffect(() => {

		console.log('standalone:', isStandalone())
		console.log('isSupported:', isSupported)
		console.log('permission:', permission)
		console.log('isSubscribed:', isSubscribed)

		alert(`standalone: ${isStandalone()}\nisSupported: ${isSupported}\npermission: ${permission}\nisSubscribed: ${isSubscribed}`)
		// standalone 모드가 아니면 표시 안 함
		if (!isStandalone()) return

		// 푸시 미지원이면 표시 안 함
		if (!isSupported) return

		// 이미 허용됐거나 구독 중이면 표시 안 함
		if (permission === 'granted' || isSubscribed) return

		setVisible(true)
	}, [permission, isSubscribed, isSupported])

	if (!visible) return null

	function handleDismiss() {
		setVisible(false)
	}

	async function handleAllow() {
		await subscribe()
		setVisible(false)
	}

	return (
		<>
			{/* 배경 딤 */}
			<div className="fixed inset-0 z-50 bg-black/30" />

			{/* 모달 */}
			<div
				className="fixed z-50 left-1/2 -translate-x-1/2"
				style={{ bottom: '80px', width: 'calc(100% - 32px)', maxWidth: '400px' }}
			>
				<div className="bg-white rounded-[24px] shadow-[0px_20px_25px_0px_rgba(0,0,0,0.1),0px_10px_10px_0px_rgba(0,0,0,0.04)] overflow-hidden">
					<div className="flex flex-col gap-[16px] p-[24px]">

						{/* 헤더 */}
						<div className="flex flex-col gap-[6px]">
							<p className="text-[16px] font-semibold text-gray-900 leading-6">
								운동 알림을 받으시겠어요? 🔔
							</p>
							<p className="text-[13px] text-[#525252] leading-5">
								새 알림장이 도착하거나 운동할 시간이 되면 알려드려요
							</p>
						</div>

						{/* 장점 목록 */}
						<div className="flex flex-col gap-[6px]">
							{[
								'새 알림장 도착 시 바로 알림',
								'운동 요일마다 운동 권유 알림',
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
								className="flex-1 bg-[#f1f5f9] text-[#364153] text-[14px] font-medium rounded-[8px] px-[16px] py-[12px] leading-5"
							>
								나중에
							</button>
							<button
								type="button"
								onClick={handleAllow}
								disabled={isLoading}
								className="flex-1 bg-[#0bb489] text-white text-[14px] font-medium rounded-[8px] px-[16px] py-[12px] leading-5"
								style={{ opacity: isLoading ? 0.6 : 1 }}
							>
								{isLoading ? '설정 중...' : '알림 허용'}
							</button>
						</div>

					</div>
				</div>
			</div>
		</>
	)
}
