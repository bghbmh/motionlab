/**
 * 'YYYY-MM-DD' 문자열을 로컬 타임존 기준 Date로 파싱
 * new Date('YYYY-MM-DD')는 UTC 자정으로 파싱되므로 사용 금지
 */
function parseLocalDate(dateStr: string): Date {
	const [y, m, d] = dateStr.split('-').map(Number)
	return new Date(y, m - 1, d)   // 로컬 타임존 자정
}

/**
 * Date를 로컬 타임존 기준 'YYYY-MM-DD' 문자열로 변환
 * toISOString()은 UTC 기준이므로 사용 금지
 */
function toLocalISO(date: Date): string {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

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

	// 기준일 이전이면 기준일 그대로 반환
	if (daysSinceBase < 0) return weekStartDate

	const weeksElapsed = Math.floor(daysSinceBase / 7)
	const currentStart = parseLocalDate(weekStartDate)
	currentStart.setDate(currentStart.getDate() + weeksElapsed * 7)

	return toLocalISO(currentStart)   // ← toISOString() 대신 로컬 변환
}