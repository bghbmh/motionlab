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
	source: 'routine' | 'manual' | 'daily'  // 신규
	note_workout_id: string | null           // 신규
	activity_type: string | null             // 신규
	created_at: string
	intensity: Intensity | null  // 신규
	prescribed_duration_min: number | null
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
	stretching: 2.5,  // 유지
	strength: 3.4,  // 5.0 → 3.4  (논문 D1931)
	cardio: 6.4,  // 6.0 → 6.4  (논문 B1141)
	pilates: 3.4,  // 4.0 → 3.4  (논문 D1931)
	yoga: 2.5,  // 3.0 → 2.5  (논문 D1921)
	other: 3.5,  // 유지
}

// ─── 신규 추가 ────────────────────────────────────────────────────
// 강도별 METs 테이블 — 한국인 신체활동분류표 (김은경 외, 2021) 기반
export const WORKOUT_METS_BY_INTENSITY: Record<WorkoutType, Record<Intensity, number>> = {
	stretching: { recovery: 1.8, normal: 2.5, high: 3.4 },
	strength: { recovery: 2.5, normal: 3.4, high: 5.3 },
	cardio: { recovery: 4.8, normal: 6.4, high: 8.0 },
	pilates: { recovery: 2.5, normal: 3.4, high: 5.3 },
	yoga: { recovery: 1.9, normal: 2.5, high: 3.4 },
	other: { recovery: 2.0, normal: 3.5, high: 5.0 },
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
	coach_memo: string | null
}

export interface NoteVideo {
	id: string
	note_id: string
	video_id: string
	youtube_url: string
	title: string | null
	thumbnail_url: string | null
	source: 'manual' | 'search'
	sort_order: number
	created_at: string
}

export interface Note {
	id: string
	member_id: string
	instructor_id: string
	content: string
	intensity: Intensity
	written_at: string              // 'YYYY-MM-DD'
	sent_at: string | null          // 'YYYY-MM-DD' 전송일 ← 추가
	is_sent: boolean
	days: string[]                  // ['전체'] or ['월','화','수'...]
	recommended_mets: number | null // note_workouts METs 합산 총점
	created_at: string // join
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

export interface CompletedLog {
	note_workout_id: string
	log_id: string
	duration_min: number
	prescribed_duration_min: number | null
	mets_score: number
}


export interface DailyActivity {
	id: string
	member_id: string
	activity_type: string
	activity_label: string
	mets_value: number
	duration_min_per_day: number
	frequency_per_week: number
	selected_days: string[] | null  // text[] 컬럼
	paper_code: string | null
	note: string | null
	recorded_at: string             // 'YYYY-MM-DD'
	created_at: string
}


// ─── note_workout_completions ─────────────────────────────────
export interface NoteWorkoutCompletion {
	id: string
	note_workout_id: string    // note_workouts.id 참조
	member_id: string
	completed_date: string     // 'YYYY-MM-DD'
	created_at: string
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



// ─── 운동 타입 아이콘 ─────────────────────────────────────────────
export const WORKOUT_ICON_PATHS: Record<WorkoutType, string> = {
	stretching: '/images/workout/stretching.png',
	strength: '/images/workout/strength.png',
	cardio: '/images/workout/cardio.png',
	pilates: '/images/workout/pilates.png',
	yoga: '/images/workout/yoga.png',
	other: '/images/workout/other.png',
}

export const WORKOUT_ICONS: Record<WorkoutType, string> = {
	stretching: '🧘',
	strength: '💪',
	cardio: '🏃',
	pilates: '🌿',
	yoga: '☯️',
	other: '⚡',
}

export const WORKOUT_COLORS: Record<WorkoutType, { bg: string; border: string; text: string }> = {
	stretching: { bg: 'rgba(255,179,71,0.08)', border: 'rgba(255,179,71,0.2)', text: '#FFB347' },
	strength: { bg: 'rgba(255,107,91,0.08)', border: 'rgba(255,107,91,0.2)', text: '#FF6B5B' },
	cardio: { bg: 'rgba(61,219,181,0.08)', border: 'rgba(61,219,181,0.2)', text: '#3DDBB5' },
	pilates: { bg: 'rgba(61,219,181,0.08)', border: 'rgba(61,219,181,0.2)', text: '#3DDBB5' },
	yoga: { bg: 'rgba(255,179,71,0.08)', border: 'rgba(255,179,71,0.2)', text: '#FFB347' },
	other: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.4)' },
}
