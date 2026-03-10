// Supabase 테이블과 1:1 대응되는 타입 정의

export interface Studio {
	id: string
	name: string
	address: string | null
	created_at: string
}

export interface Instructor {
	id: string           // auth.users.id 와 동일
	studio_id: string
	name: string
	role: 'owner' | 'instructor'
	created_at: string
}

export interface Member {
	id: string
	studio_id: string
	instructor_id: string | null
	name: string
	phone: string | null
	birth_date: string | null       // 'YYYY-MM-DD'
	sessions_per_week: number
	access_token: string            // PWA 접속용 UUID
	memo: string | null
	is_active: boolean
	registered_at: string           // 'YYYY-MM-DD'
	created_at: string
}

export interface InbodyRecord {
	id: string
	member_id: string
	measured_at: string             // 'YYYY-MM-DD'
	weight: number | null           // kg
	muscle_mass: number | null      // kg
	body_fat_pct: number | null     // %
	body_fat_mass: number | null    // kg
	bmi: number | null
	bmr: number | null              // kcal, 기초대사량
	visceral_fat: number | null 	// 내장지방레벨, 1~20
	memo: string | null
	created_at: string
}

export interface WorkoutLog {
	id: string
	member_id: string
	logged_at: string               // 'YYYY-MM-DD'
	workout_type: WorkoutType
	duration_min: number
	mets_score: number
	condition_memo: string | null
	created_at: string
}

export type WorkoutType =
	| 'stretching'
	| 'strength'
	| 'cardio'
	| 'pilates'
	| 'yoga'
	| 'other'

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
	stretching: '스트레칭',
	strength: '근력운동',
	cardio: '유산소',
	pilates: '필라테스',
	yoga: '요가',
	other: '기타',
}

export const WORKOUT_TYPE_METS: Record<WorkoutType, number> = {
	stretching: 2.5,
	strength: 5.0,
	cardio: 6.0,
	pilates: 4.0,
	yoga: 3.0,
	other: 3.5,
}

export interface NoteWorkout {
	id: string
	note_id: string
	day: string                     // '전체' | '월' | '화' | ...
	workout_type: WorkoutType
	intensity: Intensity
	duration_min: number | null
	mets: number | null             // 자동 계산: METs/h × (분/60)
	sort_order: number
}

export interface Note {
	id: string
	member_id: string
	instructor_id: string
	content: string
	intensity: Intensity
	written_at: string              // 'YYYY-MM-DD'
	is_sent: boolean
	days: string[]                  // ['전체'] or ['월','화','수'...]
	recommended_mets: number | null // note_workouts METs 합산 총점
	created_at: string
	// join
	note_tags?: NoteTag[]
	note_workouts?: NoteWorkout[]
}

export type Intensity = 'recovery' | 'normal' | 'high'

export const INTENSITY_LABELS: Record<Intensity, string> = {
	recovery: '리커버리',
	normal: '일반',
	high: '고강도',
}

export interface NoteTag {
	id: string
	note_id: string
	tag: string
}

// ─── 상태 배지 타입 ────────────────────────────────────────────────
export type ActivityStatus = 'low' | 'good' | 'high'

export function getActivityStatus(avgMets: number): ActivityStatus {
	if (avgMets < 2.0) return 'low'
	if (avgMets > 5.5) return 'high'
	return 'good'
}

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
	low: '활동 부족',
	good: '적정',
	high: '고활동',
}


// ─── 내장지방 상태 타입 정의 ───────────────────────────────────

export type VisceralFatStatus = 'normal' | 'caution' | 'high_risk'

/**
 * 내장지방 레벨에 따른 상태 반환 로직
 */
export function getVisceralFatStatus(level: number | null): VisceralFatStatus | null {
	if (level === null) return null
	if (level <= 9) return 'normal'
	if (level <= 14) return 'caution'
	return 'high_risk'
}

/**
 * 상태별 표시 레이블 (화면 노출용)
 */
export const VISCERAL_FAT_STATUS_LABELS: Record<VisceralFatStatus, string> = {
	normal: '정상/건강',
	caution: '경도 비만/위험',
	high_risk: '고위험/비만',
}

/**
 * 상태별 상세 설명 (가이드라인 제공용)
 */
export const VISCERAL_FAT_STATUS_DESCRIPTIONS: Record<VisceralFatStatus, string> = {
	normal: '내장지방이 적정 범위에 있어 대사 질환 위험이 낮습니다.',
	caution: '내장지방이 다소 축적된 상태로, 꾸준한 식단 관리와 운동이 필요합니다.',
	high_risk: '고혈압, 당뇨, 고지혈증 등 성인병 위험이 매우 높은 상태입니다. 즉각적인 생활 습관 개선이 필요합니다.',
}

/**
 * UI 색상 가이드 (선택 사항)
 */
export const VISCERAL_FAT_STATUS_COLORS: Record<VisceralFatStatus, string> = {
	normal: '#10B981',    // 초록계열
	caution: '#F59E0B',   // 주황계열
	high_risk: '#EF4444', // 빨강계열
}
