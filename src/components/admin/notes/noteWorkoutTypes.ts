// src/components/admin/notes/noteWorkoutTypes.ts

import type { Intensity, WorkoutType, Note, NoteWorkout, NoteTag, NoteVideo } from '@/types/database'
import { WORKOUT_TYPE_METS } from '@/types/database'

export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']
export const ALL_DAYS = ['전체', ...WEEKDAYS]
export const DEFAULT_TAGS = ['코어강화', '스트레칭', '초보자루틴', '필라테스기초']

export const INTENSITY_STYLE: Record<Intensity, React.CSSProperties> = {
	recovery: { borderColor: '#FFB347', color: '#FFB347', backgroundColor: 'rgba(255,179,71,0.1)' },
	normal: { borderColor: '#3DDBB5', color: '#3DDBB5', backgroundColor: 'rgba(61,219,181,0.1)' },
	high: { borderColor: '#FF6B5B', color: '#FF6B5B', backgroundColor: 'rgba(255,107,91,0.1)' },
}

// ─── WorkoutItem (로컬 상태용 — DB 저장 전 UI 상태) ──────────────
export interface WorkoutItem {
	localId: string
	dbId?: string                  // 수정 시 기존 DB id
	workout_type: WorkoutType | null
	intensity: Intensity
	duration_min: string           // 입력값 string으로 관리
	coach_memo?: string
}

export function uid() {
	return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function newItem(): WorkoutItem {
	return { localId: uid(), workout_type: null, intensity: 'normal', duration_min: '', coach_memo: '' }
}

export function cloneItems(items: WorkoutItem[]): WorkoutItem[] {
	return items.map(w => ({ ...w, localId: uid(), dbId: undefined }))
}

export function calcMets(item: WorkoutItem | null): number | null {
	if (!item || !item.workout_type || !item.duration_min || Number(item.duration_min) <= 0) return null
	return Math.round(WORKOUT_TYPE_METS[item.workout_type] * Number(item.duration_min) * 100) / 100
}

// ─── NoteWithTags ─────────────────────────────────────────────────
// database.ts의 Note를 기반으로 확장
// note_tags, note_workouts, note_videos는 Supabase join으로 가져오므로 필수 처리
export type NoteWithTags = Omit<Note, 'note_tags' | 'note_workouts'> & {
	note_tags: Pick<NoteTag, 'tag'>[]
	note_workouts?: NoteWorkout[]   // NoteWorkout에 이미 coach_memo 포함
	note_videos?: NoteVideo[]
}

