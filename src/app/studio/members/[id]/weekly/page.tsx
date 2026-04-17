// app/studio/members/[id]/weekly/page.tsx
// 주간 홈트 탭 컨텐츠만 담당

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWeekStart, getEffectiveWeekStart, getWeekEnd, toLocalISO } from '@/lib/weekUtils'
import {
	getMember,
	getWeeklyLogs,
	getRecentNote,
	getNoteCompletions,
	getAllLoggedDates,
	getUnsentNoteCount,
	getNextNoteSentAt,
	getSentNotes
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
	const totalMets = weeklyLogs.reduce((sum, l) => sum + l.mets_score * l.duration_min, 0)
	const noteWorkoutIds = recentNote?.note_workouts?.map((w) => w.id) ?? []
	const completions = await getNoteCompletions(noteWorkoutIds, currentWeekStart, currentWeekEnd)

	// 전송된 알림장별로 주차 계산
	const sentNotes = await getSentNotes(id)
	const allWeeksSet = new Set<string>()

	for (let i = 0; i < sentNotes.length; i++) {
		const note = sentNotes[i]
		const nextNote = sentNotes[i + 1] ?? null  // 오름차순이라 i+1이 다음 알림장

		if (!note.start_at) continue

		let cursor = note.start_at
		while (true) {
			allWeeksSet.add(cursor)

			const nextDate = new Date(cursor)
			nextDate.setDate(nextDate.getDate() + 7)
			const nextCursor = toLocalISO(nextDate)

			if (nextNote?.start_at && nextCursor >= nextNote.start_at) break
			if (!nextNote && note.end_at && nextCursor > note.end_at) break  // 다음 알림장 없을 때만
			if (!nextNote && nextCursor > today) break

			cursor = nextCursor
		}
	}

	allWeeksSet.add(currentWeekStart)
	const allWeeks = [...allWeeksSet].sort((a, b) => b.localeCompare(a))

	// 주차별 METs 계산
	const weekMetsMap: Record<string, number> = {}
	for (const week of allWeeks) {
		const weekEnd = getWeekEnd(week)
		weekMetsMap[week] = allLoggedData
			.filter((l) => l.date >= week && l.date <= weekEnd)
			.reduce((sum, l) => sum + l.mets_score * l.duration_min, 0)
	}

	const nextNoteSentAt = recentNote?.sent_at
		? await getNextNoteSentAt(id, recentNote.sent_at)
		: null

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
				nextNoteSentAt
			}}
			loggedDates={loggedDates}
			allWeeks={allWeeks}
			unsentNoteCount={unsentNoteCount}
			weekMetsMap={weekMetsMap}
		/>
	)
}
