import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getCurrentWeekStart } from '@/lib/weekUtils'

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
		.select('logged_at, mets_score, duration_min, workout_type')
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
	const weekTotalMets = weekLogs?.reduce((s, l) => s + l.mets_score * l.duration_min, 0) ?? 0
	const recommendedMets = latestNote?.recommended_mets ?? 600
	const dailyTarget = recommendedMets / 7

	const todayLogs = weekLogs?.filter(l => l.logged_at === today) ?? []
	const todayTotalMets = todayLogs.reduce((s, l) => s + l.mets_score * l.duration_min, 0)
	const todayTotalDuration = todayLogs.reduce((s, l) => s + l.duration_min, 0)

	// ★ 기준일 기반 7일 막대 그래프
	const weekBars = getWeekDays(weekStart).map(({ iso, label }) => {
		const dayLogs = weekLogs?.filter(l => l.logged_at === iso) ?? []
		const dailyMets = dayLogs.reduce((s, l) => s + l.mets_score * l.duration_min, 0)
		const ratio = dailyTarget > 0 ? dailyMets / dailyTarget : 0
		const isToday = iso === today
		return { label, mets: dailyMets, has: dayLogs.length > 0, ratio, isToday }
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
						<div key={label} className="flex-1 bg-card2 border border-white/[0.07] rounded-xl p-3 text-center">
							<p className={`font-mono text-2xl font-medium ${color}`}>{value}</p>
							<p className="text-[10px] text-white/40 mt-1">{label}</p>
						</div>
					))}
				</div>
			</div>

			<div className="ml-card">
				<div className="flex items-center justify-between gap-2 mb-3">
					<div>
						<p className="ml-card-label m-0">이번 주 활동</p>
						{/* ★ 기준일 표시 */}
						<p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
							{weekStart} ~ {weekEnd}
						</p>
					</div>
					<p className="text-xs text-white/30 font-mono">
						<span className="text-mint">{Math.round(weekTotalMets)}</span>
						<span className="text-white/30"> / {recommendedMets} METs</span>
					</p>
				</div>

				<div className="flex items-end gap-1.5 h-14">
					{weekBars.map(({ label, has, ratio, isToday }) => (
						<div key={label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
							<div
								className="w-full rounded-t"
								style={{
									height: has ? `${Math.max(Math.min(ratio, 1) * 100, 8)}%` : '100%',
									background: has
										? ratio >= 1 ? 'rgba(219,127,61,1)'
											: ratio >= 0.5 ? 'rgba(219,127,61,0.55)'
												: 'rgba(219,127,61,0.25)'
										: 'transparent',
									border: has ? 'none' : '1px dashed rgba(255,255,255,0.12)',
									borderRadius: 4,
									// ★ 오늘 날짜 강조
									outline: isToday ? '2px solid rgba(61,219,181,0.6)' : 'none',
									outlineOffset: 2,
								}}
							/>
							<span className="text-[9px] font-mono"
								style={{ color: isToday ? '#3DDBB5' : 'rgba(255,255,255,0.3)' }}>
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
