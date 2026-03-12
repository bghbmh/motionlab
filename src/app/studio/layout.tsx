
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudioHeader from '@/components/studio/StudioHeader'
import MemberListSidebarContainer from '@/components/studio/MemberListSidebarContainer';
import SidebarLoading from '@/components/studio/SidebarLoading';

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

	return (
		<div className="min-h-screen bg-navy flex flex-col">
			<StudioHeader instructor={instructor} />

			{/* 헤더 아래 전체 영역 */}
			<div
				className="flex flex-1 overflow-hidden"
				style={{ height: 'calc(100vh - 52px)' }}
			>
				{/* 왼쪽: 회원 목록 사이드바 */}
				{/* ✅ 사이드바 영역만 독립적으로 로딩 처리 */}
				<Suspense fallback={<SidebarLoading />}>
					<MemberListSidebarContainer studioId={instructor?.studio_id ?? ''} />
				</Suspense>

				{/* 오른쪽: 페이지 콘텐츠 */}
				<main className="flex-1 overflow-y-auto p-5">
					{children}
				</main>
			</div>
		</div>
	)
}
