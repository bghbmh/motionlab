// app/api/studio/members/[id]/weekly/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWeekEnd, getEffectiveWeekStart, getCurrentWeekStart } from '@/lib/weekUtils'

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id: memberId } = await params
	const weekStart = req.nextUrl.searchParams.get('weekStart')

	if (!weekStart) {
		return NextResponse.json({ error: 'weekStart required' }, { status: 400 })
	}

	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const weekEnd = getWeekEnd(weekStart)

	const [logsRes, noteRes] = await Promise.all([
		supabase
			.from('workout_logs')
			.select('*')
			.eq('member_id', memberId)
			.gte('logged_at', weekStart)
			.lte('logged_at', weekEnd)
			.order('logged_at', { ascending: true }),

		// ✅ .single() 제거 → maybeSingle() 사용 — 데이터 없어도 에러 안 남
		supabase
			.from('notes')
			.select('*, note_workouts(*), note_tags(*)')
			.eq('member_id', memberId)
			.eq('is_sent', true)
			.lte('sent_at', weekEnd)  // ← written_at → sent_at
			.order('sent_at', { ascending: false })  // ← written_at → sent_at
			.limit(1)
			.maybeSingle(),
	])

	const logs = logsRes.data ?? []
	const note = noteRes.data ?? null
	const totalMets = logs.reduce((sum, l) => sum + l.mets_score * l.duration_min, 0)

	const noteWorkoutIds = note?.note_workouts?.map((w: any) => w.id) ?? []
	const { data: completionLogs } = noteWorkoutIds.length > 0
		? await supabase
			.from('workout_logs')
			.select('note_workout_id, logged_at')
			.in('note_workout_id', noteWorkoutIds)
			.gte('logged_at', weekStart)
			.lte('logged_at', weekEnd)
			.eq('source', 'routine')
			.not('note_workout_id', 'is', null)
		: { data: [] }

	const completions = (completionLogs ?? []).map((row) => ({
		id: row.note_workout_id,
		note_workout_id: row.note_workout_id,
		member_id: memberId,
		completed_date: row.logged_at,
		created_at: row.logged_at,
	}))

	return NextResponse.json({
		logs,
		totalMets,
		note,
		completions: completions ?? [],
	})
}
