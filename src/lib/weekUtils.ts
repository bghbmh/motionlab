// src/lib/weekUtils.ts

// ─── 요일 상수 ────────────────────────────────────────────────────
export const DAY_KO_FULL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
export const DAY_KO_SHORT = ['일', '월', '화', '수', '목', '금', '토']

export const DAY_MAP: Record<string, number> = {
	'일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6,
}

// ─── 날짜 파싱 / 포맷 ────────────────────────────────────────────
/**
 * 'YYYY-MM-DD' 문자열을 로컬 타임존 기준 Date로 파싱
 * new Date('YYYY-MM-DD')는 UTC 자정으로 파싱되므로 사용 금지
 */
export function parseLocalDate(dateStr: string): Date {
	const [y, m, d] = dateStr.split('-').map(Number)
	return new Date(y, m - 1, d)
}

/**
 * Date를 로컬 타임존 기준 'YYYY-MM-DD' 문자열로 변환
 * toISOString()은 UTC 기준이므로 사용 금지
 */
export function toLocalISO(date: Date): string {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

export function formatDisplayDate(dateStr: string): string {
	const [y, m, d] = dateStr.split('-')
	return `${y}.${m}.${d}`
}

/**
 * 'YYYY-MM-DD' → 'YY.MM.DD' 표시용 포맷
 */
export function formatDate(dateStr: string): string {
	const [y, m, d] = dateStr.split('-')
	return `${y.slice(2)}.${m}.${d}`
}


/**
 * 'YYYY-MM-DD' → '월요일' 등 한글 요일 (전체)
 */
export function getDayKoFull(dateStr: string): string {
	return DAY_KO_FULL[parseLocalDate(dateStr).getDay()]
}

/**
 * 'YYYY-MM-DD' → '월' 등 한글 요일 (단축)
 */
export function getDayKoShort(dateStr: string): string {
	return DAY_KO_SHORT[parseLocalDate(dateStr).getDay()]
}

// ─── 주차 계산 ────────────────────────────────────────────────────
/**
 * week_start_date 기준으로 오늘이 속한 7일 구간의 시작일 반환
 * 예) 기준일 3/7, 오늘 3/12 → 3/7 반환 (같은 주)
 * 예) 기준일 3/7, 오늘 3/16 → 3/14 반환 (다음 주)
 */
export function getCurrentWeekStart(weekStartDate: string): string {
	const base = parseLocalDate(weekStartDate)
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	base.setHours(0, 0, 0, 0)

	const daysSinceBase = Math.floor(
		(today.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)
	)

	if (daysSinceBase < 0) return weekStartDate

	const weeksElapsed = Math.floor(daysSinceBase / 7)
	const currentStart = parseLocalDate(weekStartDate)
	currentStart.setDate(currentStart.getDate() + weeksElapsed * 7)

	return toLocalISO(currentStart)
}

/**
 * note.written_at 기준으로 현재 주차의 날짜 목록과 기간을 반환
 *
 * 예시:
 *   written_at = '2026-04-07' (화)
 *   days = ['수', '금', '월']
 *   오늘 = '2026-04-15' (수) → 4/7 주차 끝(4/13) 지남 → 4/14 주차
 *   → dates: ['2026-04-15', '2026-04-17', '2026-04-20']
 *   → weekStart: '2026-04-14', weekEnd: '2026-04-20'
 *
 * '전체'인 경우 → 현재 주차 7일 전체 반환
 */
export function resolveCurrentWeekDates(writtenAt: string, days: string[]): {
	dates: string[]
	weekStart: string
	weekEnd: string
} {
	// getCurrentWeekStart 재사용 — 주차 시작일 계산
	const weekStartStr = getCurrentWeekStart(writtenAt)
	const weekStart = parseLocalDate(weekStartStr)

	const weekEnd = new Date(weekStart)
	weekEnd.setDate(weekStart.getDate() + 6)

	// '전체' → 주차 시작~종료 7일 모두 반환
	if (days.includes('전체')) {
		const allDates: string[] = []
		for (let i = 0; i < 7; i++) {
			const d = new Date(weekStart)
			d.setDate(weekStart.getDate() + i)
			allDates.push(toLocalISO(d))
		}
		return {
			dates: allDates,
			weekStart: weekStartStr,
			weekEnd: toLocalISO(weekEnd),
		}
	}

	// 특정 요일들 → 현재 주차 기준으로 해당 요일 날짜 계산
	const weekStartDay = weekStart.getDay()
	const dates = days
		.map((d) => {
			const target = DAY_MAP[d]
			if (target === undefined) return null
			const diff = (target - weekStartDay + 7) % 7
			const date = new Date(weekStart)
			date.setDate(weekStart.getDate() + diff)
			return toLocalISO(date)
		})
		.filter((d): d is string => d !== null)
		.sort()

	return {
		dates,
		weekStart: weekStartStr,
		weekEnd: toLocalISO(weekEnd),
	}
}

/**
 * 날짜 문자열이 오늘/예정/과거인지 판별
 */
export type DayStatus = 'today' | 'scheduled' | 'past'

export function getDayStatus(dateStr: string): DayStatus {
	const today = toLocalISO(new Date())
	if (dateStr === today) return 'today'
	if (dateStr > today) return 'scheduled'
	return 'past'
}

/**
 * 주차 시작일 기준으로 종료일 반환 (시작일 + 6일)
 */
export function getWeekEnd(weekStart: string): string {
	const d = parseLocalDate(weekStart)
	d.setDate(d.getDate() + 6)
	return toLocalISO(d)
}

/**
 * 주차 시작일 기준으로 7일 날짜 배열 반환
 */
export function getWeekDates(weekStart: string): string[] {
	return Array.from({ length: 7 }, (_, i) => {
		const d = parseLocalDate(weekStart)
		d.setDate(d.getDate() + i)
		return toLocalISO(d)
	})
}

/**
 * 기준일(registered_at)부터 오늘까지 전체 주차 목록 반환
 * 최신순 (현재 주차가 index 0)
 * 예) 기준일 2026-02-29, 오늘 2026-03-13
 *   → ['2026-03-08', '2026-03-01', '2026-02-29']
 */
export function getAllWeekStarts(baseDate: string): string[] {
	const currentWeekStart = getCurrentWeekStart(baseDate)
	const weeks: string[] = []
	let cursor = parseLocalDate(currentWeekStart)
	const base = parseLocalDate(baseDate)
	base.setHours(0, 0, 0, 0)

	while (cursor >= base) {
		weeks.push(toLocalISO(cursor))
		cursor = new Date(cursor)
		cursor.setDate(cursor.getDate() - 7)
	}
	return weeks
}

/**
 * 특정 weekStart 기준으로 note.days에 해당하는 날짜 목록 반환
 * RecentNoteCard에서 외부 weekStart를 받았을 때 사용
 */
export function resolveDatesForWeek(weekStart: string, days: string[]): string[] {
	if (days.includes('전체')) return getWeekDates(weekStart)

	const base = parseLocalDate(weekStart)
	const baseDay = base.getDay()

	return days
		.map((d) => {
			const target = DAY_MAP[d]
			if (target === undefined) return null
			const diff = (target - baseDay + 7) % 7
			const date = new Date(base)
			date.setDate(base.getDate() + diff)
			return toLocalISO(date)
		})
		.filter((d): d is string => d !== null)
		.sort()
}


/**
 * 'YYYY-MM-DD' → 'M/D' 표시용 (달력용)
 */
export function formatDateShort(dateStr: string): string {
	const [, m, d] = dateStr.split('-')
	return `${parseInt(m)}/${parseInt(d)}`
}

/**
 * 실제 표시에 쓸 주차 시작일 결정
 * - 알림장(written_at)이 있으면 → written_at 기준 현재 주차
 * - 없으면 → registered_at 기준 현재 주차
 *
 * 예) written_at = 4/9, 오늘 = 4/14
 *   → getCurrentWeekStart('4/9') = '4/9'  (같은 주)
 *   → weekStart = 4/9, weekEnd = 4/15
 */
export function getEffectiveWeekStart(
	baseDate: string,
	noteWrittenAt: string | null | undefined
): string {
	const anchor = noteWrittenAt ?? baseDate
	return getCurrentWeekStart(anchor)
}


export function isSameWeek(dateStr: string, weekStart: string): boolean {
	const weekEnd = getWeekEnd(weekStart)
	return dateStr >= weekStart && dateStr <= weekEnd
}
