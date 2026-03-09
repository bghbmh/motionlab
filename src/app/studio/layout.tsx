import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudioHeader from '@/components/studio/StudioHeader'
import MemberListSidebar from '@/components/studio/MemberListSidebar'

export default async function StudioLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()

	if (!user) redirect('/login')

	// 강사 정보
	const { data: instructor } = await supabase
		.from('instructors')
		.select('*, studios(name)')
		.eq('id', user.id)
		.single()

	// 회원 목록 (사이드바용 - 운동 기록 포함)
	const { data: members } = await supabase
		.from('members')
		.select(`
			id, name, sessions_per_week, access_token,
			workout_logs ( logged_at, mets_score )
		`)
		.eq('studio_id', instructor?.studio_id ?? '')
		.eq('is_active', true)
		.order('name')

	return (
		<div className="min-h-screen bg-navy flex flex-col">
			<StudioHeader instructor={instructor} />

			{/* 헤더 아래 전체 영역 */}
			<div
				className="flex flex-1 overflow-hidden"
				style={{ height: 'calc(100vh - 52px)' }}
			>
				{/* 왼쪽: 회원 목록 사이드바 */}
				<MemberListSidebar members={(members ?? []) as any} />

				{/* 오른쪽: 페이지 콘텐츠 */}
				<main className="flex-1 overflow-y-auto p-5">
					{children}
				</main>
			</div>
		</div>
	)
}
