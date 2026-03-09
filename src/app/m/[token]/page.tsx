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

	const { data: latestNote } = await supabase
		.from('notes')
		.select('id, content, written_at, note_tags(tag)')
		.eq('member_id', member.id)
		.order('written_at', { ascending: false })
		.limit(1)
		.single()

	const today = new Date().toISOString().split('T')[0]
	const todayLog = weekLogs?.find(l => l.logged_at === today)

	const weekBars = Array.from({ length: 7 }, (_, i) => {
		const d = new Date(weekStart)
		d.setDate(d.getDate() + i)
		const iso = d.toISOString().split('T')[0]
		const log = weekLogs?.find(l => l.logged_at === iso)
		return { day: DAY_KR[i], mets: log?.mets_score ?? 0, has: !!log }
	})

	const maxMets = Math.max(...weekBars.map(b => b.mets), 0.1)
	const avgMets = weekLogs?.length
		? weekLogs.reduce((s, l) => s + l.mets_score, 0) / weekLogs.length
		: 0

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
						{ label: 'METs 점수', value: todayLog?.mets_score.toFixed(1) ?? '—', color: 'text-mint' },
						{ label: '운동 시간', value: todayLog ? `${todayLog.duration_min}분` : '—', color: 'text-white' },
						{ label: '이번 주 활동일', value: `${weekLogs?.length ?? 0}일`, color: 'text-amber' },
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
					<p className="text-xs text-white/30 font-mono mt-2">
						<span className="text-mint">{avgMets.toFixed(1)} METs</span>
					</p>
				</div>

				<div className="flex items-end gap-1.5 h-14">
					{weekBars.map(({ day, mets, has }) => (
						<div key={day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
							<div
								className="w-full rounded-t"
								style={{
									height: has ? `${(mets / maxMets) * 100}%` : '100%',
									background: has
										? mets > maxMets * 0.7 ? '#3DDBB5' : 'rgba(61,219,181,0.35)'
										: 'transparent',
									border: has ? 'none' : '1px dashed rgba(255,255,255,0.12)',
									minHeight: has ? 4 : undefined,
									borderRadius: 4,
								}}
							/>
							<span className="text-[9px] font-mono text-white/30">{day}</span>
						</div>
					))}
				</div>
				<p className="text-xs text-white/30 font-mono mt-2">
					오늘 <span className="text-mint">{avgMets.toFixed(1)} METs</span>
				</p>
			</div>

			{latestNote && (
				<div className="ml-card">
					<p className="ml-card-label">강사 알림장</p>
					<div className="border-l-[3px] border-mint pl-3">
						<p className="text-sm text-white leading-relaxed line-clamp-3">
							{latestNote.content}
						</p>
						<p className="text-xs text-white/30 mt-1.5 font-mono">{latestNote.written_at}</p>
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

			{!todayLog && (
				<Link href={`/m/${token}/record`} className="btn-primary text-center py-4 text-sm">
					오늘 운동 기록하기 ✏️
				</Link>
			)}
		</div>
	)
}
