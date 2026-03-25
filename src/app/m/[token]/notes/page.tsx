import { createClient } from '@/lib/supabase/server'
import { NoteWorkout, WORKOUT_TYPE_LABELS } from '@/types/database'
import NoteRoutineCheck from '@/components/member/NoteRoutineCheck'

function getTodayLabel(): string {
	const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
	return DAY_LABELS[new Date().getDay()]
}

export default async function NotesPage({
	params,
}: {
	params: Promise<{ token: string }>
}) {
	const { token } = await params
	const today = new Date().toISOString().split('T')[0]
	const todayLabel = getTodayLabel()

	const supabase = await createClient()

	const { data: member } = await supabase
		.from('members')
		.select('id')
		.eq('access_token', token)
		.single()

	if (!member) return null

	const { data: notes } = await supabase
		.from('notes')
		.select(`
      *,
      note_tags(tag),
      note_workouts(id, day, workout_type, intensity, duration_min, mets, sort_order, coach_memo)
    `)
		.eq('member_id', member.id)
		.eq('is_sent', true)
		.order('written_at', { ascending: false })

	const { data: completions } = await supabase
		.from('note_workout_completions')
		.select('note_workout_id')
		.eq('member_id', member.id)
		.eq('completed_date', today)

	const completedIds = new Set((completions ?? []).map(c => c.note_workout_id))

	const intensityLabel: Record<string, string> = {
		recovery: '리커버리',
		normal: '일반',
		high: '고강도',
	}
	const intensityStyle: Record<string, React.CSSProperties> = {
		recovery: { color: '#FFB347', backgroundColor: 'rgba(255,179,71,0.1)', border: '1px solid rgba(255,179,71,0.3)' },
		normal: { color: '#3DDBB5', backgroundColor: 'rgba(61,219,181,0.1)', border: '1px solid rgba(61,219,181,0.3)' },
		high: { color: '#FF6B5B', backgroundColor: 'rgba(255,107,91,0.1)', border: '1px solid rgba(255,107,91,0.3)' },
	}

	return (
		<div className="p-4 flex flex-col gap-4">
			<h2 className="text-base font-bold text-white pt-1">알림장</h2>

			{notes && notes.length > 0 ? notes.map((note, noteIdx) => {
				const noteDays: string[] = note.days ?? ['전체']
				const noteWorkouts = (note.note_workouts as (NoteWorkout & { coach_memo: string | null })[] ?? [])
					.sort((a, b) => a.sort_order - b.sort_order)

				const todayWorkouts = noteWorkouts.filter(
					w => w.day === '전체' || w.day === todayLabel
				)

				const workoutsWithCompletion = noteWorkouts.map(w => ({
					...w,
					isCompletedToday: completedIds.has(w.id),
				}))

				return (
					<div key={note.id} className="ml-card">
						<div className="flex justify-between items-center mb-3">
							<div className="flex items-center gap-2 flex-wrap">
								<span className="font-mono text-xs font-medium" style={{ color: '#3DDBB5' }}>
									{note.written_at}
								</span>
								{noteIdx === 0 && (
									<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
										style={{ background: 'rgba(61,219,181,0.1)', color: '#3DDBB5', border: '1px solid rgba(61,219,181,0.2)' }}>
										최신
									</span>
								)}
							</div>
							<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
								style={intensityStyle[note.intensity]}>
								{intensityLabel[note.intensity]}
							</span>
						</div>

						{/* 알림장 본문 */}
						<div style={{ borderLeft: '3px solid rgba(255,255,255,0.1)', paddingLeft: '0.75rem' }}>
							<p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
								{note.content}
							</p>
							<div className="text-[12px] mt-2">
								{note.recommended_mets && (
									<span className="font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
										목표 <span className="font-mono" style={{ color: 'rgba(255,255,255,1)' }}>{note.recommended_mets}</span> METs
									</span>
								)}
								<div className="day-list mt-1">
									{noteDays.map(d => {
										const dayWorkouts = noteWorkouts.filter(w => w.day === d)
										return (
											<div key={d} className="day-list-item">
												<span className="day font-medium">{d === '전체' ? '매일' : d}</span>
												{dayWorkouts.map(dw => (
													<span key={dw.id} className="dw">
														{WORKOUT_TYPE_LABELS[dw.workout_type]} {dw.duration_min}분
													</span>
												))}
											</div>
										)
									})}
								</div>
							</div>
						</div>

						{/* 태그 */}
						{note.note_tags && note.note_tags.length > 0 && (
							<div className="flex flex-wrap gap-1.5 mt-3">
								{note.note_tags.map((t: { tag: string }) => (
									<span key={t.tag} className="ml-tag text-[11px]">{t.tag}</span>
								))}
							</div>
						)}

						{/* 오늘의 루틴 체크 */}
						{todayWorkouts.length > 0 && (
							<NoteRoutineCheck
								noteId={note.id}
								memberId={member.id}
								noteWorkouts={workoutsWithCompletion}
								todayLabel={todayLabel}
							/>
						)}
					</div>
				)
			}) : (
				<div className="text-center mt-12">
					<p className="text-3xl mb-3">📋</p>
					<p className="text-white/40 text-sm">아직 전달된 알림장이 없습니다.</p>
				</div>
			)}
		</div>
	)
}
