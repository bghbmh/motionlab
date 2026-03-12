import type { Intensity, WorkoutType } from '@/types/database'
import { WORKOUT_TYPE_METS } from '@/types/database'

export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']
export const ALL_DAYS = ['전체', ...WEEKDAYS]
export const DEFAULT_TAGS = ['코어강화', '스트레칭', '초보자루틴', '필라테스기초']

export const INTENSITY_STYLE: Record<Intensity, React.CSSProperties> = {
	recovery: { borderColor: '#FFB347', color: '#FFB347', backgroundColor: 'rgba(255,179,71,0.1)' },
	normal: { borderColor: '#3DDBB5', color: '#3DDBB5', backgroundColor: 'rgba(61,219,181,0.1)' },
	high: { borderColor: '#FF6B5B', color: '#FF6B5B', backgroundColor: 'rgba(255,107,91,0.1)' },
}

export const WORKOUT_ICONS: Record<WorkoutType, string> = {
	stretching: '🧘', strength: '💪', cardio: '🏃',
	pilates: '🌿', yoga: '☯️', other: '⚡',
}

export const WORKOUT_COLORS: Record<WorkoutType, { bg: string; border: string; text: string }> = {
	stretching: { bg: 'rgba(255,179,71,0.08)', border: 'rgba(255,179,71,0.25)', text: '#FFB347' },
	strength: { bg: 'rgba(255,107,91,0.08)', border: 'rgba(255,107,91,0.25)', text: '#FF6B5B' },
	cardio: { bg: 'rgba(61,219,181,0.08)', border: 'rgba(61,219,181,0.25)', text: '#3DDBB5' },
	pilates: { bg: 'rgba(61,219,181,0.08)', border: 'rgba(61,219,181,0.25)', text: '#3DDBB5' },
	yoga: { bg: 'rgba(255,179,71,0.08)', border: 'rgba(255,179,71,0.25)', text: '#FFB347' },
	other: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.4)' },
}

// ─── WorkoutItem (로컬 상태용) ────────────────────────────────────
export interface WorkoutItem {
	localId: string
	dbId?: string
	workout_type: WorkoutType | null
	intensity: Intensity
	duration_min: string
}

export function uid() {
	return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function newItem(): WorkoutItem {
	return { localId: uid(), workout_type: null, intensity: 'normal', duration_min: '' }
}

export function cloneItems(items: WorkoutItem[]): WorkoutItem[] {
	return items.map(w => ({ ...w, localId: uid(), dbId: undefined }))
}

export function calcMets(item: WorkoutItem | null): number | null {
	if (!item || !item.workout_type || !item.duration_min || Number(item.duration_min) <= 0) return null
	//return Math.round(WORKOUT_TYPE_METS[item.workout_type] * (Number(item.duration_min) / 60) * 100) / 100

	return Math.round(WORKOUT_TYPE_METS[item.workout_type] * Number(item.duration_min) * 100) / 100;

}

// ─── NoteWithTags (모달 Props용) ──────────────────────────────────
import type { WorkoutType as WT } from '@/types/database'

// ↓ note_videos 필드 추가
export type NoteWithTags = {
	id: string
	content: string
	intensity: Intensity
	days: string[]
	recommended_mets: number | null
	note_tags: { tag: string }[]
	note_workouts?: {
		id: string; day: string; workout_type: WT
		intensity: Intensity; duration_min: number | null
		mets: number | null; sort_order: number
	}[]
	note_videos?: {                  // ← 추가
		id: string
		video_id: string
		youtube_url: string
		title: string | null
		thumbnail_url: string | null
		source: string
		sort_order: number
	}[]
}