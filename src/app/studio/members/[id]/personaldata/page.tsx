// app/studio/members/[id]/record/page.tsx
// 회원 정보 기록 탭 — 기본정보 · 운동통계 · 알림장통계 · 인바디변화 · 생활패턴 · PWA · 앱접속이력

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMember } from '@/lib/queries/member.queries'
import MemberRecordSection from '@/components/admin/personaldata/MemberRecordSection'

interface PageProps {
	params: Promise<{ id: string }>
}

export default async function MemberRecordPage({ params }: PageProps) {
	const { id } = await params
	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) redirect('/login')

	const member = await getMember(id)
	if (!member) notFound()

	const [
		{ data: workoutLogszzz },
		{ data: notes },
		{ data: noteCompletions },
		{ data: inbodyRecords },
		{ data: activities },
		{ data: sessions },
		{ data: pushSubs },
	] = await Promise.all([
		// 운동 기록 전체
		supabase
			.from('workout_logs')
			.select('id, logged_at, workout_type, duration_min, mets_score')
			.eq('member_id', id)
			.order('logged_at', { ascending: true }),

		// 알림장
		supabase
			.from('notes')
			.select('id, is_sent, written_at, note_workouts(id)')
			.eq('member_id', id),

		// 알림장 수행 완료 기록
		supabase
			.from('note_workout_completions')
			.select('id, note_workout_id')
			.eq('member_id', id),

		// 인바디 기록 전체 (최신순)
		supabase
			.from('inbody_records')
			.select('id, measured_at, weight, muscle_mass, body_fat_pct, visceral_fat')
			.eq('member_id', id)
			.order('measured_at', { ascending: false }),

		// 생활패턴
		supabase
			.from('daily_activities')
			.select('*')
			.eq('member_id', id)
			.order('recorded_at', { ascending: false }),

		// 앱 접속 이력 (최근 20건)
		supabase
			.from('app_sessions')
			.select('id, opened_at, user_agent')
			.eq('member_id', id)
			.order('opened_at', { ascending: false })
			.limit(20),

		// PWA 설치 여부 (push_subscriptions)
		supabase
			.from('push_subscriptions')
			.select('id, created_at')
			.eq('member_id', id)
			.order('created_at', { ascending: true })
			.limit(1),
	])

	return (
		<MemberRecordSection
			member={member}
			workoutLogs={workoutLogszzz ?? []}
			notes={notes ?? []}
			noteCompletions={noteCompletions ?? []}
			inbodyRecords={inbodyRecords ?? []}
			activities={activities ?? []}
			sessions={sessions ?? []}
			pushSubs={pushSubs ?? []}
		/>
	)
}
