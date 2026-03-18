import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
	ACTIVITY_STATUS_LABELS,
	WORKOUT_TYPE_LABELS,
	getActivityStatus,
	type WorkoutLog,
	type InbodyRecord,
} from '@/types/database'
import CopyLinkButton from '@/components/studio/CopyLinkButton'
import EditMemberButton from '@/components/studio/EditMemberButton'
import WeeklyWorkoutDetail from '@/components/studio/WeeklyWorkoutDetail'

function getWeekStart() {
	const d = new Date()
	const day = d.getDay()
	const diff = d.getDate() - day + (day === 0 ? -6 : 1)
	d.setDate(diff)
	return d.toISOString().split('T')[0]
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

// ── 인바디 증감 포맷 헬퍼 ─────────────────────────────────────────
function diffLabel(curr: number | null, prev: number | null, unit: string) {
	if (curr == null || prev == null) return null
	const d = Math.round((curr - prev) * 10) / 10
	if (d === 0) return null
	return { text: `${d > 0 ? '▲ ' : '▼ '}${Math.abs(d)}${unit}`, up: d > 0 }
}

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
				id, logged_at, workout_type, duration_min, mets_score, condition_memo, source
			),
			notes (
				id, content, intensity, written_at, is_sent, recommended_mets,
				note_tags ( tag ),
				note_workouts ( id, day, workout_type, intensity, duration_min, mets, sort_order ),
				note_videos ( id, title, video_id )
			)
		`)
		.eq('id', id)
		.single();

	// ── 일상활동 현재 유효 패턴 조회 (activity_type별 최신 recorded_at 기준) ──
	const { data: rawPatterns } = await supabase
		.from('daily_activities')
		.select('activity_type, activity_label, mets_value, duration_min_per_day, frequency_per_week, recorded_at, note')
		.eq('member_id', id)
		.order('recorded_at', { ascending: false });

	if (!member) notFound()

	// activity_type별 최신 1건만 필터링 (DISTINCT ON 대신 JS에서 처리)
	const seenTypes = new Set<string>()
	const currentPatterns = (rawPatterns ?? []).filter(p => {
		if (seenTypes.has(p.activity_type)) return false
		seenTypes.add(p.activity_type)
		return true
	}).filter(p => p.duration_min_per_day > 0)  // 0분(비활성) 제외

	// 주간 예상 일상활동 METs 합산
	const weeklyDailyMets = currentPatterns.reduce(
		(s, p) => s + p.mets_value * p.duration_min_per_day * p.frequency_per_week,
		0
	)

	// ── 주간 데이터 ───────────────────────────────────────────────
	const weekStart = getWeekStart()
	const weekLogs: WorkoutLog[] = (member.workout_logs ?? []).filter(
		(l: WorkoutLog) => l.logged_at >= weekStart
	)
	const totalMets = weekLogs.reduce((s: number, l: WorkoutLog) => s + l.mets_score, 0)
	const status = getActivityStatus(totalMets)

	const weekDays = Array.from({ length: 7 }, (_, i) => {
		const d = new Date(weekStart)
		d.setDate(d.getDate() + i)
		const iso = d.toISOString().split('T')[0]
		const log = weekLogs.find((l: WorkoutLog) => l.logged_at === iso)
		return { day: DAY_LABELS[i], mets: log?.mets_score ?? 0, has: !!log }
	})
	const maxMets = Math.max(...weekDays.map(d => d.mets), 0.1)

	// ── 인바디 최신 2건 ───────────────────────────────────────────
	const sortedInbody: InbodyRecord[] = (member.inbody_records ?? [])
		.slice()
		.sort((a: InbodyRecord, b: InbodyRecord) =>
			b.measured_at.localeCompare(a.measured_at)
		)
	const latestInbody = sortedInbody[0] ?? null
	const prevInbody = sortedInbody[1] ?? null   // ★ 직전 기록

	// ── 알림장 최근 3개 (is_sent) ─────────────────────────────────
	const recentNotes = (member.notes ?? [])
		.filter((n: any) => n.is_sent)
		.sort((a: any, b: any) => b.written_at.localeCompare(a.written_at))
		.slice(0, 3)

	const badgeClass = { low: 'badge-low', good: 'badge-good', high: 'badge-high' }[status]

	// ── 인바디 지표 목록 ──────────────────────────────────────────
	const inbodyFields: {
		label: string
		key: keyof InbodyRecord
		unit: string
	}[] = [
			{ label: '체중', key: 'weight', unit: 'kg' },
			{ label: '근육량', key: 'muscle_mass', unit: 'kg' },
			{ label: '체지방률', key: 'body_fat_pct', unit: '%' },
			{ label: '체지방량', key: 'body_fat_mass', unit: 'kg' },
			{ label: 'BMI', key: 'bmi', unit: '' },
			{ label: '내장지방', key: 'visceral_fat', unit: '' },
		]

	return (
		<div className="gap-5 grid grid-cols-6">
			{/* ── 좌측 ── */}
			<div className="col-span-3 flex-1 flex flex-col gap-4">

				{/* 회원 헤더 */}
				<div className="ml-card flex flex-col gap-3">
					<div className="flex justify-between items-center">
						<span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
							등록 {member.registered_at} · 주 {member.sessions_per_week}회
						</span>
						{/* ★ 9번: memberRegisteredAt prop 추가 */}
						<EditMemberButton
							memberId={member.id}
							memberName={member.name}
							memberPhone={member.phone}
							memberBirthDate={member.birth_date}
							memberSessionsPerWeek={member.sessions_per_week}
							memberMemo={member.memo}
							memberWeekStartDate={member.week_start_date ?? member.registered_at}
							memberRegisteredAt={member.registered_at}
						/>
					</div>

					<div className="flex items-center gap-3">
						<h1 className="text-xl font-bold text-white">{member.name}</h1>
						<span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
							{ACTIVITY_STATUS_LABELS[status]}
						</span>
					</div>

					<div className="flex items-center gap-2 flex-wrap">
						<CopyLinkButton accessToken={member.access_token} />
						<Link href={`/studio/members/${id}/notes`} className="btn-ghost text-sm text-mint ml-auto py-1 px-2.5">
							알림장 목록
						</Link>
						<Link href={`/studio/members/${id}/inbody/new`} className="btn-ghost text-sm text-mint py-1 px-2.5">
							인바디 기록보기
						</Link>
					</div>
				</div>

				{/* 주간 홈트 차트 */}
				<div className="ml-card">
					<p className="ml-card-label mb-3">이번 주 홈트 현황</p>
					<div className="flex items-end gap-1.5 h-16">
						{weekDays.map(({ day, mets, has }) => (
							<div key={day} className="flex-1 flex flex-col items-center gap-1">
								<div
									className="w-full rounded-sm transition-all"
									style={{
										height: `${Math.max((mets / maxMets) * 52, has ? 4 : 0)}px`,
										background: has ? '#3DDBB5' : 'rgba(255,255,255,0.06)',
										minHeight: has ? 4 : 0,
									}}
								/>
								<span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
									{day}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* ★ 11번: 인바디 최근 요약 — 증감 표시 */}
				<div className="ml-card">
					<div className="flex justify-between items-center mb-3">
						<p className="ml-card-label m-0">최근 인바디</p>
						{latestInbody && (
							<span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
								{latestInbody.measured_at}
								{prevInbody && (
									<span className="ml-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
										(전 {prevInbody.measured_at})
									</span>
								)}
							</span>
						)}
					</div>

					{latestInbody ? (
						<div className="grid grid-cols-3 gap-2">
							{inbodyFields.map(({ label, key, unit }) => {
								const curr = latestInbody[key] as number | null
								const prev = prevInbody?.[key] as number | null ?? null
								const diff = diffLabel(curr, prev, unit)
								return (
									<div key={label}
										className="rounded-xl px-3 py-2.5 flex flex-col gap-0.5"
										style={{ background: 'rgba(255,255,255,0.04)' }}>
										<span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
											{label}
										</span>
										<div className='flex items-center gap-3'>
											<span className="font-mono text-sm font-semibold text-white">
												{curr != null ? `${curr}${unit}` : '—'}
											</span>
											{diff && (
												<span className="font-mono text-[12px]"
													style={{ color: diff.up ? '#FF6B5B' : '#3DDBB5' }}>
													{diff.text}
												</span>
											)}
										</div>

									</div>
								)
							})}
						</div>
					) : (
						<p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
							인바디 기록이 없습니다.
						</p>
					)}
				</div>

				{/* ★ 10번: 최근 알림장 — note_workouts 포함 표시 */}
				<div className="ml-card">
					<div className="flex justify-between items-center mb-3">
						<p className="ml-card-label m-0">최근 알림장</p>
						<Link href={`/studio/members/${id}/notes`}
							className="text-[11px]" style={{ color: 'rgba(61,219,181,0.6)' }}>
							전체 보기 →
						</Link>
					</div>

					{recentNotes.length > 0 ? (
						<div className="flex flex-col gap-3">
							{recentNotes.map((note: any) => {
								const days: string[] = note.days ?? ['전체']
								const videoCount = note.note_videos?.length ?? 0
								return (
									<div key={note.id}
										className="rounded-xl p-3"
										style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
										{/* 날짜 + 강도 */}
										<div className="flex justify-between items-center mb-2">
											<span className="font-mono text-[11px]" style={{ color: '#3DDBB5' }}>
												{note.written_at}
											</span>
											<div className="flex items-center gap-1.5">
												{videoCount > 0 && (
													<span className="text-[10px] px-1.5 py-0.5 rounded"
														style={{ background: 'rgba(255,107,91,0.1)', color: 'rgba(255,107,91,0.7)' }}>
														🎬 {videoCount}
													</span>
												)}
												<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
													style={{
														background: note.intensity === 'high' ? 'rgba(255,107,91,0.1)' : note.intensity === 'recovery' ? 'rgba(255,179,71,0.1)' : 'rgba(61,219,181,0.1)',
														color: note.intensity === 'high' ? '#FF6B5B' : note.intensity === 'recovery' ? '#FFB347' : '#3DDBB5',
													}}>
													{note.intensity === 'high' ? '고강도' : note.intensity === 'recovery' ? '리커버리' : '일반'}
												</span>
											</div>
										</div>
										{/* 본문 */}
										<p className="text-xs leading-relaxed mb-2"
											style={{ color: 'rgba(255,255,255,0.65)' }}>
											{note.content}
										</p>
										{/* 요일별 운동처방 */}
										{note.note_workouts?.length > 0 && (
											<div className="flex flex-col gap-1 mt-1">
												{days.map((d: string) => {
													const dws = (note.note_workouts ?? [])
														.filter((w: any) => w.day === d)
														.sort((a: any, b: any) => a.sort_order - b.sort_order)
													if (dws.length === 0) return null
													return (
														<div key={d} className="flex items-center gap-1.5 flex-wrap">
															<span className="text-[10px] font-bold"
																style={{ color: 'rgba(255,255,255,0.3)', minWidth: 20 }}>
																{d === '전체' ? '매일' : d}
															</span>
															{dws.map((w: any) => (
																<span key={w.id}
																	className="text-[10px] px-1.5 py-0.5 rounded"
																	style={{ background: 'rgba(61,219,181,0.08)', color: 'rgba(61,219,181,0.8)' }}>
																	{WORKOUT_TYPE_LABELS[w.workout_type as keyof typeof WORKOUT_TYPE_LABELS]} {w.duration_min}분
																</span>
															))}
														</div>
													)
												})}
											</div>
										)}
									</div>
								)
							})}
						</div>
					) : (
						<p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
							전송된 알림장이 없습니다.
						</p>
					)}
				</div>
			</div>



			{/* ── 우측: 주간 상세 패널 ── */}
			{/* ── 우측: 주간 상세 패널 ── */}
			<div className="col-span-3 flex flex-col gap-4">
				{/* ★ 15번: 일상활동 요약 카드 */}
				<div className="ml-card">
					<div className="flex justify-between items-center mb-3">
						<p className="ml-card-label m-0">비방문일 생활 패턴</p>
						<div className="flex items-center gap-2">
							{weeklyDailyMets > 0 && (
								<span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
									주간 예상{' '}
									<span className="text-white font-bold">
										{Math.round(weeklyDailyMets)}
									</span>{' '}
									METs
								</span>
							)}

							<a href={`/studio/members/${id}/daily`}
								className="text-[11px]"
								style={{ color: 'rgba(61,219,181,0.6)' }}
							>
								수정 →
							</a>
						</div>
					</div>

					{currentPatterns.length > 0 ? (
						<div className="flex flex-col gap-2">
							{currentPatterns.map(p => {
								const weeklyMets = Math.round(p.mets_value * p.duration_min_per_day * p.frequency_per_week)
								return (
									<div key={p.activity_type}
										className="flex items-center justify-between py-2 px-3 rounded-xl"
										style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
										<div className="flex flex-col gap-0.5">
											<span className="text-sm text-white">{p.activity_label}</span>
											<span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
												하루 {p.duration_min_per_day}분
												{p.frequency_per_week < 7
													? ` · 주 ${p.frequency_per_week}회`
													: ' · 매일'}
												{p.note && ` · ${p.note}`}
											</span>
										</div>
										<div className="text-right shrink-0 ml-3">
											<p className="font-mono text-sm font-semibold" style={{ color: '#3DDBB5' }}>
												{weeklyMets}
											</p>
											<p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
												METs/주
											</p>
										</div>
									</div>
								)
							})}

							{/* 전체 합산 */}
							<div className="flex justify-between items-center pt-2 mt-1"
								style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
								<span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
									주간 일상활동 합산
								</span>
								<span className="font-mono text-sm font-bold text-white">
									{Math.round(weeklyDailyMets)} METs
								</span>
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center gap-2 py-4">
							<p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
								생활 패턴이 등록되지 않았습니다.
							</p>
							<a href={`/studio/members/new`}
								className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
								style={{ background: 'rgba(61,219,181,0.08)', border: '1px solid rgba(61,219,181,0.2)', color: '#3DDBB5' }}>
								회원 등록 시 생활 패턴 추가
							</a>
						</div>
					)}
				</div>

				<WeeklyWorkoutDetail
					memberId={id}
					registeredAt={member.registered_at}
					inbodyDates={
						(member.inbody_records ?? [])
							.map((r: any) => r.measured_at)
							.sort()
					}
					workoutLogs={member.workout_logs ?? []}
					initialWeekStartDate={member.week_start_date ?? undefined}
				/>
			</div>

		</div>
	)
}