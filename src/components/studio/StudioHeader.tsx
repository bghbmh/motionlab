'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NewMemberModal from './NewMemberModal'

interface Props {
	instructor: {
		name: string
		role: string
		studio_id: string
		studios?: { name: string } | null
	} | null
}

export default function StudioHeader({ instructor }: Props) {
	const router = useRouter()
	const [showModal, setShowModal] = useState(false)

	const today = new Date().toLocaleDateString('ko-KR', {
		month: 'long',
		day: 'numeric',
		weekday: 'short',
	})

	async function handleLogout() {
		const supabase = createClient()
		await supabase.auth.signOut()
		router.push('/login')
		router.refresh()
	}

	return (
		<>
			<header className="bg-card border-b border-white/[0.07] px-5 py-3
                         flex items-center justify-between">
				<div className="flex items-center gap-3">
					<span className="font-mono text-sm text-mint tracking-wider font-medium">
						motion-log Studio
					</span>
					{instructor?.studios?.name && (
						<span className="text-xs text-white/70 font-mono">
							· {instructor.studios.name} · {instructor.name}
						</span>
					)}
				</div>

				<div className="flex items-center gap-3">
					{/* 오늘 날짜 */}
					<span className="font-mono text-xs text-white/70">{today}</span>

					{/* 회원목록 버튼 */}
					<button
						onClick={() => router.push('/studio')}
						className="btn-ghost text-xs py-1.5 px-3"
					>
						홈
					</button>

					{/* 신규회원 추가 */}
					<button
						onClick={() => setShowModal(true)}
						className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
					>
						<span className="text-base leading-none">＋</span>
						신규회원 추가
					</button>

					{/* 로그아웃 */}
					<button
						onClick={handleLogout}
						className="text-xs text-white/50 hover:text-white/70 transition-colors ml-5"
					>
						로그아웃
					</button>
				</div>
			</header>

			{showModal && (
				<NewMemberModal
					studioId={instructor?.studio_id ?? ''}
					onClose={() => setShowModal(false)}
					onSuccess={() => {
						setShowModal(false)
						router.refresh()
					}}
				/>
			)}
		</>
	)
}
