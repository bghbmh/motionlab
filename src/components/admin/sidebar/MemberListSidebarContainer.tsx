import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import MemberListSidebar from '@/components/admin/sidebar/MemberListSidebar'

export default async function MemberListSidebarContainer({ studioId }: { studioId: string }) {
	const supabase = await createClient()

	const headersList = await headers()
	const host = headersList.get('x-forwarded-host') ?? headersList.get('host') ?? ''
	const protocol = headersList.get('x-forwarded-proto') ?? 'https'
	const origin = `${protocol}://${host}`

	// KST 기준 주 시작일 계산 (서버에서)
	const now = new Date()
	const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000)
	const dayOfWeek = kstDate.getUTCDay()
	const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
	const monday = new Date(kstDate)
	monday.setUTCDate(kstDate.getUTCDate() + daysToMonday)
	const weekStart = monday.toISOString().split('T')[0]

	const { data: members } = await supabase
		.from('members')
		.select(`id, name, sessions_per_week, access_token, workout_logs ( logged_at, mets_score, duration_min )`)
		.eq('studio_id', studioId)
		.eq('is_active', true)
		.order('name')

	return (
		<MemberListSidebar
			members={(members ?? []) as any}
			origin={origin}
			weekStart={weekStart}  // ← 추가
		/>
	)
}