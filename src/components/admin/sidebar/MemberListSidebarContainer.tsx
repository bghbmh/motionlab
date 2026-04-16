// components/studio/MemberListSidebarContainer.tsx
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import MemberListSidebar from '@/components/admin/sidebar/MemberListSidebar'

export default async function MemberListSidebarContainer({ studioId }: { studioId: string }) {
	const supabase = await createClient()

	// origin 추출 — 환경변수 없이 현재 도메인 자동 감지
	const headersList = await headers()
	const host = headersList.get('x-forwarded-host') ?? headersList.get('host') ?? ''
	const protocol = headersList.get('x-forwarded-proto') ?? 'https'
	const origin = `${protocol}://${host}`

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
	//const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
	// 🚀 테스트용 지연 추가 (3초 동안 loading.tsx가 보입니다)
	//await delay(1000);

	return (
		<MemberListSidebar
			members={(members ?? []) as any}
			origin={origin}
		/>
	)
}
