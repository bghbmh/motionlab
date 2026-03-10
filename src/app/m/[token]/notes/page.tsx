import { createClient } from '@/lib/supabase/server'
import { WORKOUT_TYPE_LABELS, WorkoutType } from '@/types/database'

export default async function NotesPage({
	params,
}: {
	params: Promise<{ token: string }>
}) {
	const { token } = await params

	const supabase = await createClient()

	const { data: member } = await supabase
		.from('members')
		.select('id')
		.eq('access_token', token)
		.single()

	if (!member) return null

	// is_sent = true 인 알림장만 회원에게 표시
	const { data: notes } = await supabase
		.from('notes')
		.select('*, note_tags(tag)')
		.eq('member_id', member.id)
		.eq('is_sent', true)
		.order('written_at', { ascending: false })

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

			{notes && notes.length > 0 ? notes.map(note => {
				const noteDays: string[] = note.days ?? ['전체']

				return (
					<div key={note.id} className="ml-card">
						<div className="flex justify-between items-center mb-3">
							<div className="flex items-center gap-2 flex-wrap">
								<span className="font-mono text-xs font-medium" style={{ color: '#3DDBB5' }}>
									{note.written_at}
								</span>

							</div>
							<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
								style={intensityStyle[note.intensity]}>
								{intensityLabel[note.intensity]}
							</span>
						</div>

						<div style={{ borderLeft: '3px solid #3DDBB5', paddingLeft: '0.75rem' }}>
							<p className="text-sm text-white leading-relaxed">{note.content}</p>
							<div className="flex gap-2 text-[12px] mt-2">

								<span className=" font-mono"
									style={{ color: 'rgba(255,255,255,0.7)' }}>
									목표 {note.recommended_mets ? `(${note.recommended_mets})` : '-'} METs
								</span>

								{'·'}
								{/* 요일 배지 */}
								<div className="day-list ">
									{noteDays.map(d => (
										<span
											key={d}
											className="day-list-item font-medium">
											{d === '전체' ? '매일' : d}
										</span>

									))}
								</div>
								{note.recommended_workout_type && (
									<span className="font-medium"
										style={{ color: 'rgba(255,255,255,0.7)' }}>
										{WORKOUT_TYPE_LABELS[note.recommended_workout_type as WorkoutType]}
									</span>
								)}
								{note.recommended_duration_min && (
									<span className=" font-mono"
										style={{ color: 'rgba(255,255,255,0.7)' }}>
										{note.recommended_duration_min}분 추천
									</span>
								)}

							</div>
						</div>

						{note.note_tags && note.note_tags.length > 0 && (
							<div className="flex flex-wrap gap-1.5 mt-3">
								{note.note_tags.map((t: { tag: string }) => (
									<span key={t.tag} className="ml-tag text-[11px]">{t.tag}</span>
								))}
							</div>
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
