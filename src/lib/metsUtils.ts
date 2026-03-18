// src/lib/metsUtils.ts


// ─── 상태 배지 타입 ────────────────────────────────────────────────

/**
 * workout_logs 배열로 총 METs 활동량 계산
 * 공식: SUM(mets_score × duration_min)
 */
export function calcTotalMets(
	logs: Array<{ mets_score: number; duration_min: number }>
): number {
	return logs.reduce((s, l) => s + l.mets_score * l.duration_min, 0)
}

/**
 * 주간 총 METs로 활동 상태 판단
 * 기준: 주간 총 활동량 기반
 *   low  : 600 미만
 *   good : 600 이상 ~ 2000 미만
 *   high : 2000 이상
 */
export type ActivityStatus = 'low' | 'good' | 'high'

export function getActivityStatus(weeklyTotalMets: number): ActivityStatus {
	if (weeklyTotalMets < 600) return 'low'
	if (weeklyTotalMets < 2000) return 'good'
	return 'high'
}

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
	low: '활동 부족',
	good: '적정',
	high: '고활동',
}