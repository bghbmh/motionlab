import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function getWeekStart() {
	const d = new Date()
	const day = d.getDay()
	d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
	return d.toISOString().split('T')[0]
}

const DAY_KR = ['월', '화', '수', '목', '금', '토', '일']

export default async function MemberHomePage({
	params,
}: {
	params: Promise<{ token: string }>
}) {
	const { token } = await params

	const supabase = await createClient()

	const { data: member } = await supabase
		.from('members')
		.select('id, name')
		.eq('access_token', token)
		.single()

	if (!member) return null

	const weekStart = getWeekStart()

	const { data: weekLogs } = await supabase
		.from('workout_logs')
		.select('logged_at, mets_score, duration_min, workout_type')
		.eq('member_id', member.id)
		.gte('logged_at', weekStart)
		.order('logged_at')

	// 전송된 알림장 중 가장 최근 1개만 홈에 표시
	const { data: latestNote } = await supabase
		.from('notes')
		.select('id, content, written_at, note_tags(tag), recommended_mets')
		.eq('member_id', member.id)
		.eq('is_sent', true)
		.order('written_at', { ascending: false })
		.limit(1)
		.single()

	const today = new Date().toISOString().split('T')[0]

	// 주간 누적 METs (mets_score * duration_min 합계)
	const weekTotalMets = weekLogs?.reduce((s, l) => s + l.mets_score * l.duration_min, 0) ?? 0
	const recommendedMets = latestNote?.recommended_mets ?? 600
	const dailyTarget = recommendedMets / 7

	// 오늘 누적 METs (하루에 여러 기록 대응)
	const todayLogs = weekLogs?.filter(l => l.logged_at === today) ?? []
	const todayTotalMets = todayLogs.reduce((s, l) => s + l.mets_score * l.duration_min, 0)
	const todayTotalDuration = todayLogs.reduce((s, l) => s + l.duration_min, 0)

	// 막대그래프: 날짜별 누적 METs → 일일 목표 대비 달성률 (3단계 색상)
	const weekBars = Array.from({ length: 7 }, (_, i) => {
		const d = new Date(weekStart)
		d.setDate(d.getDate() + i)
		const iso = d.toISOString().split('T')[0]
		const dayLogs = weekLogs?.filter(l => l.logged_at === iso) ?? []
		const dailyMets = dayLogs.reduce((s, l) => s + l.mets_score * l.duration_min, 0)
		const ratio = dailyTarget > 0 ? dailyMets / dailyTarget : 0
		return { day: DAY_KR[i], mets: dailyMets, has: dayLogs.length > 0, ratio }
	})

	return (
		<div className="p-4 flex flex-col gap-4">
			<div className="pt-2">
				<p className="text-white/40 text-sm">안녕하세요 👋</p>
				<p className="text-lg font-bold text-white mt-0.5">{member.name}님</p>
			</div>

			<div className="ml-card">
				<p className="ml-card-label">오늘의 활동</p>
				<div className="flex gap-3">
					{[
						{ label: 'METs 점수', value: todayTotalMets > 0 ? Math.round(todayTotalMets).toString() : '—', color: 'text-mint' },
						{ label: '운동 시간', value: todayTotalDuration > 0 ? `${todayTotalDuration}분` : '—', color: 'text-white' },
						{ label: '이번 주 활동일', value: `${new Set(weekLogs?.map(l => l.logged_at)).size ?? 0}일`, color: 'text-amber' },
					].map(({ label, value, color }) => (
						<div key={label}
							className="flex-1 bg-card2 border border-white/[0.07] rounded-xl p-3 text-center">
							<p className={`font-mono text-2xl font-medium ${color}`}>{value}</p>
							<p className="text-[10px] text-white/40 mt-1">{label}</p>
						</div>
					))}
				</div>
			</div>

			<div className="ml-card">
				<div className="flex items-center justify-between gap-2 mb-3">
					<p className="ml-card-label m-0">이번 주 활동</p>
					<p className="text-xs text-white/30 font-mono">
						<span className="text-mint">{Math.round(weekTotalMets)}</span>
						<span className="text-white/30"> / {recommendedMets} METs</span>
					</p>
				</div>

				{/* 막대그래프 - 달성률 3단계 색상 */}
				<div className="flex items-end gap-1.5 h-14">
					{weekBars.map(({ day, has, ratio }) => (
						<div key={day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
							<div
								className="w-full rounded-t"
								style={{
									height: has ? `${Math.max(Math.min(ratio, 1) * 100, 8)}%` : '100%',
									background: has
										? ratio >= 1 ? 'rgba(219, 127, 61,1)'                    // 목표 달성: 밝은 민트
											: ratio >= 0.5 ? 'rgba(219, 127, 61,0.55)'   // 절반 이상: 중간
												: 'rgba(219, 127, 61,0.25)'                   // 절반 미만: 어둡게
										: 'transparent',
									border: has ? 'none' : '1px dashed rgba(255,255,255,0.12)',
									borderRadius: 4,
								}}
							/>
							<span className="text-[9px] font-mono text-white/30">{day}</span>
						</div>
					))}
				</div>
			</div>

			{latestNote && (
				<div className="ml-card">
					<p className="ml-card-label">최근 알림장</p>
					<div className="border-l-[3px] border-mint pl-3">
						<p className="text-sm text-white leading-relaxed line-clamp-3">
							{latestNote.content}
						</p>
						<p className="text-xs text-white/50 mt-1.5 font-mono">{latestNote.written_at}</p>
					</div>
					<hr className="ml-divider mt-3" />
					<div className="flex gap-2 mt-2">
						<Link href={`/m/${token}/notes`} className="btn-ghost flex-1 py-2 text-xs text-center">
							알림장 전체 →
						</Link>
						<Link href={`/m/${token}/videos`} className="btn-ghost flex-1 py-2 text-xs text-center">
							추천 영상 →
						</Link>
					</div>
				</div>
			)}

			{todayLogs.length === 0 && (
				<Link href={`/m/${token}/record`} className="btn-primary text-center py-4 text-sm">
					오늘 운동 기록하기 ✏️
				</Link>
			)}
		</div>
	)
}
