// src/components/member/HelloUserInfo.tsx
// Figma: hello-user-info (36:1697) — Property 1=Default
// 안녕하세요 😄 / 이름님 > / 새 소식 알림

import Link from 'next/link'
import { ChevronRight, Bell } from 'lucide-react'
import PwaInstallModal from '@/components/member/PwaInstallModal'
import PushPermissionModal from '@/components/member/PushPermissionModal'

interface Props {
	token: string
	memberName: string
	hasNews?: boolean   // "새로운 소식이 있어요!!" 표시 여부
}

export default function HelloUserInfo({
	token,
	memberName,
	hasNews = false,
}: Props) {
	return (
		<>
			{/* PWA 설치 유도 모달 — 클라이언트에서만 렌더링 */}
			<PwaInstallModal />

			{/* 푸시 알림 허용 모달 — standalone 모드일 때만 표시 */}
			<PushPermissionModal token={token} />

			<div className="hello-user-info mt-2">
				{/* 유저 정보 */}
				<div className="flex-1 flex flex-col items-start">

					{/* 안녕하세요 😄 */}
					<div className="user-hi">
						<span>안녕하세요</span>
						<span className='emoji w-5 h-5'>
							<img src='/images/Grinning-face-with-smiling-eyes.png' />
						</span>
					</div>

					{/* 이름님 > */}
					<div
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
					</div>

					{/* <Link
						href={`/m/${token}/profile`}
						className="user-name flex items-center gap-0.5"
						style={{ textDecoration: 'none' }}
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
					</Link> */}
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
			</div>
		</>
	)
}
