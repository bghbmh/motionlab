// src/app/m/[token]/note/page.tsx
// 서버 컴포넌트 — notes + note_workouts + workout_logs 조회
// 완료 여부는 workout_logs(source='routine', note_workout_id) 기준으로 판단
// note_workout_completions 테이블 미사용
//
// 주차 분리 규칙:
//   - 알림장 발송일(written_at) 기준으로 7일씩 분리
//   - 다음 알림장 발송일이 있으면 그 하루 전에서 끊김 (7일 미만 가능)
//   - 오늘 날짜가 포함된 주차 카드만 isLatest=true (체크 가능)
//
// 요일 날짜 표시:
//   - 각 주차 시작일 기준으로 요일별 실제 날짜 계산
//   - ex) '월요일' → '4/7 월요일'

import { createClient } from '@/lib/supabase/server'
import type { WorkoutType, Intensity } from '@/types/database'
import NoteListManager from './NoteListManager'
import type { NoteCardData, NoteDaySectionData } from '@/components/member/NoteCard'
import type { NoteWorkoutItemData } from '@/components/member/NoteWorkoutItem'

interface PageProps {
	params: Promise<{ token: string }>
}

// ─── 날짜 유틸 ────────────────────────────────────────────────

// 'YYYY-MM-DD' → Date (로컬 기준, 시간 없음)
function parseDate(dateStr: string): Date {
	const [y, m, d] = dateStr.split('-').map(Number)
	return new Date(y, m - 1, d)
}

// Date → 'YYYY-MM-DD'
function toISO(date: Date): string {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

// 'YYYY-MM-DD' → 'YY.MM.DD'
function toShortDate(dateStr: string): string {
	const [y, m, d] = dateStr.split('-')
	return `${y.slice(2)}.${m}.${d}`
}

// date에 n일 더하기
function addDays(date: Date, n: number): Date {
	const result = new Date(date)
	result.setDate(result.getDate() + n)
	return result
}

// ─── 요일 유틸 ────────────────────────────────────────────────

const DAY_NAMES: Record<string, string> = {
	'전체': '전체',
	'월': '월요일', '화': '화요일', '수': '수요일',
	'목': '목요일', '금': '금요일', '토': '토요일', '일': '일요일',
}

// 요일 약자 → 숫자 (일=0, 월=1, ..., 토=6)
const DAY_INDEX: Record<string, number> = {
	'일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6,
}

// 주차 시작일(periodStart)을 기준으로 요일 약자에 해당하는 실제 날짜 계산
// ex) periodStart='2025-04-07(월)', day='목' → '2025-04-10'
function getDayDate(periodStart: string, day: string): string {
	if (day === '전체') return periodStart
	const start = parseDate(periodStart)
	const startDow = start.getDay()           // 0=일 ~ 6=토
	const targetDow = DAY_INDEX[day] ?? startDow
	let diff = targetDow - startDow
	if (diff < 0) diff += 7
	return toISO(addDays(start, diff))
}

// '4/7 월요일' 형식으로 변환
function formatDayLabel(dateStr: string, dayName: string): string {
	if (dayName === '전체') return '전체'
	const [, m, d] = dateStr.split('-').map(Number)
	return `${m}/${d} ${dayName}`
}

// ─── 주차 분리 ────────────────────────────────────────────────

interface WeekSlice {
	start: string   // 'YYYY-MM-DD'
	end: string     // 'YYYY-MM-DD'
}

// 알림장 발송일부터 종료일(exclusive)까지를 7일 단위로 분리
// endExclusive: 다음 알림장 발송일 or null(진행중)
// today: 오늘 날짜 — 진행중인 경우 오늘까지만 슬라이스
function splitIntoWeeks(
	startStr: string,
	endExclusive: string | null,
	today: string,
): WeekSlice[] {
	const slices: WeekSlice[] = []
	let cursor = parseDate(startStr)
	const hardEnd = endExclusive
		? addDays(parseDate(endExclusive), -1)  // 다음 알림장 하루 전
		: parseDate(today)                       // 오늘

	while (toISO(cursor) <= toISO(hardEnd)) {
		const sliceEnd = addDays(cursor, 6)      // cursor + 6일 = 7일 구간
		const actualEnd = toISO(sliceEnd) <= toISO(hardEnd) ? sliceEnd : hardEnd
		slices.push({
			start: toISO(cursor),
			end: toISO(actualEnd),
		})
		cursor = addDays(cursor, 7)              // 다음 주차 시작
	}

	return slices
}

// ─── 페이지 ───────────────────────────────────────────────────

export default async function NotePage({ params }: PageProps) {
	const { token } = await params
	const supabase = await createClient()

	// 1. 회원 조회
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

	const today = toISO(new Date())

	// 2. 알림장 목록 조회 (발송된 것만, 최신순) + note_workouts join
	const { data: notes } = await supabase
		.from('notes')
		.select(`
			id,
			written_at,
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
		.order('written_at', { ascending: false })

	if (!notes || notes.length === 0) {
		return (
			<div className="px-2">
				<p className="text-sm text-[#7f847d] pt-4">아직 받은 알림장이 없어요.</p>
			</div>
		)
	}

	// 3. 완료된 운동 조회 — workout_logs(source='routine') 기준
	// note_workout_completions 대신 workout_logs를 단일 진실 공급원으로 사용
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

	// Map<note_workout_id, { logged_at, duration_min }[]> — 주차별 완료 여부 + 실제 시간 판단용
	const completionMap = new Map<string, { logged_at: string; duration_min: number }[]>()
	for (const log of routineLogs ?? []) {
		if (!log.note_workout_id) continue
		const entries = completionMap.get(log.note_workout_id) ?? []
		entries.push({ logged_at: log.logged_at, duration_min: log.duration_min })
		completionMap.set(log.note_workout_id, entries)
	}

	// 4. 알림장별로 주차 분리 → NoteCardData[] 생성
	// notes는 최신순 정렬 — notes[i]의 다음 알림장은 notes[i-1] (더 최신)
	// 주차 카드는 최신이 위로 오도록 최종 배열을 앞에 unshift
	const noteCards: NoteCardData[] = []

	for (let i = 0; i < notes.length; i++) {
		const note = notes[i]
		const writtenAt = note.written_at ?? today

		// 다음 알림장 발송일 (현재 note보다 더 최신 = notes[i-1])
		const nextNoteDate = i > 0 ? (notes[i - 1].written_at ?? null) : null

		// 7일 단위 주차 슬라이스
		const slices = splitIntoWeeks(writtenAt, nextNoteDate, today)

		const workouts: any[] = (note.note_workouts ?? [])
			.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

		// 요일별 그룹핑
		const dayMap = workouts.reduce<Record<string, any[]>>((acc, w) => {
			const key = w.day ?? '전체'
			if (!acc[key]) acc[key] = []
			acc[key].push(w)
			return acc
		}, {})

		const noteDays: string[] = Array.isArray(note.days) ? note.days : ['전체']

		// 각 주차 슬라이스를 카드로 변환
		// slices는 오래된 순 — 최신이 위로 오도록 reverse 후 noteCards 앞에 삽입
		const sliceCards: NoteCardData[] = slices.map((slice) => {
			const isCurrentSlice = slice.start <= today && today <= slice.end

			// 해당 주차에서 완료된 workout 판단
			// completed_date가 이 주차 기간 안에 있으면 완료로 간주
			const daySections: NoteDaySectionData[] = noteDays
				.filter(d => dayMap[d]?.length > 0)
				.map(d => {
					// 요일의 실제 날짜 계산
					const dayDate = getDayDate(slice.start, d)
					const dayName = DAY_NAMES[d] ?? d
					const dayLabel = formatDayLabel(dayDate, dayName)

					const items: NoteWorkoutItemData[] = (dayMap[d] ?? []).map((w: any) => {
						// 이 주차 기간 안에 완료된 기록이 있는지 확인
						const entries = completionMap.get(w.id) ?? []
						const matchedEntry = entries.find(
							e => e.logged_at >= slice.start && e.logged_at <= slice.end
						)
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
						id: `${note.id}-${d}-${slice.start}`,
						day: dayLabel,   // '4/7 월요일' 형식
						dayDate,         // 정렬용 날짜 'YYYY-MM-DD'
						items,
					}
				})
				// 날짜 기준 오름차순 정렬 (4/3 금 → 4/6 월 → 4/8 수)
				.sort((a: any, b: any) => a.dayDate.localeCompare(b.dayDate))

			return {
				id: `${note.id}-${slice.start}`,
				sentAt: writtenAt,          // 알림장 원본 발송일 (카드 상단 표시)
				direction: note.content ?? '',
				targetMets: note.recommended_mets ?? 0,
				periodStart: toShortDate(slice.start),
				periodEnd: toShortDate(slice.end),
				daySections,
				isCurrentSlice,             // isLatest 판단용 (NoteListManager에서 사용)
			} as NoteCardData & { isCurrentSlice: boolean }
		})

		// slices는 오래된 순(3/1→3/8→3/15) — 그대로 push
		noteCards.push(...sliceCards)
	}

	// id = `${note.id}-${slice.start}` 형식이므로 slice.start(YYYY-MM-DD) 기준 내림차순 정렬
	// → 최신 주차 카드가 배열 앞으로
	noteCards.sort((a, b) => {
		const aDate = a.id.slice(-10)  // 'YYYY-MM-DD'
		const bDate = b.id.slice(-10)
		return bDate.localeCompare(aDate)
	})

	// 5. isLatest 판단 — 오늘이 포함된 주차 카드 1개만 true
	// noteCards는 이미 최신순 정렬
	const latestIdx = noteCards.findIndex(
		(c) => (c as any).isCurrentSlice === true
	)

	return (
		<NoteListManager
			memberId={member.id}
			initialNotes={noteCards}
			latestIdx={latestIdx}
		/>
	)
}
