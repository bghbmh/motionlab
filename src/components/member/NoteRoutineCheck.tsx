'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WORKOUT_TYPE_LABELS, type WorkoutType } from '@/types/database'

interface NoteWorkoutWithCompletion {
	id: string
	day: string
	workout_type: WorkoutType
	duration_min: number | null
	mets: number | null
	sort_order: number
	coach_memo: string | null
	isCompletedToday: boolean
}

interface Props {
	noteId: string
	memberId: string
	noteWorkouts: NoteWorkoutWithCompletion[]
	todayLabel: string
}

export default function NoteRoutineCheck({
	noteId,
	memberId,
	noteWorkouts,
	todayLabel,
}: Props) {
	const [completions, setCompletions] = useState<Record<string, boolean>>(
		Object.fromEntries(noteWorkouts.map(w => [w.id, w.isCompletedToday]))
	)
	const [loading, setLoading] = useState<string | null>(null)

	const todayWorkouts = noteWorkouts.filter(
		w => w.day === '전체' || w.day === todayLabel
	)

	if (todayWorkouts.length === 0) return null

	const completedCount = todayWorkouts.filter(w => completions[w.id]).length
	const allDone = completedCount === todayWorkouts.length

	async function toggleCompletion(workoutId: string) {
		setLoading(workoutId)
		const supabase = createClient()
		const today = new Date().toISOString().split('T')[0]
		const isNowCompleted = !completions[workoutId]

		if (isNowCompleted) {
			await supabase.from('note_workout_completions').insert({
				note_workout_id: workoutId,
				member_id: memberId,
				completed_date: today,
			})
		} else {
			await supabase
				.from('note_workout_completions')
				.delete()
				.eq('note_workout_id', workoutId)
				.eq('member_id', memberId)
				.eq('completed_date', today)
		}

		setCompletions(prev => ({ ...prev, [workoutId]: isNowCompleted }))
		setLoading(null)
	}

	return (
		<div
			className="rounded-xl overflow-hidden mt-3"
			style={{ border: '1px solid rgba(61,219,181,0.15)' }}
		>
			{/* 헤더 */}
			<div
				className="flex items-center justify-between px-3 py-2"
				style={{ background: 'rgba(61,219,181,0.06)' }}
			>
				<div className="flex items-center gap-2">
					<span className="text-[11px] font-bold" style={{ color: '#3DDBB5' }}>
						오늘의 루틴
					</span>
					<span
						className="text-[10px] font-mono px-1.5 py-0.5 rounded"
						style={{
							background: 'rgba(255,255,255,0.07)',
							color: 'rgba(255,255,255,0.4)',
						}}
					>
						{todayLabel}요일
					</span>
				</div>
				<span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
					<span style={{ color: allDone ? '#3DDBB5' : 'rgba(255,255,255,0.7)' }}>
						{completedCount}
					</span>
					/{todayWorkouts.length}
				</span>
			</div>

			{/* 루틴 목록 */}
			<div style={{ background: 'rgba(0,0,0,0.2)' }}>
				{todayWorkouts.map((workout, idx) => {
					const isDone = completions[workout.id]
					const isLoading = loading === workout.id

					return (
						<div
							key={workout.id}
							style={{
								borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
								background: isDone ? 'rgba(61,219,181,0.04)' : 'transparent',
							}}
						>
							{/* 체크 행 */}
							<button
								type="button"
								onClick={() => toggleCompletion(workout.id)}
								disabled={isLoading}
								className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all"
								style={{ opacity: isLoading ? 0.5 : 1 }}
							>
								{/* 체크 서클 */}
								<div
									className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
									style={{
										background: isDone ? '#3DDBB5' : 'transparent',
										border: isDone
											? '2px solid #3DDBB5'
											: '2px solid rgba(255,255,255,0.2)',
									}}
								>
									{isDone && (
										<svg width="10" height="8" viewBox="0 0 10 8" fill="none">
											<path
												d="M1 4l3 3 5-5"
												stroke="#0d1421"
												strokeWidth="1.8"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									)}
								</div>

								{/* 운동 정보 */}
								<div className="flex-1 min-w-0">
									<p
										className="text-xs font-medium"
										style={{
											color: isDone ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
											textDecoration: isDone ? 'line-through' : 'none',
										}}
									>
										{WORKOUT_TYPE_LABELS[workout.workout_type]}
										{workout.day === '전체' && (
											<span
												style={{
													marginLeft: 6,
													fontSize: 9,
													fontWeight: 600,
													padding: '1px 6px',
													borderRadius: 4,
													background: 'rgba(255,179,71,0.1)',
													color: '#FFB347',
													border: '1px solid rgba(255,179,71,0.2)',
													verticalAlign: 'middle',
													display: 'inline-block',
													textDecoration: 'none',
												}}
											>
												매일
											</span>
										)}
									</p>
									{workout.duration_min && (
										<p
											className="text-[10px] font-mono mt-0.5"
											style={{ color: 'rgba(255,255,255,0.3)' }}
										>
											{workout.duration_min}분
											{workout.mets ? ` · ${workout.mets} METs` : ''}
										</p>
									)}
								</div>

								{/* 완료 배지 */}
								{isDone && (
									<span
										className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
										style={{
											background: 'rgba(61,219,181,0.12)',
											color: '#3DDBB5',
											border: '1px solid rgba(61,219,181,0.25)',
										}}
									>
										완료
									</span>
								)}
							</button>

							{/* 항목별 코치 메모 */}
							{workout.coach_memo && (
								<p className="mx-3 mb-2.5 px-3 pb-2 text-[11px] leading-relaxed"
									style={{ color: 'rgba(255,179,71,0.8)' }}>
									💡 {workout.coach_memo}
								</p>
							)}
						</div>
					)
				})}
			</div>

			{/* 전체 완료 배너 */}
			{allDone && todayWorkouts.length > 0 && (
				<div
					className="px-3 py-2 text-center text-xs font-semibold"
					style={{
						background: 'rgba(61,219,181,0.1)',
						color: '#3DDBB5',
						borderTop: '1px solid rgba(61,219,181,0.15)',
					}}
				>
					🎉 오늘 루틴 모두 완료!
				</div>
			)}
		</div>
	)
}
