// src/lib/queries/member.queries.ts
// 회원 상세 페이지 관련 Supabase 쿼리 함수 모음
// 각 page.tsx / layout.tsx에서 import해서 사용

import { createClient } from '@/lib/supabase/server'
import type { Member, InbodyRecord, WorkoutLog, Note, NoteWorkoutCompletion } from '@/types/database'

// ─── 회원 기본 정보 ──────────────────────────────────────────────
export async function getMember(memberId: string): Promise<Member | null> {
	const supabase = await createClient()
	const { data } = await supabase
		.from('members')
		.select('*')
		.eq('id', memberId)
		.single()
	return data ?? null
}

// ─── 인바디 기록 (최신 2개) ──────────────────────────────────────
export async function getLatestInbodyRecords(
	memberId: string
): Promise<{ latest: InbodyRecord | null; previous: InbodyRecord | null }> {
	const supabase = await createClient()
	const { data } = await supabase
		.from('inbody_records')
		.select('*')
		.eq('member_id', memberId)
		.order('measured_at', { ascending: false })
		.limit(2)
	return {
		latest: data?.[0] ?? null,
		previous: data?.[1] ?? null,
	}
}

export async function getInbodyRecords(memberId: string): Promise<InbodyRecord[]> {
	const supabase = await createClient()
	const { data } = await supabase
		.from('inbody_records')
		.select('*')
		.eq('member_id', memberId)
		.order('measured_at', { ascending: false })
	return data ?? []
}


// ─── 주간 운동 기록 ──────────────────────────────────────────────
export async function getWeeklyLogs(
	memberId: string,
	weekStart: string,
	weekEnd: string
): Promise<WorkoutLog[]> {
	const supabase = await createClient()
	const { data } = await supabase
		.from('workout_logs')
		.select('*')
		.eq('member_id', memberId)
		.gte('logged_at', weekStart)
		.lte('logged_at', weekEnd)
		.order('logged_at', { ascending: true })
	return data ?? []
}

// ─── 주간 운동 기록 (요약 — layout용) ───────────────────────────
export async function getWeeklyLogsSummary(
	memberId: string,
	weekStart: string,
	weekEnd: string
): Promise<{ mets_score: number; logged_at: string }[]> {
	const supabase = await createClient()
	const { data } = await supabase
		.from('workout_logs')
		.select('mets_score, logged_at')
		.eq('member_id', memberId)
		.gte('logged_at', weekStart)
		.lte('logged_at', weekEnd)
	return data ?? []
}

// ─── 최근 알림장 (note_workouts, note_tags 포함) ─────────────────
export async function getRecentNote(
	memberId: string,
	beforeDate: string
): Promise<Note | null> {
	const supabase = await createClient()
	const { data } = await supabase
		.from('notes')
		.select('*, note_workouts(*), note_tags(*)')
		.eq('member_id', memberId)
		.eq('is_sent', true)
		.lte('sent_at', beforeDate)
		.order('sent_at', { ascending: false })
		.limit(1)
		.maybeSingle()
	return data ?? null
}

// ─── 최근 알림장 (요약 — layout용) ──────────────────────────────
export async function getRecentNoteTargetMets(
	memberId: string
): Promise<number> {
	const supabase = await createClient()
	const { data } = await supabase
		.from('notes')
		.select('recommended_mets')
		.eq('member_id', memberId)
		.eq('is_sent', true)
		.order('sent_at', { ascending: false })
		.limit(1)
		.maybeSingle()
	return data?.recommended_mets ?? 600
}

//미전송 알림장도 같이 조회해서, NotePanel에서 "작성한 알림장이 아직 전송되지 않았습니다" 표시 여부 결정
export async function getUnsentNoteCount(memberId: string): Promise<number> {
	const supabase = await createClient()
	const { count } = await supabase
		.from('notes')
		.select('*', { count: 'exact', head: true })
		.eq('member_id', memberId)
		.eq('is_sent', false)
	return count ?? 0
}


export async function getNextNoteSentAt(
	memberId: string,
	currentSentAt: string
): Promise<string | null> {
	const supabase = await createClient()
	const { data } = await supabase
		.from('notes')
		.select('sent_at')
		.eq('member_id', memberId)
		.eq('is_sent', true)
		.gt('sent_at', currentSentAt)
		.order('sent_at', { ascending: true })
		.limit(1)
		.maybeSingle()
	return data?.sent_at ?? null
}

// ─── 알림장 전체 목록 (스튜디오 알림장 탭용) ─────────────────────
// note_workouts, note_tags 포함 / 최신순
export async function getNotes(memberId: string): Promise<Note[]> {
	const supabase = await createClient()
	const { data } = await supabase
		.from('notes')
		.select('*, note_workouts(*), note_tags(*)')
		.eq('member_id', memberId)
		.order('written_at', { ascending: false })
	return data ?? []
}

// ─── 알림장 완료 기록 ────────────────────────────────────────────
// export async function getNoteCompletions(
// 	noteWorkoutIds: string[],
// 	weekStart: string,
// 	weekEnd: string
// ): Promise<NoteWorkoutCompletion[]> {
// 	if (noteWorkoutIds.length === 0) return []
// 	const supabase = await createClient()
// 	const { data } = await supabase
// 		.from('note_workout_completions')
// 		.select('*')
// 		.in('note_workout_id', noteWorkoutIds)
// 		.gte('completed_date', weekStart)
// 		.lte('completed_date', weekEnd)
// 	return data ?? []
// }

// ─── 알림장 완료 기록 ────────────────────────────────────────────
export async function getNoteCompletions(
	noteWorkoutIds: string[],
	weekStart: string,
	weekEnd: string
): Promise<NoteWorkoutCompletion[]> {
	if (noteWorkoutIds.length === 0) return []
	const supabase = await createClient()

	const { data } = await supabase
		.from('workout_logs')
		.select('note_workout_id, logged_at')
		.in('note_workout_id', noteWorkoutIds)
		.gte('logged_at', weekStart)
		.lte('logged_at', weekEnd)
		.eq('source', 'routine')
		.not('note_workout_id', 'is', null)

	// NoteWorkoutCompletion 형태로 맞춰서 반환
	return (data ?? []).map((row) => ({
		id: row.note_workout_id,
		note_workout_id: row.note_workout_id,
		member_id: '',
		completed_date: row.logged_at,
		created_at: row.logged_at,
	}))
}

// ─── 전체 기간 운동 날짜 목록 (달력 점 표시용) ───────────────────
// export async function getAllLoggedDates(
// 	memberId: string,
// 	fromDate: string,
// 	toDate: string
// ): Promise<string[]> {
// 	const supabase = await createClient()
// 	const { data } = await supabase
// 		.from('workout_logs')
// 		.select('logged_at')
// 		.eq('member_id', memberId)
// 		.gte('logged_at', fromDate)
// 		.lte('logged_at', toDate)
// 	const dates = (data ?? []).map((l) => l.logged_at)
// 	return [...new Set(dates)]
// }
export async function getAllLoggedDates(
	memberId: string,
	fromDate: string,
	toDate: string
): Promise<{ date: string; mets_score: number; duration_min: number }[]> {
	const supabase = await createClient()
	const { data } = await supabase
		.from('workout_logs')
		.select('logged_at, mets_score, duration_min')  // ← duration_min 추가
		.eq('member_id', memberId)
		.gte('logged_at', fromDate)
		.lte('logged_at', toDate)
	return (data ?? []).map((l) => ({
		date: l.logged_at,
		mets_score: l.mets_score,
		duration_min: l.duration_min,  // ← 추가
	}))
}


// 전송된 알림장 목록 (sent_at 오름차순)
export async function getSentNotes(memberId: string): Promise<{ sent_at: string }[]> {
	const supabase = await createClient()
	const { data } = await supabase
		.from('notes')
		.select('sent_at')
		.eq('member_id', memberId)
		.eq('is_sent', true)
		.order('sent_at', { ascending: true })
	return data ?? []
}