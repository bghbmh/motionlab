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

	// 1단계 — recentNote 먼저 조회해서 currentWeekStart 확정
	const recentNote = await getRecentNote(id, today)
	const currentWeekStart = getEffectiveWeekStart(baseDate, recentNote?.sent_at ?? recentNote?.written_at)
	const currentWeekEnd = getWeekEnd(currentWeekStart)

	// 2단계 — currentWeekStart 기준으로 나머지 병렬 조회
	const [weeklyLogs, allLoggedData, unsentNoteCount] = await Promise.all([
		getWeeklyLogs(id, currentWeekStart, currentWeekEnd),
		getAllLoggedDates(id, baseDate, today),
		getUnsentNoteCount(id),
	])

	const loggedDates = [...new Set(allLoggedData.map((l) => l.date))]
	const totalMets = weeklyLogs.reduce((sum, l) => sum + l.mets_score * l.duration_min, 0)  // ← 수정
	const noteWorkoutIds = recentNote?.note_workouts?.map((w) => w.id) ?? []
	const completions = await getNoteCompletions(noteWorkoutIds, currentWeekStart, currentWeekEnd)

	const baseWeeks = getAllWeekStarts(baseDate)
	const allWeeks = baseWeeks.includes(currentWeekStart)
		? baseWeeks
		: [currentWeekStart, ...baseWeeks]

	// 주차별 METs 계산
	const weekMetsMap: Record<string, number> = {}
	for (const week of allWeeks) {
		const weekEnd = getWeekEnd(week)
		weekMetsMap[week] = allLoggedData
			.filter((l) => l.date >= week && l.date <= weekEnd)
			.reduce((sum, l) => sum + l.mets_score * l.duration_min, 0)  // ← 수정
	}

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
			unsentNoteCount={unsentNoteCount}
			weekMetsMap={weekMetsMap}
		/>
	)
}
