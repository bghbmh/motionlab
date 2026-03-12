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
import EditMemberButton from '@/components/studio/EditMemberButton';
import WeeklyWorkoutDetail from '@/components/studio/WeeklyWorkoutDetail';


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
	   week_start_date,
      inbody_records (
        id, weight, muscle_mass, body_fat_pct, body_fat_mass, bmi, visceral_fat, measured_at
      ),
      workout_logs (
        id, logged_at, workout_type, duration_min, mets_score, condition_memo
      ),
      notes (
        id, content, intensity, written_at, is_sent,
        note_tags ( tag )
      )
    `)
		.eq('id', id)
		.single()

	if (!member) notFound();

	const baseDate = member.registered_at;

	// 이 기준일로부터의 로그만 미리 필터링해서 넘겨주면 더 좋음
	const relevantLogs = (member.workout_logs || []).filter((l: any) => {
		// 대략 기준일 전후 데이터를 적절히 넘김 (여유있게 전체를 넘겨도 무방)
		return true
	})

	console.log("member - ", member, baseDate)

	const weekStart = getWeekStart()
	const weekLogs: WorkoutLog[] = (member.workout_logs ?? []).filter(
		(l: WorkoutLog) => l.logged_at >= weekStart
	)
	const totalMets = weekLogs.length
		? weekLogs.reduce((s: number, l: WorkoutLog) => s + l.mets_score, 0)
		: 0;

	const status = getActivityStatus(totalMets)

	const weekDays = Array.from({ length: 7 }, (_, i) => {
		const d = new Date(weekStart)
		d.setDate(d.getDate() + i)
		const iso = d.toISOString().split('T')[0]
		const log = weekLogs.find((l: WorkoutLog) => l.logged_at === iso)
		return { day: DAY_LABELS[i], mets: log?.mets_score ?? 0, has: !!log }
	})

	const maxMets = Math.max(...weekDays.map(d => d.mets), 0.1)

	const latestInbody = member.inbody_records
		?.sort((a: any, b: any) => b.measured_at.localeCompare(a.measured_at))[0]

	const recentNotes = member.notes
		?.filter((n: any) => n.is_sent)
		.sort((a: any, b: any) => b.written_at.localeCompare(a.written_at))
		.slice(0, 3)

	const badgeClass = { low: 'badge-low', good: 'badge-good', high: 'badge-high' }[status]

	return (
		<div className="flex gap-5">
			{/* Left */}
			<div className="flex-1 flex flex-col gap-4">

				{/* 회원 헤더 */}
				<div className="ml-card flex flex-col gap-3">
					{/* 상단: 등록일 + 삭제 버튼 */}
					<div className="flex justify-between items-center">
						<span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
							등록 {member.registered_at} · 주 {member.sessions_per_week}회
						</span>
						<EditMemberButton
							memberId={member.id}
							memberName={member.name}
							memberPhone={member.phone}
							memberBirthDate={member.birth_date}
							memberSessionsPerWeek={member.sessions_per_week}
							memberMemo={member.memo}
							memberWeekStartDate={member.week_start_date ?? null}
						/>
					</div>

					{/* 하단: 이름 + 배지 + 액션 버튼 */}
					<div className="flex justify-between items-center flex-wrap gap-2">
						<div className="flex items-center gap-3">
							<h1 className="text-lg font-bold text-white">{member.name}</h1>
							<span className={badgeClass}>{ACTIVITY_STATUS_LABELS[status]}</span>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<CopyLinkButton accessToken={member.access_token} />
							<Link href={`/studio/members/${id}/notes`} className="btn-primary text-xs py-2 px-4">
								알림장 목록
							</Link>
							<Link href={`/studio/members/${id}/inbody/new`} className="btn-ghost text-xs py-2 px-4">
								인바디 기록보기
							</Link>
						</div>
					</div>
				</div>

				{/* 주간 차트 + 인바디 */}
				<div className="grid grid-cols-3 gap-4">

					{/* 주간 홈트 차트 */}
					<div className="col-span-1 ml-card flex flex-col">
						<div className="flex justify-between items-center mb-3">
							<p className="ml-card-label flex-none m-0">이번 주 홈트 기록</p>
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
				<WeeklyWorkoutDetail
					memberId={id}
					registeredAt={member.registered_at}
					inbodyDates={
						member.inbody_records
							?.map((r: any) => r.measured_at)
							.sort((a: string, b: string) => b.localeCompare(a))
						?? []
					}
					workoutLogs={member.workout_logs || []}
					initialWeekStartDate={member.week_start_date ?? undefined}
				/>
			</div>

			{/* Right: 최근 전송된 알림장 */}
			<div className="flex flex-col gap-3" style={{ width: 224, flexShrink: 0 }}>
				<p className="ml-card-label m-0" style={{ paddingLeft: 4 }}>최근 전송 알림장</p>
				{recentNotes?.length > 0 ? recentNotes.map((note: any) => (
					<div key={note.id} className="ml-card" style={{ borderColor: 'rgba(61,219,181,0.18)' }}>
						<div className="flex items-center gap-1.5 mb-2">
							<p className="font-mono text-xs" style={{ color: '#3DDBB5' }}>
								{note.written_at}
							</p>
							<span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
								style={{ background: 'rgba(61,219,181,0.1)', color: '#3DDBB5', border: '1px solid rgba(61,219,181,0.2)' }}>
								전송됨
							</span>
						</div>
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
						전송된 알림장이 없습니다.
					</p>
				)}
				<Link href={`/studio/members/${id}/notes`}
					className="btn-primary text-center text-xs py-2.5 mt-1">
					알림장 목록
				</Link>
			</div>
		</div >
	)
}
