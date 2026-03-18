'use client'

import { useState } from 'react'
import { NoteWorkout, WORKOUT_TYPE_LABELS, INTENSITY_LABELS, type Intensity } from '@/types/database'
import Link from 'next/link'

interface NoteCardProps {
	note: {
		id: string
		written_at: string
		intensity: string
		content: string
		recommended_mets: number | null
		days: string[]
		note_tags: { tag: string }[]
		note_workouts: NoteWorkout[]
	}
	token: string,
	defaultExpanded?: boolean   // ★ 추가
}

const intensityStyle: Record<string, React.CSSProperties> = {
	recovery: { color: '#FFB347', backgroundColor: 'rgba(255,179,71,0.1)', border: '1px solid rgba(255,179,71,0.3)' },
	normal: { color: '#3DDBB5', backgroundColor: 'rgba(61,219,181,0.1)', border: '1px solid rgba(61,219,181,0.3)' },
	high: { color: '#FF6B5B', backgroundColor: 'rgba(255,107,91,0.1)', border: '1px solid rgba(255,107,91,0.3)' },
}

export default function MemberNoteCard({ note, token, defaultExpanded = false }: NoteCardProps) {
	const [expanded, setExpanded] = useState(defaultExpanded)
	const noteDays: string[] = note.days ?? ['전체']
	const hasWorkouts = (note.note_workouts?.length ?? 0) > 0

	return (
		<div className="ml-card flex flex-col gap-0">
			{/* ── 헤더 (항상 표시) ── */}
			<button
				type="button"
				onClick={() => setExpanded(prev => !prev)}
				className="w-full text-left flex justify-between items-center"
			>
				<div className="flex items-center gap-2 flex-wrap">
					<span className="font-mono text-xs font-medium" style={{ color: '#3DDBB5' }}>
						{note.written_at}
					</span>
					{hasWorkouts && (
						<span className="text-[10px] px-1.5 py-0.5 rounded"
							style={{ background: 'rgba(61,219,181,0.08)', color: 'rgba(61,219,181,0.6)', border: '1px solid rgba(61,219,181,0.15)' }}>
							운동처방 {note.note_workouts.length}개
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
						style={intensityStyle[note.intensity]}>
						{INTENSITY_LABELS[note.intensity as Intensity] ?? note.intensity}
					</span>
					<span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
						{expanded ? '▲' : '▽'}
					</span>
				</div>
			</button>

			{/* ── 본문 요약 (항상 표시) ── */}
			<div className="mt-3" style={{ borderLeft: '3px solid rgba(255,255,255,0.1)', paddingLeft: '0.75rem' }}>
				<p className="text-sm leading-relaxed"
					style={{
						color: 'rgba(255,255,255,0.72)',
						// 접힌 상태에서 2줄 제한
						display: '-webkit-box',
						WebkitLineClamp: expanded ? undefined : 2,
						WebkitBoxOrient: 'vertical',
						overflow: expanded ? 'visible' : 'hidden',
					}}>
					{note.content}
				</p>
			</div>

			{/* ── 펼친 상태에서만 표시 ── */}
			{expanded && (
				<div className="mt-3 flex flex-col gap-3">

					{/* METs 목표 */}
					{note.recommended_mets && (
						<p className="text-[12px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
							목표{' '}
							<span className="font-mono" style={{ color: 'rgba(255,255,255,1)' }}>
								{note.recommended_mets}
							</span>{' '}
							METs
						</p>
					)}

					{/* 요일별 운동처방 */}
					{hasWorkouts && (
						<div className="flex flex-col gap-2">
							{noteDays.map(d => {
								const dayWorkouts = (note.note_workouts as NoteWorkout[])
									.filter(w => w.day === d)
									.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
								if (dayWorkouts.length === 0) return null
								return (
									<div key={d}
										className="rounded-xl px-3 py-2.5"
										style={{ background: 'rgba(61,219,181,0.04)', border: '1px solid rgba(61,219,181,0.1)' }}>
										<p className="text-[10px] font-bold mb-1.5" style={{ color: 'rgba(61,219,181,0.6)' }}>
											{d === '전체' ? '매일' : `${d}요일`}
										</p>
										<div className="flex flex-col gap-1.5">
											{dayWorkouts.map(w => (
												<div key={w.id} className="flex items-center justify-between">
													<div className="flex items-center gap-1.5">
														<span className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
															style={{
																background: w.intensity === 'high' ? 'rgba(255,107,91,0.1)' :
																	w.intensity === 'recovery' ? 'rgba(255,179,71,0.1)' : 'rgba(61,219,181,0.1)',
																color: w.intensity === 'high' ? '#FF6B5B' :
																	w.intensity === 'recovery' ? '#FFB347' : '#3DDBB5',
															}}>
															{INTENSITY_LABELS[w.intensity]}
														</span>
														<span className="text-sm text-white">
															{WORKOUT_TYPE_LABELS[w.workout_type]}
														</span>
													</div>
													<span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
														{w.duration_min}분 · {w.mets != null ? `${w.mets} METs` : '—'}
													</span>
												</div>
											))}
										</div>
									</div>
								)
							})}
						</div>
					)}

					{/* 태그 */}
					{note.note_tags?.length > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{note.note_tags.map(t => (
								<span key={t.tag} className="ml-tag-default py-0.5 px-2 text-[10px]">
									{t.tag}
								</span>
							))}
						</div>
					)}

					{/* 바로가기 버튼 */}
					<div className="flex gap-2 pt-1">
						<Link href={`/m/${token}`}
							className="flex-1 py-2 text-xs font-semibold rounded-xl text-center transition-all"
							style={{ background: 'rgba(61,219,181,0.08)', border: '1px solid rgba(61,219,181,0.2)', color: '#3DDBB5' }}>
							오늘 루틴 체크 →
						</Link>
						<Link href={`/m/${token}/videos`}
							className="flex-1 py-2 text-xs font-semibold rounded-xl text-center transition-all"
							style={{ background: '#1a2740', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
							추천 영상 →
						</Link>
					</div>
				</div>
			)}
		</div>
	)
}