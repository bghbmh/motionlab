// app/studio/members/[id]/layout.tsx

import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { ActivityLevel } from '@/types/ui'
import {
	getCurrentWeekStart,
	getEffectiveWeekStart,
	getWeekEnd,
} from '@/lib/weekUtils'
import {
	getMember,
	getWeeklyLogsSummary,
	getRecentNoteTargetMets,
} from '@/lib/queries/member.queries'
import MemberInfoBar from '@/components/admin/member/MemberInfoBar'
import MemberTabNav from '@/components/admin/member/MemberTabNav'

function calcActivityLevel(totalMets: number, targetMets: number): ActivityLevel {
	const rate = totalMets / targetMets
	if (rate >= 0.8) return 'high'
	if (rate >= 0.4) return 'normal'
	return 'low'
}

export default async function MemberDetailLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ id: string }>
}) {
	const { id } = await params

	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) redirect('/login')

	// origin 추출
	const headersList = await headers()
	const host = headersList.get('x-forwarded-host') ?? headersList.get('host') ?? ''
	const protocol = headersList.get('x-forwarded-proto') ?? 'https'
	const origin = `${protocol}://${host}`

	const member = await getMember(id)
	if (!member) notFound()

	// layout의 MemberInfoBar용 — 간략한 이번 주 통계
	// 정확한 알림장 기준 기간은 각 page에서 처리
	const currentWeekStart = getCurrentWeekStart(member.registered_at)
	const currentWeekEnd = getWeekEnd(currentWeekStart)

	const [weeklyLogs, targetMets] = await Promise.all([
		getWeeklyLogsSummary(id, currentWeekStart, currentWeekEnd),
		getRecentNoteTargetMets(id),
	])

	const totalMets = weeklyLogs.reduce((sum, l) => sum + l.mets_score, 0)
	const activityLevel = calcActivityLevel(totalMets, targetMets)
	const activeDays = new Set(weeklyLogs.map((l) => l.logged_at)).size
	const weeklyVisits = `주 ${activeDays}일`

	return (
		<div className="flex flex-col gap-2">
			<MemberInfoBar
				member={member}
				activityLevel={activityLevel}
				weeklyVisits={weeklyVisits}
				memberUrl={`${origin}/m/${member.access_token}`}
			/>
			<div className=' -mx-4 overflow-x-auto [&::-webkit-scrollbar]:hidden '
				style={{
					scrollbarWidth: 'none',
					msOverflowStyle: 'none',
				}}>
				<MemberTabNav memberId={id} />
			</div>
			{children}
		</div>
	)
}
