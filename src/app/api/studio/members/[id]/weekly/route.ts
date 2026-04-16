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
			.lte('written_at', weekEnd)
			.order('written_at', { ascending: false })
			.limit(1)
			.maybeSingle(),
	])

	const logs = logsRes.data ?? []
	const note = noteRes.data ?? null
	const totalMets = logs.reduce((sum, l) => sum + l.mets_score, 0)

	const noteWorkoutIds = note?.note_workouts?.map((w: any) => w.id) ?? []
	const { data: completions } = noteWorkoutIds.length > 0
		? await supabase
			.from('note_workout_completions')
			.select('*')
			.in('note_workout_id', noteWorkoutIds)
			.gte('completed_date', weekStart)
			.lte('completed_date', weekEnd)
		: { data: [] }

	return NextResponse.json({
		logs,
		totalMets,
		note,
		completions: completions ?? [],
	})
}
