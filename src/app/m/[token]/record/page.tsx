// src/app/m/[token]/record/page.tsx
// 서버 컴포넌트 — Supabase에서 workout_logs 조회 후 RecordListManager로 전달

import { createClient } from '@/lib/supabase/server'
import type { WorkoutLog } from '@/types/database'
import RecordListManager from './RecordListManager'
import { toLocalISO } from '@/lib/weekUtils'

interface PageProps {
	params: Promise<{ token: string }>
}

export default async function RecordPage({ params }: PageProps) {
	const { token } = await params
	const supabase = await createClient()

	// 1. 회원 조회
	const { data: member } = await supabase
		.from('members')
		.select('id')
		.eq('access_token', token)
		.single()

	if (!member) {
		return (
			<div className="px-2">
				<p className="text-sm text-[#7f847d] pt-4">회원 정보를 찾을 수 없습니다.</p>
			</div>
		)
	}

	// 2. 운동 기록 조회 (최신순)
	const { data } = await supabase
		.from('workout_logs')
		.select('*')
		.eq('member_id', member.id)
		.order('logged_at', { ascending: false })

	const logs = (data ?? []) as WorkoutLog[]
	const today = toLocalISO(new Date())  // 오늘 날짜 (YYYY-MM-DD)

	return <RecordListManager member={member} initialLogs={logs} today={today} />
}
