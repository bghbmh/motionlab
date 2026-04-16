'use client'

// src/components/studio/StudioHeader.tsx
// 신규회원 추가: 모달 → /studio/members/new 페이지 이동으로 변경

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Home, UserPlus, UserPlus2, LogOut } from 'lucide-react'
import Logo from '../ui/Logo'

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

	const today = new Date().toLocaleDateString('ko-KR', {
		month: 'long', day: 'numeric', weekday: 'short',
	})

	async function handleLogout() {
		const supabase = createClient()
		await supabase.auth.signOut()
		router.push('/login')
		router.refresh()
	}

	return (
		<header className="w-full px-5 py-3 bg-white border-b border-neutral-200 flex justify-between items-center gap-6">
			<div className="flex items-center flex-wrap gap-y-1 gap-x-3">
				<span className="font-mono hidden sm:block text-sm text-primary tracking-wider font-medium">
					{/* motion-log Studio */}
					<Logo className="h-8 w-auto -mt-1" />
				</span>
				{instructor?.studios?.name && (
					<>
						<span className="text-xs font-mono hidden sm:block">
							{instructor.studios.name}
						</span>
						<span className="text-xs font-mono hidden sm:block"> · </span>
						<span className="text-xs font-mono">
							{instructor.name}
						</span>
					</>
				)}
				<span className="text-xs font-mono hidden sm:block"> · </span>
				<span className="font-mono text-xs ">{today}</span>
			</div>

			<div className="flex items-center gap-2">

				<button onClick={() => router.push('/studio')} className="btn-ghost bg-zinc-100 hover:bg-zinc-200 text-xs py-1.5 px-3 rounded-lg">
					<Home className=' w-5' /><span className='pl-1 hidden sm:block'>홈</span>

				</button>

				{/* 모달 제거 → 페이지로 이동 */}
				<button
					onClick={() => router.push('/studio/members/new')}
					className="btn-primary text-xs py-1.5 px-3 rounded-lg"
				>
					<UserPlus2 className=' w-5' />
					<span className='pl-1 hidden sm:block'>신규회원 추가</span>
				</button>

				<button
					onClick={handleLogout}
					className="btn-ghost bg-zinc-100 hover:bg-zinc-200 text-xs py-1.5 px-3 rounded-lg transition-colors "
				>
					<LogOut className=' w-5' /><span className='pl-1 hidden sm:block'>로그아웃</span>
				</button>
			</div>
		</header>
	)
}
