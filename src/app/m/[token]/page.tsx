import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getCurrentWeekStart } from '@/lib/weekUtils'
import TodayRoutineCard from '@/components/member/TodayRoutineCard'

import { calcTotalMets, getActivityStatus } from '@/lib/metsUtils'

// ★ 로컬 타임존 기준 'YYYY-MM-DD' 반환
function toLocalISO(date: Date): string {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

// ★ 'YYYY-MM-DD' → 로컬 타임존 Date 파싱
function parseLocalDate(dateStr: string): Date {
	const [y, m, d] = dateStr.split('-').map(Number)
	return new Date(y, m - 1, d)
}

// ★ 기준일로부터 7개 날짜 레이블 생성 (로컬 타임존 기준)
function getWeekDays(weekStart: string) {
	const DAY_KR = ['일', '월', '화', '수', '목', '금', '토']
	return Array.from({ length: 7 }, (_, i) => {
		const d = parseLocalDate(weekStart)
		d.setDate(d.getDate() + i)
		return {
			iso: toLocalISO(d),
			label: DAY_KR[d.getDay()],
		}
	})
}

export default async function MemberHomePage({
	params,
}: {
	params: Promise<{ token: string }>
}) {
	const { token } = await params
	const supabase = await createClient()

	const { data: member } = await supabase
		.from('members')
		.select('id, name, week_start_date')
		.eq('access_token', token)
		.single()

	if (!member) return null

	// ★ 기준일 기반으로 현재 주 계산
	const baseDate = member.week_start_date ?? toLocalISO(new Date())
	const weekStart = getCurrentWeekStart(baseDate)
	const weekEnd = (() => {
		const [y, m, d] = weekStart.split('-').map(Number)
		const date = new Date(y, m - 1, d)      // parseLocalDate와 동일
		date.setDate(date.getDate() + 6)
		const ey = date.getFullYear()
		const em = String(date.getMonth() + 1).padStart(2, '0')
		const ed = String(date.getDate()).padStart(2, '0')
		return `${ey}-${em}-${ed}`              // toLocalISO와 동일
	})()

	const { data: weekLogs } = await supabase
		.from('workout_logs')
		.select('logged_at, mets_score, duration_min, workout_type, source')
		.eq('member_id', member.id)
		.gte('logged_at', weekStart)
		.lte('logged_at', weekEnd)   // ← 월요일 기준이 아닌 정확히 7일
		.order('logged_at')

	const { data: latestNote } = await supabase
		.from('notes')
		.select('id, content, written_at, note_tags(tag), recommended_mets')
		.eq('member_id', member.id)
		.eq('is_sent', true)
		.order('written_at', { ascending: false })
		.limit(1)
		.single()



	const today = toLocalISO(new Date());
	const weekTotalMets = calcTotalMets(weekLogs ?? [])
	const recommendedMets = latestNote?.recommended_mets ?? 600
	const dailyTarget = recommendedMets / 7

	const todayLogs = weekLogs?.filter(l => l.logged_at === today) ?? []
	const todayTotalMets = todayLogs.reduce((s, l) => s + l.mets_score * l.duration_min, 0)
	const todayTotalDuration = todayLogs.reduce((s, l) => s + l.duration_min, 0)

	// ★ 기준일 기반 7일 막대 그래프,  source별 METs 분리
	const weekBars = getWeekDays(weekStart).map(({ iso, label }) => {
		const dayLogs = weekLogs?.filter(l => l.logged_at === iso) ?? []

		// source별 METs 분리
		const routineMets = dayLogs
			.filter(l => l.source === 'routine')
			.reduce((s, l) => s + l.mets_score * l.duration_min, 0)
		const manualMets = dayLogs
			.filter(l => l.source === 'manual')
			.reduce((s, l) => s + l.mets_score * l.duration_min, 0)
		const dailyMets = dayLogs
			.filter(l => l.source === 'daily')
			.reduce((s, l) => s + l.mets_score * l.duration_min, 0)

		const totalDayMets = routineMets + manualMets + dailyMets
		const ratio = dailyTarget > 0 ? totalDayMets / dailyTarget : 0
		const isToday = iso === today

		return { label, routineMets, manualMets, dailyMets, totalDayMets, has: dayLogs.length > 0, ratio, isToday }
	})


	// 오늘 요일에 맞는 처방 루틴 조회
	const todayDayName = ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()];

	const { data: latestNoteWithWorkouts } = await supabase
		.from('notes')
		.select(`
			id,
			note_workouts ( id, day, workout_type, intensity, duration_min, mets, sort_order, coach_memo )
		`)
		.eq('member_id', member.id)
		.eq('is_sent', true)
		.order('written_at', { ascending: false })
		.limit(1)
		.single();

	// 오늘 요일 또는 '전체'에 해당하는 루틴만 필터
	const todayRoutines = (latestNoteWithWorkouts?.note_workouts ?? [])
		.filter((w: any) => w.day === todayDayName || w.day === '전체')
		.sort((a: any, b: any) => a.sort_order - b.sort_order)

	// 강사 입력 생활 패턴 조회 (최신 recorded_at 기준)
	const { data: rawPatterns } = await supabase
		.from('daily_activities')
		.select('activity_type, activity_label, mets_value, duration_min_per_day, recorded_at')
		.eq('member_id', member.id)
		.order('recorded_at', { ascending: false })

	const seenTypes = new Set<string>()
	const currentPatterns = (rawPatterns ?? []).filter((p: any) => {
		if (seenTypes.has(p.activity_type)) return false
		seenTypes.add(p.activity_type)
		return true
	}).filter((p: any) => p.duration_min_per_day > 0)

	// 오늘 이미 기록된 항목 확인 (중복 저장 방지용)
	const todayAlreadySaved = (todayLogs.length > 0 &&
		todayLogs.some((l: any) => l.source === 'routine' || l.source === 'daily'))




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
						<div key={label} className="flex-1 bg-card2 border border-white/[0.07] rounded-xl p-3 text-center">
							<p className={`font-mono text-2xl font-medium ${color}`}>{value}</p>
							<p className="text-[10px] text-white/40 mt-1">{label}</p>
						</div>
					))}
				</div>
			</div>


			{/* ★ 16+17번: 오늘 루틴 카드 */}
			<TodayRoutineCard
				memberId={member.id}
				today={today}
				routines={todayRoutines}
				patterns={currentPatterns}
			/>

			<div className="ml-card">
				<div className="flex items-center justify-between gap-2 mb-3">
					<div>
						<p className="ml-card-label m-0">이번 주 활동</p>
						{/* ★ 기준일 표시 */}
						<p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
							{weekStart} ~ {weekEnd}
						</p>
					</div>
					<p className="text-xs text-white/30 font-mono">
						<span className="text-mint">{Math.round(weekTotalMets)}</span>
						<span className="text-white/30"> / {recommendedMets} METs</span>
					</p>
				</div>

				<div className="flex items-end gap-1.5 h-14">
					{weekBars.map(({ label, routineMets, manualMets, dailyMets, totalDayMets, has, ratio, isToday }) => {
						const maxMets = Math.max(...weekBars.map(b => b.totalDayMets), dailyTarget)
						const barH = (mets: number) =>
							maxMets > 0 ? Math.max((mets / maxMets) * 100, mets > 0 ? 6 : 0) : 0

						return (
							<div key={label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
								{has ? (
									/* 스택 바 — daily(연한) / manual(중간) / routine(진한) 순으로 아래부터 쌓임 */
									<div className="w-full flex flex-col justify-end rounded overflow-hidden"
										style={{
											height: `${Math.max(Math.min(ratio, 1) * 100, 8)}%`,
											outline: isToday ? '2px solid rgba(61,219,181,0.6)' : 'none',
											outlineOffset: 2,
											borderRadius: 4,
										}}>
										{/* routine — 진한 mint */}
										{routineMets > 0 && (
											<div style={{
												height: `${barH(routineMets)}%`,
												background: 'rgba(61,219,181,1)',
												minHeight: 3,
											}} />
										)}
										{/* manual — 중간 mint */}
										{manualMets > 0 && (
											<div style={{
												height: `${barH(manualMets)}%`,
												background: 'rgba(61,219,181,0.55)',
												minHeight: 3,
											}} />
										)}
										{/* daily — 연한 mint */}
										{dailyMets > 0 && (
											<div style={{
												height: `${barH(dailyMets)}%`,
												background: 'rgba(61,219,181,0.25)',
												minHeight: 3,
											}} />
										)}
									</div>
								) : (
									/* 기록 없는 날 — 점선 빈 막대 */
									<div className="w-full"
										style={{
											height: '100%',
											border: '1px dashed rgba(255,255,255,0.12)',
											borderRadius: 4,
											outline: isToday ? '2px solid rgba(61,219,181,0.6)' : 'none',
											outlineOffset: 2,
										}} />
								)}
								<span className="text-[9px] font-mono"
									style={{ color: isToday ? '#3DDBB5' : 'rgba(255,255,255,0.3)' }}>
									{label}
								</span>
							</div>
						)
					})}
				</div>

				{/* 범례  */}
				<div className="flex gap-3 mt-2 justify-end">
					{[
						{ color: 'rgba(61,219,181,1)', label: '루틴' },
						{ color: 'rgba(61,219,181,0.55)', label: '직접' },
						{ color: 'rgba(61,219,181,0.25)', label: '일상' },
					].map(({ color, label }) => (
						<div key={label} className="flex items-center gap-1">
							<div className="w-2 h-2 rounded-sm" style={{ background: color }} />
							<span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>
								{label}
							</span>
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
