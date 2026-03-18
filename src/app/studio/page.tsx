
// export default async function StudioPage() {

// 	return (
// 		<div className="flex items-center justify-center h-full min-h-[60vh]">
// 			<div className="text-center">
// 				<p className="text-4xl mb-4">👈</p>
// 				<p className="text-white/40 text-sm">왼쪽에서 회원을 선택하세요</p>
// 			</div>
// 		</div>
// 	)
// }


import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { calcTotalMets, getActivityStatus, ACTIVITY_STATUS_LABELS } from '@/lib/metsUtils'


function getWeekStart() {
	const d = new Date()
	const day = d.getDay()
	d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
	return d.toISOString().split('T')[0]
}

export default async function StudioPage() {
	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) redirect('/login')

	const { data: instructor } = await supabase
		.from('instructors')
		.select('studio_id')
		.eq('id', user.id)
		.single()

	if (!instructor) redirect('/login')

	const weekStart = getWeekStart()

	// 전체 회원 + 이번 주 운동 기록
	const { data: members } = await supabase
		.from('members')
		.select(`
			id, name, sessions_per_week,
			workout_logs ( logged_at, mets_score, duration_min, source ),
			notes ( recommended_mets, is_sent, written_at )
		`)
		.eq('studio_id', instructor.studio_id)
		.eq('is_active', true)
		.order('name')

	if (!members || members.length === 0) {
		return (
			<div className="flex items-center justify-center h-full min-h-[60vh]">
				<div className="text-center">
					<p className="text-4xl mb-4">👈</p>
					<p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
						아직 등록된 회원이 없습니다.
					</p>
				</div>
			</div>
		)
	}

	// 회원별 이번 주 데이터 계산
	const memberStats = members.map(m => {
		const weekLogs = (m.workout_logs ?? []).filter(
			(l: any) => l.logged_at >= weekStart
		)
		const activeDays = new Set(weekLogs.map((l: any) => l.logged_at)).size
		const totalMets = calcTotalMets(weekLogs)
		const status = getActivityStatus(totalMets)

		// ★ 목표 METs: 최신 전송된 알림장의 recommended_mets → 없으면 600
		const latestSentNote = (m.notes ?? [])
			.filter((n: any) => n.is_sent && n.recommended_mets)
			.sort((a: any, b: any) => b.written_at.localeCompare(a.written_at))[0]

		const targetMets = latestSentNote?.recommended_mets ?? 600

		const achieveRate = Math.min(
			Math.round((totalMets / targetMets) * 100),
			100
		)

		return { ...m, weekLogs, activeDays, totalMets, status, achieveRate, targetMets }
	})

	// 전체 요약 통계
	const totalMembers = memberStats.length
	const activeMembers = memberStats.filter(m => m.activeDays > 0).length
	const inactiveMembers = memberStats.filter(m => m.activeDays === 0).length
	const avgAchieveRate = Math.round(
		memberStats.reduce((s, m) => s + m.achieveRate, 0) / totalMembers
	)

	// 미수행 회원 상단 정렬
	const sorted = [...memberStats].sort((a, b) => {
		if (a.activeDays === 0 && b.activeDays > 0) return -1
		if (a.activeDays > 0 && b.activeDays === 0) return 1
		return b.totalMets - a.totalMets
	})

	return (
		<div className="flex flex-col gap-5">

			{/* ── 상단 요약 카드 3개 ── */}
			<div className="grid grid-cols-3 gap-3">
				{[
					{
						label: '전체 회원',
						value: `${totalMembers}명`,
						sub: `활동 중 ${activeMembers}명`,
						color: '#3DDBB5',
					},
					{
						label: '미수행 회원',
						value: `${inactiveMembers}명`,
						sub: '이번 주 기록 없음',
						color: inactiveMembers > 0 ? '#FF6B5B' : '#3DDBB5',
					},
					{
						label: '평균 달성률',
						value: `${avgAchieveRate}%`,
						sub: '주간 목표 대비',
						color: avgAchieveRate >= 70 ? '#3DDBB5' : avgAchieveRate >= 40 ? '#FFB347' : '#FF6B5B',
					},
				].map(({ label, value, sub, color }) => (
					<div key={label} className="ml-card text-center">
						<p className="ml-card-label m-0 mb-1">{label}</p>
						<p className="font-mono text-2xl font-bold" style={{ color }}>{value}</p>
						<p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</p>
					</div>
				))}
			</div>

			{/* ── 회원별 수행 현황 그리드 ── */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<p className="ml-card-label m-0">이번 주 회원별 수행 현황</p>
					<p className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
						{weekStart} ~
					</p>
				</div>

				<div className="grid grid-cols-2 gap-2">
					{sorted.map(m => {
						const isInactive = m.activeDays === 0
						const badgeClass = {
							low: 'badge-low', good: 'badge-good', high: 'badge-high',
						}[m.status]

						return (
							<Link
								key={m.id}
								href={`/studio/members/${m.id}`}
								className="ml-card flex flex-col gap-2.5 transition-all hover:border-mint/40"
								style={{
									borderColor: isInactive
										? 'rgba(255,107,91,0.2)'
										: 'rgba(255,255,255,0.07)',
								}}
							>
								{/* 이름 + 배지 */}
								<div className="flex justify-between items-center">
									<div className="flex items-center gap-2">
										{isInactive && (
											<span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
												style={{ background: 'rgba(255,107,91,0.12)', color: '#FF6B5B', border: '1px solid rgba(255,107,91,0.25)' }}>
												미수행
											</span>
										)}
										<span className="text-sm font-bold text-white">{m.name}</span>
									</div>
									<span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${badgeClass}`}>
										{ACTIVITY_STATUS_LABELS[m.status]}
									</span>
								</div>

								{/* 달성률 프로그레스 바 */}
								<div>
									<div className="flex justify-between items-center mb-1">
										<span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
											주간 달성률
										</span>
										<span className="text-[10px] font-mono font-bold"
											style={{
												color: m.achieveRate >= 70 ? '#3DDBB5'
													: m.achieveRate >= 40 ? '#FFB347' : '#FF6B5B',
											}}>
											{m.achieveRate}%
										</span>
									</div>
									<div className="w-full h-1.5 rounded-full"
										style={{ background: 'rgba(255,255,255,0.07)' }}>
										<div
											className="h-1.5 rounded-full transition-all"
											style={{
												width: `${m.achieveRate}%`,
												background: m.achieveRate >= 70 ? '#3DDBB5'
													: m.achieveRate >= 40 ? '#FFB347' : 'rgba(255,107,91,0.7)',
											}}
										/>
									</div>
								</div>

								{/* 하단 통계 */}
								<div className="flex justify-between text-[11px] font-mono"
									style={{ color: 'rgba(255,255,255,0.4)' }}>
									<span>
										{m.activeDays}일 수행
										<span className="ml-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
											/ 주 {m.sessions_per_week}회
										</span>
									</span>
									<span style={{ color: m.totalMets > 0 ? 'rgba(61,219,181,0.7)' : 'rgba(255,255,255,0.2)' }}>
										{Math.round(m.totalMets)}
										<span style={{ color: 'rgba(255,255,255,0.25)' }}> / {m.targetMets} METs</span>
									</span>
								</div>
							</Link>
						)
					})}
				</div>
			</div>
		</div>
	)
}