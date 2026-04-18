// src/app/m/[token]/notes/page.tsx
// 서버 컴포넌트 — notes + note_workouts + workout_logs 조회
// 완료 여부는 workout_logs(source='routine', note_workout_id) 기준으로 판단
//
// 주차 분리 규칙:
//   - start_at ~ end_at 기준으로 슬라이스 생성
//   - end_at 없으면 다음 알림장 start_at 하루 전까지 7일씩 분리
//   - 오늘 날짜가 포함된 주차 카드만 isLatest=true (체크 가능)
//
// 요일 날짜 표시:
//   - days가 날짜 형식('YYYY-MM-DD')이면 그대로 사용
//   - days가 요일 형식('월', '화')이면 slice.start 기준으로 날짜 계산
//
// 대체됨:
//   - 다음 알림장 start_at 이후의 dayDate는 isReplaced=true

import { createClient } from '@/lib/supabase/server'
import type { WorkoutType, Intensity } from '@/types/database'
import NoteListManager from './NoteListManager'
import type { NoteCardData, NoteDaySectionData } from '@/components/member/NoteCard'
import type { NoteWorkoutItemData } from '@/components/member/NoteWorkoutItem'
import {
	parseLocalDate,
	toLocalISO,
	formatDate,
	getDayKoShort,
	DAY_KO_SHORT,
} from '@/lib/weekUtils'

interface PageProps {
	params: Promise<{ token: string }>
}

// ─── 날짜 유틸 ────────────────────────────────────────────────

function addDays(date: Date, n: number): Date {
	const result = new Date(date)
	result.setDate(result.getDate() + n)
	return result
}

// ─── 요일 유틸 ────────────────────────────────────────────────

function getDayDate(periodStart: string, day: string): string {
	if (day === '전체') return periodStart
	const start = parseLocalDate(periodStart)
	const startDow = start.getDay()
	const targetDow = DAY_KO_SHORT.indexOf(day)
	const resolvedDow = targetDow === -1 ? startDow : targetDow
	let diff = resolvedDow - startDow
	if (diff < 0) diff += 7
	return toLocalISO(addDays(start, diff))
}

function formatDayLabel(dateStr: string, day: string): string {
	if (day === '전체') return '전체'
	const [, m, d] = dateStr.split('-').map(Number)
	return `${m}/${d} ${day}`
}

function resolveDayInfo(d: string, sliceStart: string, isDateStr: boolean): {
	dayDate: string
	dayLabel: string
} {
	if (isDateStr) {
		const [, mm, dd] = d.split('-').map(Number)
		return { dayDate: d, dayLabel: `${mm}/${dd} ${getDayKoShort(d)}` }
	} else {
		const dayDate = getDayDate(sliceStart, d)
		return { dayDate, dayLabel: formatDayLabel(dayDate, d) }
	}
}

// ─── 주차 분리 ────────────────────────────────────────────────

interface WeekSlice {
	start: string
	end: string
}

function splitIntoWeeks(
	startStr: string,
	endExclusive: string | null,
	today: string,
): WeekSlice[] {
	const slices: WeekSlice[] = []
	let cursor = parseLocalDate(startStr)

	const hardEnd = endExclusive
		? addDays(parseLocalDate(endExclusive), -1)
		: null

	while (true) {
		const sliceStart = toLocalISO(cursor)
		const sliceEnd = toLocalISO(addDays(cursor, 6))

		if (hardEnd && sliceStart > toLocalISO(hardEnd)) break

		if (hardEnd) {
			const actualEnd = sliceEnd <= toLocalISO(hardEnd) ? sliceEnd : toLocalISO(hardEnd)
			slices.push({ start: sliceStart, end: actualEnd })
		} else {
			slices.push({ start: sliceStart, end: sliceEnd })
			if (sliceStart <= today && today <= sliceEnd) break
		}

		cursor = addDays(cursor, 7)
	}

	return slices
}

// ─── 페이지 ───────────────────────────────────────────────────

export default async function NotePage({ params }: PageProps) {
	const { token } = await params
	const supabase = await createClient()

	const { data: member } = await supabase
		.from('members')
		.select('id')
		.eq('access_token', token)
		.single()

	if (!member) {
		return (
			<div className="px-2">
				<p className="text-sm text-[#7f847d] pt-4">회원 정보를 찾을 수 없습니다.</p>
			</div>
		)
	}

	const today = toLocalISO(new Date())

	const { data: notes } = await supabase
		.from('notes')
		.select(`
			id,
			written_at,
			sent_at,
			start_at,
			end_at,
			content,
			days,
			recommended_mets,
			note_workouts (
				id,
				day,
				workout_type,
				intensity,
				duration_min,
				mets,
				coach_memo,
				sort_order
			)
		`)
		.eq('member_id', member.id)
		.eq('is_sent', true)
		.order('sent_at', { ascending: false })

	if (!notes || notes.length === 0) {
		return (
			<div className="px-2">
				<p className="text-sm text-[#7f847d] pt-4">아직 받은 알림장이 없어요.</p>
			</div>
		)
	}

	const allWorkoutIds = notes.flatMap(n =>
		(n.note_workouts ?? []).map((w: any) => w.id)
	)

	const { data: routineLogs } = allWorkoutIds.length > 0
		? await supabase
			.from('workout_logs')
			.select('note_workout_id, logged_at, duration_min')
			.eq('member_id', member.id)
			.eq('source', 'routine')
			.in('note_workout_id', allWorkoutIds)
		: { data: [] }

	const completionMap = new Map<string, { logged_at: string; duration_min: number }[]>()
	for (const log of routineLogs ?? []) {
		if (!log.note_workout_id) continue
		const entries = completionMap.get(log.note_workout_id) ?? []
		entries.push({ logged_at: log.logged_at, duration_min: log.duration_min })
		completionMap.set(log.note_workout_id, entries)
	}

	const noteCards: NoteCardData[] = []

	for (let i = 0; i < notes.length; i++) {
		const note = notes[i]

		const startAt = note.start_at ?? note.sent_at ?? note.written_at ?? today
		const endAt = note.end_at ?? null

		// 다음 알림장 start_at (현재보다 최신 = notes[i-1], 최신순 정렬이므로)
		const nextNoteStartAt = i > 0
			? (notes[i - 1].start_at ?? notes[i - 1].sent_at ?? null)
			: null

		// endExclusive 결정:
		// 1. 다음 알림장 start_at 우선
		// 2. end_at 다음날
		// 3. 둘 다 없으면 null (오늘 포함 주차까지 생성)
		const endExclusive = nextNoteStartAt
			?? (i === 0 ? null : endAt ? toLocalISO(addDays(parseLocalDate(endAt), 1)) : null)

		const slices = splitIntoWeeks(startAt, endExclusive, today)

		const workouts: any[] = (note.note_workouts ?? [])
			.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

		const dayMap = workouts.reduce<Record<string, any[]>>((acc, w) => {
			const key = w.day ?? '전체'
			if (!acc[key]) acc[key] = []
			acc[key].push(w)
			return acc
		}, {})

		const rawDays: string[] = Array.isArray(note.days) ? note.days : ['전체']
		const isAllDays = rawDays.includes('전체') || rawDays.includes('매일')
		const isDayDateFormat = !isAllDays && /^\d{4}-\d{2}-\d{2}$/.test(rawDays[0] ?? '')

		const sliceCards: NoteCardData[] = slices.map((slice) => {
			const isCurrentSlice = slice.start <= today && today <= slice.end

			let noteDays: string[]
			if (isAllDays) {
				noteDays = []
				let cursor = parseLocalDate(slice.start)
				const sliceEndDate = parseLocalDate(slice.end)
				while (toLocalISO(cursor) <= toLocalISO(sliceEndDate)) {
					noteDays.push(toLocalISO(cursor))
					cursor = addDays(cursor, 1)
				}
			} else {
				noteDays = rawDays
			}

			const daySections: NoteDaySectionData[] = noteDays
				.filter(d => {
					if (isAllDays) return true
					if (isDayDateFormat) return true  // 날짜 형식은 모두 포함 (범위 밖도 isReplaced로 표시)
					return (dayMap[d]?.length ?? 0) > 0
				})
				.map(d => {
					let dayDate: string
					let dayLabel: string

					if (isAllDays) {
						const [, mm, dd] = d.split('-').map(Number)
						dayDate = d
						dayLabel = `${mm}/${dd} ${getDayKoShort(d)}`
					} else {
						const resolved = resolveDayInfo(d, slice.start, isDayDateFormat)
						dayDate = resolved.dayDate
						dayLabel = resolved.dayLabel
					}

					// 다음 알림장 start_at 이후면 대체됨
					const isReplaced = nextNoteStartAt !== null && dayDate >= nextNoteStartAt

					const workoutKey = isAllDays ? '전체' : d
					const items: NoteWorkoutItemData[] = (dayMap[workoutKey] ?? []).map((w: any) => {
						const entries = completionMap.get(w.id) ?? []
						const matchedEntry = entries.find(e => e.logged_at === dayDate)
						const completed = !!matchedEntry
						const actualMin = matchedEntry ? matchedEntry.duration_min : null
						return {
							id: w.id,
							workoutType: w.workout_type as WorkoutType,
							intensity: (w.intensity ?? 'normal') as Intensity,
							durationMin: w.duration_min ?? 0,
							actualMin,
							mets: w.mets ?? 0,
							coachMemo: w.coach_memo ?? null,
							completed,
							dayDate,
						}
					})

					return {
						id: isAllDays
							? `${note.id}-${d}`
							: `${note.id}-${d}-${slice.start}`,
						day: dayLabel,
						dayDate,
						isReplaced,
						items,
					}
				})
				.sort((a, b) => a.dayDate.localeCompare(b.dayDate))

			return {
				id: `${note.id}-${slice.start}`,
				sentAt: note.sent_at ?? note.written_at ?? today,
				direction: note.content ?? '',
				targetMets: note.recommended_mets ?? 0,
				periodStart: formatDate(slice.start),
				periodEnd: formatDate(slice.end),
				daySections,
				isCurrentSlice,
			} as NoteCardData & { isCurrentSlice: boolean }
		})

		noteCards.push(...sliceCards)
	}

	// 최신 주차 카드가 배열 앞으로
	noteCards.sort((a, b) => {
		const aDate = a.id.slice(-10)
		const bDate = b.id.slice(-10)
		return bDate.localeCompare(aDate)
	})

	const latestIdx = noteCards.findIndex(
		(c) => (c as any).isCurrentSlice === true
	)

	console.log('noteCards:', noteCards.map(c => ({
		id: c.id,
		periodStart: c.periodStart,
		periodEnd: c.periodEnd,
		isCurrentSlice: (c as any).isCurrentSlice,
	})))
	console.log('latestIdx:', latestIdx)
	console.log('today:', today)

	return (
		<NoteListManager
			memberId={member.id}
			initialNotes={noteCards}
			latestIdx={latestIdx}
		/>
	)
}
