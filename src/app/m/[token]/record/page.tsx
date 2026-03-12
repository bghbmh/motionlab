
import { createClient } from '@/lib/supabase/server'
import {
	type WorkoutLog,
} from '@/types/database'

import RecordListManager from '@/components/member/RecordListManager'

// 서버 컴포넌트는 params를 props로 받습니다 (비동기 처리 권장)
interface PageProps {
	params: Promise<{ token: string }>
}

// ─── 메인 페이지 ──────────────────────────────────────────────────
export default async function RecordPage({ params }: PageProps) {
	// 1. params 추출
	const { token } = await params;
	const supabase = await createClient();

	const { data: member } = await supabase
		.from('members')
		.select('id')
		.eq('access_token', token)
		.single()

	if (!member) {
		console.log("RecordPage- 회원정보 - ", member)
		return (
			<div className="p-4 flex flex-col gap-4 pb-24">
				회원이 존재하지 않습니다
			</div>
		)
	}

	const { data } = await supabase
		.from('workout_logs')
		.select('*')
		.eq('member_id', member.id)
		.order('logged_at', { ascending: false })

	const logs = (data ?? []) as WorkoutLog[];

	//console.log("access_token - ", member, data)


	return (
		<div className="p-4 flex flex-col gap-4 pb-24">
			{/* 헤더 */}
			<div className="flex justify-between items-center pt-1">
				<h2 className="text-base font-bold text-white">내 운동 기록</h2>
				{logs.length > 0 && (
					<span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
						총 {logs.length}회
					</span>
				)}
			</div>

			<RecordListManager member={member} hasLogs={logs} />
		</div>
	)
}
