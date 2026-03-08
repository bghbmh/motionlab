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
  bmr: number | null              // kcal
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
  strength:   '근력운동',
  cardio:     '유산소',
  pilates:    '필라테스',
  yoga:       '요가',
  other:      '기타',
}

export const WORKOUT_TYPE_METS: Record<WorkoutType, number> = {
  stretching: 2.5,
  strength:   5.0,
  cardio:     6.0,
  pilates:    4.0,
  yoga:       3.0,
  other:      3.5,
}

export interface Note {
  id: string
  member_id: string
  instructor_id: string
  content: string
  intensity: Intensity
  written_at: string              // 'YYYY-MM-DD'
  created_at: string
  // join
  note_tags?: NoteTag[]
}

export type Intensity = 'recovery' | 'normal' | 'high'

export const INTENSITY_LABELS: Record<Intensity, string> = {
  recovery: '리커버리',
  normal:   '일반',
  high:     '고강도',
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
  low:  '활동 부족',
  good: '적정',
  high: '고활동',
}
