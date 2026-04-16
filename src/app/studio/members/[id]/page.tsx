// app/studio/members/[id]/page.tsx
// 회원 홈 탭 컨텐츠만 담당

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toLocalISO, getEffectiveWeekStart, getWeekEnd, getWeekDates } from '@/lib/weekUtils'
import {
	getMember,
	getLatestInbodyRecords,
	getWeeklyLogs,
	getRecentNote,
	getNoteCompletions,
	getUnsentNoteCount,
} from '@/lib/queries/member.queries'
import MemberHomeTab from '@/components/admin/member/MemberHomeTab'

interface PageProps {
	params: Promise<{ id: string }>
}

export default async function MemberDetailPage({ params }: PageProps) {
	const { id } = await params

	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) redirect('/login')

	const member = await getMember(id)
	if (!member) notFound()

	const today = toLocalISO(new Date())
	const baseDate = member.registered_at

	// 1단계 — recentNote 먼저 조회해서 currentWeekStart 확정
	const recentNote = await getRecentNote(id, today)
	const currentWeekStart = getEffectiveWeekStart(baseDate, recentNote?.sent_at ?? recentNote?.written_at)
	const currentWeekEnd = getWeekEnd(currentWeekStart)
	const weekDates = getWeekDates(currentWeekStart)

	// 2단계 — currentWeekStart 기준으로 나머지 병렬 조회
	const [{ latest: latestInbody, previous: previousInbody }, weeklyLogs, unsentNoteCount] =
		await Promise.all([
			getLatestInbodyRecords(id),
			getWeeklyLogs(id, currentWeekStart, currentWeekEnd),
			getUnsentNoteCount(id),
		])

	const totalMets = weeklyLogs.reduce((sum, l) => sum + l.mets_score * l.duration_min, 0)
	const noteWorkoutIds = recentNote?.note_workouts?.map((w) => w.id) ?? []
	const completions = await getNoteCompletions(noteWorkoutIds, currentWeekStart, currentWeekEnd)


	console.log('currentWeekStart:', currentWeekStart)
	console.log('currentWeekEnd:', currentWeekEnd)
	console.log('weeklyLogs:', weeklyLogs)


	return (
		<MemberHomeTab
			memberId={id}
			latestInbody={latestInbody}
			previousInbody={previousInbody}
			weekStart={currentWeekStart}
			weekEnd={currentWeekEnd}
			weekDates={weekDates}
			weeklyLogs={weeklyLogs}
			totalMets={totalMets}
			recentNote={recentNote}
			completions={completions}
			unsentNote={unsentNoteCount > 0}

		/>
	)
}
