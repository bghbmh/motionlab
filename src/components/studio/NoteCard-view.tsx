import type { Note, NoteVideo } from '@/types/database'
import { INTENSITY_LABELS, WORKOUT_TYPE_LABELS } from '@/types/database'

const INTENSITY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
	recovery: { color: '#FFB347', bg: 'rgba(255,179,71,0.1)', border: 'rgba(255,179,71,0.3)' },
	normal: { color: '#3DDBB5', bg: 'rgba(61,219,181,0.1)', border: 'rgba(61,219,181,0.3)' },
	high: { color: '#FF6B5B', bg: 'rgba(255,107,91,0.1)', border: 'rgba(255,107,91,0.3)' },
}

export type NoteWithVideos = Omit<Note, 'note_videos'> & {
	note_videos: NoteVideo[]
}

interface Props {
	note: NoteWithVideos
}

export default function NoteCardView({ note }: Props) {
	const st = INTENSITY_STYLE[note.intensity]

	//console.log("NoteCardView - ", note)

	return (
		<div
			className="ml-card flex flex-col gap-3"
			style={note.is_sent ? { borderColor: 'rgba(61,219,181,0.22)' } : {}}
		>
			{/* 상단: 날짜 / 배지 / 액션 버튼 */}
			<div className="flex justify-between items-start gap-2">
				<div className="flex items-center gap-2 flex-wrap min-w-0">
					<span className="font-mono text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }}>
						{note.written_at}
					</span>

					{/* 전송됨 배지 */}
					{note.is_sent && (
						<>
							{'·'}
							<span className="text-[11px] font-semibold"
								style={{ color: '#3DDBB5' }}> ✓ 전송됨</span>
						</>
					)}


					{
						(note.note_videos && note.note_videos.length > 0) && (
							<>
								{'·'}<span className="text-[11px] " style={{ color: 'rgba(255, 107, 91, 0.7)' }}>🎬 {note.note_videos.length}</span>
							</>
						)
					}

				</div>

				{/* 액션 버튼
				<div className="flex gap-1.5 shrink-0">
					<button onClick={onEdit} className="rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all"
						style={{ background: 'rgba(61,219,181,0.08)', border: '1px solid rgba(61,219,181,0.2)', color: 'rgba(61,219,181,0.75)' }}>
						수정
					</button>
					<button onClick={onDelete} className="rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all"
						style={{ background: 'rgba(255,107,91,0.08)', border: '1px solid rgba(255,107,91,0.2)', color: 'rgba(255,107,91,0.75)' }}>
						삭제
					</button>
					{note.is_sent ? (
						<button onClick={onUnsend} className="rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all"
							style={{ background: 'rgba(255,179,71,0.08)', border: '1px solid rgba(255,179,71,0.25)', color: 'rgba(255,179,71,0.75)' }}>
							전송 취소
						</button>
					) : (
						<button onClick={onSend} className="rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all"
							style={{ background: 'rgba(61,219,181,0.15)', border: '1px solid rgba(61,219,181,0.45)', color: '#3DDBB5' }}>
							전송
						</button>
					)}
				</div> */}
			</div>

			{/* 내용 */}
			<div style={{ borderLeft: '3px solid rgba(255,255,255,0.1)', paddingLeft: '0.75rem' }}>
				<p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
					{note.content}
				</p>
				<div className="text-[12px] mt-2">
					{note.recommended_mets && (
						<span className=" font-mono "
							style={{ color: 'rgba(255,255,255,0.5)' }}>
							목표 <span className=" font-mono" style={{ color: 'rgba(255,255,255,1)' }}>{note.recommended_mets}</span> METs
						</span>
					)}
					{/* 요일 배지 */}
					<div className="day-list mt-1">
						{note.days.map(d => {
							//const dayWorkouts = (note.note_workouts ?? []).filter(w => w.day === d);
							const dayWorkouts = note.note_workouts?.filter(w => w.day === d);
							return (
								<div key={d} className="day-list-item  " >
									<span key={d} className="day  font-medium">{d === '전체' ? '매일' : d}</span>
									{dayWorkouts?.map(dw => (
										<span key={dw.id} className='dw'>
											{WORKOUT_TYPE_LABELS[dw.workout_type]} {dw.duration_min}분
										</span>
									))}
								</div>
							)
						})}
					</div>

					{/* <div className="flex flex-col gap-1 mt-2">
						{note.days.map(d => {
							// 해당 요일의 운동들만 필터링
							const dayWorkouts = (note.note_workouts ?? []).filter(w => w.day === d);

							return (
								<div key={d} className="flex items-center gap-2">
									<span className="text-[11px] font-bold text-white/50 w-8">{d}</span>
									<div className="flex flex-wrap gap-1">
										{dayWorkouts.map(w => (
											<span key={w.id} className="text-[11px] bg-white/5 px-1.5 py-0.5 rounded">
												{WORKOUT_TYPE_LABELS[w.workout_type]} {w.duration_min}분
											</span>
										))}
									</div>
								</div>
							);
						})}
					</div> */}
					{/* {note.recommended_workout_type && (
						<span className="font-medium"
							style={{ color: 'rgba(255,255,255,0.6)' }}>
							{WORKOUT_TYPE_LABELS[note.recommended_workout_type]}
						</span>
					)}
					{note.recommended_duration_min && (
						<span className=" font-mono"
							style={{ color: 'rgba(255,255,255,0.5)' }}>
							{note.recommended_duration_min}분 추천
						</span>
					)} */}

				</div>
			</div>

			{/* 태그 */}
			{
				note.note_tags && note.note_tags.length > 0 && (
					<div className="flex flex-wrap gap-3">
						{/* 강도 배지 */}
						<span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center flex-none"
							style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
							{INTENSITY_LABELS[note.intensity]}
						</span>
						<div className='flex gap-1 flex-wrap flex-grow'>
							{note.note_tags.map(t => (
								<span key={t.tag} className="ml-tag-default py-0.5 px-2 text-[10px]">{t.tag}</span>
							))}
						</div>

					</div>
				)
			}
		</div >
	)
}
