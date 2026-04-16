// app/studio/members/[id]/page.tsx
// 회원 홈 탭 컨텐츠만 담당

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWeekStart, getEffectiveWeekStart, getWeekEnd, getWeekDates } from '@/lib/weekUtils'
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

	// 1차: registered_at 기준 주차로 note fetch 범위 결정
	const registeredWeekStart = getCurrentWeekStart(member.registered_at)
	const registeredWeekEnd = getWeekEnd(registeredWeekStart)

	const [{ latest: latestInbody, previous: previousInbody }, weeklyLogsAll, recentNote, unsentNoteCount] =
		await Promise.all([
			getLatestInbodyRecords(id),
			// 넉넉하게 전달 — 알림장 기준 재계산 후 필터링
			getWeeklyLogs(id, registeredWeekStart, registeredWeekEnd),
			getRecentNote(id, registeredWeekEnd),
			getUnsentNoteCount(id), // 추가: 미전송 알림장 개수 조회
		])

	// 2차: 알림장 written_at 기준으로 실제 weekStart 재계산
	const currentWeekStart = getEffectiveWeekStart(member.registered_at, recentNote?.written_at)
	const currentWeekEnd = getWeekEnd(currentWeekStart)
	const weekDates = getWeekDates(currentWeekStart)

	// weekStart 기준으로 logs 재필터링
	const weeklyLogs = weeklyLogsAll.filter(
		(l) => l.logged_at >= currentWeekStart && l.logged_at <= currentWeekEnd
	)
	const totalMets = weeklyLogs.reduce((sum, l) => sum + l.mets_score, 0)
	const noteWorkoutIds = recentNote?.note_workouts?.map((w) => w.id) ?? []
	const completions = await getNoteCompletions(noteWorkoutIds, currentWeekStart, currentWeekEnd)


	console.log("MemberDetailPage - ", latestInbody)

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
