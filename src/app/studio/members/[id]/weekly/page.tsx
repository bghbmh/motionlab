// app/studio/members/[id]/weekly/page.tsx
// 주간 홈트 탭 컨텐츠만 담당

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWeekStart, getEffectiveWeekStart, getWeekEnd, toLocalISO, getAllWeekStarts } from '@/lib/weekUtils'
import {
	getMember,
	getWeeklyLogs,
	getRecentNote,
	getNoteCompletions,
	getAllLoggedDates,
	getUnsentNoteCount
} from '@/lib/queries/member.queries'
import WeekSectionList from '@/components/admin/weekly/WeekSectionList'

interface PageProps {
	params: Promise<{ id: string }>
}

export default async function WeeklyPage({ params }: PageProps) {
	const { id } = await params

	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) redirect('/login')

	const member = await getMember(id)
	if (!member) notFound()

	const today = toLocalISO(new Date())
	const baseDate = member.registered_at

	// 1차: registered_at 기준으로 note fetch
	const registeredWeekStart = getCurrentWeekStart(baseDate)
	const registeredWeekEnd = getWeekEnd(registeredWeekStart)

	const [weeklyLogsAll, recentNote, loggedDates, unsentNoteCount] = await Promise.all([
		getWeeklyLogs(id, registeredWeekStart, registeredWeekEnd),
		getRecentNote(id, registeredWeekEnd),
		getAllLoggedDates(id, baseDate, today),
		getUnsentNoteCount(id), // 추가: 미전송 알림장 개수 조회
	])

	// 2차: 알림장 written_at 기준으로 실제 weekStart 재계산
	const currentWeekStart = getEffectiveWeekStart(baseDate, recentNote?.written_at)
	const currentWeekEnd = getWeekEnd(currentWeekStart)

	// weekStart 기준으로 logs 재필터링
	const weeklyLogs = weeklyLogsAll.filter(
		(l) => l.logged_at >= currentWeekStart && l.logged_at <= currentWeekEnd
	)
	const totalMets = weeklyLogs.reduce((sum, l) => sum + l.mets_score, 0)
	const noteWorkoutIds = recentNote?.note_workouts?.map((w) => w.id) ?? []
	const completions = await getNoteCompletions(noteWorkoutIds, currentWeekStart, currentWeekEnd)

	// ✅ 서버에서 주차 목록 계산 — 클라이언트에서 new Date() 호출 방지
	const baseWeeks = getAllWeekStarts(baseDate)
	const allWeeks = baseWeeks.includes(currentWeekStart)
		? baseWeeks
		: [currentWeekStart, ...baseWeeks]

	return (
		<WeekSectionList
			memberId={id}
			baseDate={baseDate}
			today={today}
			currentWeekStart={currentWeekStart}
			currentWeekData={{
				logs: weeklyLogs,
				totalMets,
				note: recentNote,
				completions,
			}}
			loggedDates={loggedDates}
			allWeeks={allWeeks}
			unsentNoteCount={unsentNoteCount} // 추가: 미전송 알림장 개수 전달
		/>
	)
}
