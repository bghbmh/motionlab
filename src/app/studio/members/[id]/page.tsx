import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
	ACTIVITY_STATUS_LABELS,
	WORKOUT_TYPE_LABELS,
	getActivityStatus,
	type WorkoutLog,
} from '@/types/database'
import CopyLinkButton from '@/components/studio/CopyLinkButton'

function getWeekStart() {
	const d = new Date()
	const day = d.getDay()
	const diff = d.getDate() - day + (day === 0 ? -6 : 1)
	d.setDate(diff)
	return d.toISOString().split('T')[0]
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export default async function MemberDetailPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params

	const supabase = await createClient()

	const { data: member } = await supabase
		.from('members')
		.select(`
      *,
      inbody_records (
        id, weight, muscle_mass, body_fat_pct, body_fat_mass, bmi, visceral_fat, measured_at
      ),
      workout_logs (
        id, logged_at, workout_type, duration_min, mets_score, condition_memo
      ),
      notes (
        id, content, intensity, written_at,
        note_tags ( tag )
      )
    `)
		.eq('id', id)
		.single()

	if (!member) notFound()

	const weekStart = getWeekStart()
	const weekLogs: WorkoutLog[] = (member.workout_logs ?? []).filter(
		(l: WorkoutLog) => l.logged_at >= weekStart
	)
	const avgMets = weekLogs.length
		? weekLogs.reduce((s: number, l: WorkoutLog) => s + l.mets_score, 0) / weekLogs.length
		: 0
	const status = getActivityStatus(avgMets)

	const weekDays = Array.from({ length: 7 }, (_, i) => {
		const d = new Date(weekStart)
		d.setDate(d.getDate() + i)
		const iso = d.toISOString().split('T')[0]
		const log = weekLogs.find((l: WorkoutLog) => l.logged_at === iso)
		return { day: DAY_LABELS[i], mets: log?.mets_score ?? 0, has: !!log }
	})

	const maxMets = Math.max(...weekDays.map(d => d.mets), 0.1)

	const latestInbody = member.inbody_records
		?.sort((a: any, b: any) => b.measured_at.localeCompare(a.measured_at))[0];

	console.log('latestInbody', member, latestInbody)

	const recentNotes = member.notes
		?.sort((a: any, b: any) => b.written_at.localeCompare(a.written_at))
		.slice(0, 3)

	const badgeClass = { low: 'badge-low', good: 'badge-good', high: 'badge-high' }[status]

	return (
		<div className="flex gap-5">
			{/* Left */}
			<div className="flex-1 flex flex-col gap-4">

				{/* 회원 헤더 */}
				<div className="ml-card flex justify-between items-center">
					<div className="flex items-center gap-3 flex-wrap">
						<h1 className="text-lg font-bold text-white">{member.name}</h1>
						<span className={badgeClass}>{ACTIVITY_STATUS_LABELS[status]}</span>
						<span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
							등록 {member.registered_at} · 주 {member.sessions_per_week}회
						</span>
					</div>

					{/* 액션 버튼 그룹 */}
					<div className="flex items-center gap-2 shrink-0">
						{/* 회원앱 링크 복사 */}
						<CopyLinkButton accessToken={member.access_token} />

						<Link href={`/studio/members/${id}/notes/new`} className="btn-primary text-xs py-2 px-4">
							알림장 작성
						</Link>
						<Link href={`/studio/members/${id}/inbody/new`} className="btn-ghost text-xs py-2 px-4">
							인바디 입력
						</Link>
					</div>
				</div>

				{/* 주간 차트 + 인바디 */}
				<div className="grid grid-cols-3 gap-4">

					{/* 주간 홈트 차트 */}
					<div className="col-span-1 ml-card flex flex-col">
						<div className="flex justify-between items-center mb-3">
							<p className="ml-card-label flex-none m-0">이번 주 홈트 기록</p>
							<p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
								활동일{' '}
								<span style={{ color: '#3DDBB5' }}>{weekLogs.length}</span>일
							</p>
						</div>

						<div className="flex flex-col flex-1 gap-1.5">
							{weekDays.map(({ day, mets, has }) => (
								<div key={day} className="flex-1 flex items-center gap-3 w-full">
									<span className="text-[9px] font-mono w-4 shrink-0"
										style={{ color: 'rgba(255,255,255,0.3)' }}>
										{day}
									</span>
									<div
										className="h-1.5 rounded"
										style={{
											width: has ? `${(mets / maxMets) * 100}%` : '100%',
											background: has
												? mets > maxMets * 0.7 ? '#3DDBB5' : 'rgba(61,219,181,0.35)'
												: 'rgba(255,255,255,0.05)',
											minHeight: 6,
											borderRadius: 4,
										}}
									/>
								</div>
							))}
						</div>

						<p className="text-xs font-mono mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
							평균 METs{' '}
							<span style={{ color: avgMets < 2 ? '#FF6B5B' : '#3DDBB5' }}>
								{avgMets.toFixed(1)}
							</span>
						</p>
					</div>

					{/* 인바디 최근 */}
					<div className="ml-card col-span-2">
						<p className="ml-card-label">
							인바디 최근
							{latestInbody && (
								<span className="font-normal normal-case ml-1"
									style={{ color: 'rgba(255,255,255,0.2)' }}>
									· {latestInbody.measured_at}
								</span>
							)}
						</p>
						{latestInbody ? (
							<div className="grid grid-cols-3 gap-2">
								{[
									['체중', latestInbody.weight ? `${latestInbody.weight}kg` : '—'],
									['근육량', latestInbody.muscle_mass ? `${latestInbody.muscle_mass}kg` : '—'],
									['체지방률', latestInbody.body_fat_pct ? `${latestInbody.body_fat_pct}%` : '—'],
									['체지방량', latestInbody.body_fat_mass ? `${latestInbody.body_fat_mass}kg` : '—'],
									['BMI', latestInbody.bmi ? `${latestInbody.bmi}` : '—'],
									['내장지방레벨', latestInbody.visceral_fat ? `${latestInbody.visceral_fat}` : '—'],
								].map(([label, val]) => (
									<div key={label} className="ml-card text-center" style={{ padding: '0.625rem' }}>
										<p className="ml-card-label" style={{ marginBottom: '0.25rem' }}>{label}</p>
										<p className="font-mono text-sm font-medium text-white">{val}</p>
									</div>
								))}
							</div>
						) : (
							<p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
								인바디 기록이 없습니다.
							</p>
						)}
					</div>
				</div>

				{/* 이번 주 상세 로그 */}
				<div className="ml-card">
					<div className="flex justify-between items-center mb-3">
						<p className="ml-card-label flex-none m-0">이번 주 홈트 상세</p>
						<p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
							평균 METs{' '}
							<span style={{ color: avgMets < 2 ? '#FF6B5B' : '#3DDBB5' }}>
								{avgMets.toFixed(1)}
							</span>
							{' '}· 활동일 {weekLogs.length}일
						</p>
					</div>
					<div className="flex flex-col" style={{ gap: 0 }}>
						{weekDays.map(({ day }, i) => {
							const d = new Date(weekStart)
							d.setDate(d.getDate() + i)
							const iso = d.toISOString().split('T')[0]
							const log = weekLogs.find((l: WorkoutLog) => l.logged_at === iso)
							return (
								<div key={day} className="flex justify-between py-2 text-sm"
									style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
									<span className="font-mono w-6"
										style={{ color: 'rgba(255,255,255,0.3)' }}>
										{day}
									</span>
									<span className="flex-1"
										style={{ color: log ? '#F0F4FF' : 'rgba(255,255,255,0.2)' }}>
										{log ? `${WORKOUT_TYPE_LABELS[log.workout_type]} ${log.duration_min}분` : '기록 없음'}
									</span>
									<span className="font-mono text-xs"
										style={{ color: log ? '#3DDBB5' : 'rgba(255,255,255,0.2)' }}>
										{log ? `${log.mets_score} METs` : '—'}
									</span>
								</div>
							)
						})}
					</div>
				</div>
			</div>

			{/* Right: 이전 알림장 */}
			<div className="flex flex-col gap-3" style={{ width: 224, flexShrink: 0 }}>
				<p className="ml-card-label" style={{ paddingLeft: 4 }}>이전 알림장</p>
				{recentNotes?.length > 0 ? recentNotes.map((note: any) => (
					<div key={note.id} className="ml-card">
						<p className="font-mono text-xs mb-2" style={{ color: '#3DDBB5' }}>
							{note.written_at}
						</p>
						<p className="text-xs leading-relaxed" style={{
							color: 'rgba(255,255,255,0.6)',
							display: '-webkit-box',
							WebkitLineClamp: 3,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
						}}>
							{note.content}
						</p>
						{note.note_tags?.length > 0 && (
							<div className="flex flex-wrap gap-1 mt-2">
								{note.note_tags.map((t: any) => (
									<span key={t.tag} className="text-[10px] rounded-full px-2 py-0.5"
										style={{
											background: '#1a2740',
											color: 'rgba(61,219,181,0.7)',
											border: '1px solid rgba(61,219,181,0.15)',
										}}>
										{t.tag}
									</span>
								))}
							</div>
						)}
					</div>
				)) : (
					<p className="text-xs pl-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
						작성된 알림장이 없습니다.
					</p>
				)}
				<Link href={`/studio/members/${id}/notes/new`}
					className="btn-primary text-center text-xs py-2.5 mt-1">
					알림장 작성
				</Link>
			</div>
		</div>
	)
}