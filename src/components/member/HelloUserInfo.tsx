'use client'
// src/components/member/HelloUserInfo.tsx
// Figma: hello-user-info (36:1697) — Property 1=Default
// 안녕하세요 😄 / 이름님 > / 새 소식 알림

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Bell } from 'lucide-react'
import PwaInstallModal from '@/components/member/PwaInstallModal'
import PushPermissionModal from '@/components/member/PushPermissionModal'
import ProfileModal from '@/components/member/ProfileModal'

interface Props {
	token: string
	memberName: string
	hasNews?: boolean   // "새로운 소식이 있어요!!" 표시 여부
	autoOpenProfile?: boolean
	registeredAt: string   // 'YYYY-MM-DD' 형식, 프로필 모달에서 7일 이내 여부 판단용
}

export default function HelloUserInfo({
	token,
	memberName,
	hasNews = false,
	autoOpenProfile = false,
	registeredAt,
}: Props) {

	const [showProfile, setShowProfile] = useState(autoOpenProfile)

	return (
		<>
			{/* PWA 설치 유도 모달 — 클라이언트에서만 렌더링 */}
			<PwaInstallModal />

			{/* 푸시 알림 허용 모달 — standalone 모드일 때만 표시 */}
			<PushPermissionModal token={token} />

			<div className="hello-user-info mt-5">
				{/* 유저 정보 */}
				<div className="flex-1 flex flex-col items-start">

					{/* 안녕하세요 😄 */}
					<div className="user-hi">
						<span>안녕하세요</span>
						<span className='emoji block w-5 h-5 relative '>
							<img src='/images/Grinning_face_animated.svg'
								style={{
									position: 'absolute',
									display: 'block',
									top: '50%',
									left: '50%',
									width: '180%',
									height: '180%',
									transform: 'translate(-50%, -50%)',
									maxWidth: 'none',
								}} />
						</span>
					</div>

					{/* 이름님 > */}
					<button
						type="button"
						onClick={() => setShowProfile(true)}
						className="user-name flex items-center gap-0.5"
					>
						<div className="flex items-baseline gap-0.5">
							<span className="text-lg font-bold leading-7 text-gray-900">
								{memberName}
							</span>
							<span className="text-lg font-light leading-7 text-gray-900">
								님
							</span>
						</div>
						<ChevronRight size={20} style={{ color: 'var(--m-text)' }} />
					</button>
				</div>

				{/* 새 소식 알림 — hasNews일 때만 */}
				{hasNews && (
					<Link
						href={`/m/${token}/notifications`}
						className="flex items-center gap-1 py-2 shrink-0 no-underline"
					>
						<div
							className="flex items-center justify-center rounded-[10px]"
							style={{ width: 16, height: 16 }}
						>
							<span className='emoji w-5 h-5'>
								<img src='/images/Bell.png' />
							</span>
						</div>
						<span className="text-xs font-medium text-gray-800 whitespace-nowrap">
							새로운 소식이 있어요!!
						</span>
					</Link>
				)}

				{showProfile && (
					<ProfileModal
						token={token}
						memberName={memberName}
						registeredAt={registeredAt}
						onClose={() => setShowProfile(false)}
					/>
				)}
			</div>
		</>
	)
}
