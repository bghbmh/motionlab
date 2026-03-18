// components/studio/MemberListSidebarContainer.tsx
import { createClient } from '@/lib/supabase/server'
import MemberListSidebar from '@/components/studio/MemberListSidebar'

export default async function MemberListSidebarContainer({ studioId }: { studioId: string }) {
	const supabase = await createClient()

	// 테스트를 위해 로딩을 보고 싶다면 여기에 await delay(2000)를 넣으세요
	const { data: members } = await supabase
		.from('members')
		.select(`
			id, name, sessions_per_week, access_token,
			workout_logs ( logged_at, mets_score, duration_min )
		`)
		.eq('studio_id', studioId)
		.eq('is_active', true)
		.order('name')



	// 특정 시간(ms)만큼 기다리게 만드는 함수
	const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
	// 🚀 테스트용 지연 추가 (3초 동안 loading.tsx가 보입니다)
	await delay(1000);

	return <MemberListSidebar members={(members ?? []) as any} />
}