'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_METS, WORKOUT_ICONS, WORKOUT_COLORS } from '@/types/database'
import type { WorkoutType } from '@/types/database'

interface NoteWorkout {
	id: string
	day: string
	workout_type: WorkoutType
	intensity: string
	duration_min: number | null
	mets: number | null
	sort_order: number
	coach_memo?: string | null
}

interface Props {
	memberId: string
	noteWorkouts: NoteWorkout[]
	completedIds: string[]
	isToday: boolean
}

// ─── 완료 모달 ────────────────────────────────────────────────
function CompleteModal({
	workout,
	onClose,
	onSave,
}: {
	workout: NoteWorkout
	onClose: () => void
	onSave: (duration: number, memo: string, exact: boolean) => Promise<void>
}) {
	const [step, setStep] = useState<'confirm' | 'adjust' | 'success'>('confirm')
	const [duration, setDuration] = useState(String(workout.duration_min ?? 30))
	const [memo, setMemo] = useState('')
	const [saving, setSaving] = useState(false)
	const [exactDone, setExactDone] = useState(true)

	const prescribed = workout.duration_min ?? 30
	const icon = WORKOUT_ICONS[workout.workout_type]
	const label = WORKOUT_TYPE_LABELS[workout.workout_type]
	const colors = WORKOUT_COLORS[workout.workout_type]

	async function handleExact() {
		setSaving(true)
		await onSave(prescribed, '', true)
		setExactDone(true)
		setStep('success')
		setSaving(false)
	}

	async function handleAdjusted() {
		if (!duration || Number(duration) <= 0) return
		setSaving(true)
		await onSave(Number(duration), memo, false)
		setExactDone(false)
		setStep('success')
		setSaving(false)
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center"
			style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
			onClick={step !== 'success' ? onClose : undefined}
		>
			<div
				className="w-full max-w-md rounded-t-3xl"
				style={{
					background: '#141e2e',
					border: '1px solid rgba(255,255,255,0.08)',
					borderBottom: 'none',
					maxHeight: '85vh',
					overflowY: 'auto',
				}}
				onClick={e => e.stopPropagation()}
			>
				<div className="flex justify-center pt-3 pb-1">
					<div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
				</div>

				{step === 'success' && (
					<div className="px-6 pb-10 pt-4 flex flex-col items-center gap-5 text-center">
						<div className="text-5xl mt-2">🎉</div>
						<div>
							<p className="text-white font-bold text-base">수고하셨어요!</p>
							<p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
								오늘의 루틴 중 1개를<br />{exactDone ? '완벽하게 ' : ''}완료하셨습니다 💪
							</p>
						</div>
						<button onClick={onClose} className="btn-primary px-8 py-3 text-sm">확인</button>
					</div>
				)}

				{step === 'confirm' && (
					<div className="px-5 pb-8 flex flex-col gap-5 pt-2">
						<div className="flex justify-between items-center">
							<p className="font-mono text-sm font-medium" style={{ color: '#3DDBB5' }}>운동 완료 기록</p>
							<button onClick={onClose} className="btn-ghost text-xs py-1 px-2.5">✕</button>
						</div>
						<div className="rounded-2xl p-4 flex items-center gap-4"
							style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
							<div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
								style={{ background: 'rgba(0,0,0,0.2)' }}>
								{icon}
							</div>
							<div>
								<p className="font-bold text-white text-sm">{label}</p>
								<p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
									처방 시간 · {prescribed}분
								</p>
								{workout.coach_memo && (
									<p className="text-xs mt-1.5 leading-relaxed rounded-lg px-2 py-1"
										style={{ background: 'rgba(61,219,181,0.08)', border: '1px solid rgba(61,219,181,0.18)', color: 'rgba(255,255,255,0.6)' }}>
										💬 {workout.coach_memo}
									</p>
								)}
							</div>
						</div>
						<p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.55)' }}>
							처방대로 수행하셨나요?
						</p>
						<div className="flex flex-col gap-2">
							<button onClick={handleExact} disabled={saving}
								className="btn-primary py-3.5 text-sm font-bold"
								style={{ opacity: saving ? 0.5 : 1 }}>
								{saving ? '저장 중...' : `✓  ${prescribed}분 그대로 완료`}
							</button>
							<button onClick={() => setStep('adjust')} className="btn-ghost py-3 text-sm">
								시간이 달랐어요 (직접 입력)
							</button>
						</div>
					</div>
				)}

				{step === 'adjust' && (
					<div className="px-5 pb-8 flex flex-col gap-5 pt-2">
						<div className="flex justify-between items-center">
							<button onClick={() => setStep('confirm')} className="btn-ghost text-xs py-1 px-2.5">← 뒤로</button>
							<p className="font-mono text-sm font-medium" style={{ color: '#3DDBB5' }}>실제 수행 기록</p>
							<button onClick={onClose} className="btn-ghost text-xs py-1 px-2.5">✕</button>
						</div>
						<div>
							<p className="ml-card-label">실제 운동 시간 (분)</p>
							<input className="ml-input" type="number" inputMode="numeric" min={1}
								value={duration} onChange={e => setDuration(e.target.value)} />
						</div>
						<div>
							<p className="ml-card-label">컨디션 메모 (선택)</p>
							<input className="ml-input" placeholder="예: 허리가 조금 불편했어요"
								value={memo} onChange={e => setMemo(e.target.value)} />
						</div>
						<div className="flex gap-2">
							<button onClick={onClose} className="btn-ghost flex-1 py-3 text-sm">취소</button>
							<button onClick={handleAdjusted}
								disabled={saving || !duration || Number(duration) <= 0}
								className="btn-primary flex-[2] py-3 text-sm"
								style={{ opacity: (saving || !duration) ? 0.5 : 1 }}>
								{saving ? '저장 중...' : '완료 기록 저장'}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

// ─── 운동 1행 ─────────────────────────────────────────────────
function WorkoutRow({
	workout,
	isDone,
	isToday,
	onComplete,
	onUndo,
}: {
	workout: NoteWorkout
	isDone: boolean
	isToday: boolean
	onComplete: () => void
	onUndo: () => void
}) {
	const colors = WORKOUT_COLORS[workout.workout_type]
	const icon = WORKOUT_ICONS[workout.workout_type]
	const label = WORKOUT_TYPE_LABELS[workout.workout_type]

	const intensityLabel: Record<string, string> = {
		recovery: '리커버리',
		normal: '일반',
		high: '고강도',
	}
	const intensityStyle: Record<string, React.CSSProperties> = {
		recovery: { color: '#FFB347', },
		normal: { color: '#3DDBB5', },
		high: { color: '#FF6B5B', },
	}

	return (
		<div className="flex items-start gap-3">
			{/* 아이콘 */}
			<div className="w-5 h-5 rounded-md flex items-center justify-center text-base shrink-0 mt-0.5"
				style={{
					background: isDone ? 'rgba(61,219,181,0.1)' : colors.bg,
					border: `1px solid ${isDone ? 'rgba(61,219,181,0.2)' : 'transparent'}`,
					color: isDone ? 'rgba(61,219,181,1)' : '#fff',
				}}>
				{isDone ? '✓' : icon}
			</div>

			{/* 텍스트 */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 flex-wrap">
					<p
						className="text-sm font-semibold"
						style={{
							color: isDone ? 'rgba(61,219,181,0.8)' : 'white',
							textDecoration: isDone ? 'line-through' : 'none',
						}}
					>
						{label}ㅁㅁㅁ
					</p>
					<span className="text-[11px] font-semibold "
						style={intensityStyle[workout.intensity]}>
						{intensityLabel[workout.intensity]}
					</span>
					{workout.duration_min && (
						<span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
							{workout.duration_min}분
						</span>
					)}
				</div>
				{workout.coach_memo && (
					<p className="text-xs mt-1 leading-relaxed py-1.5" style={{ color: '#FFB347' }}>
						💬 {workout.coach_memo}
					</p>
				)}
			</div>

			{/* 완료/취소 버튼 (오늘만) */}
			{isToday && (
				isDone ? (
					<button
						onClick={onUndo}
						className="shrink-0 text-[11px] font-medium rounded-xl px-2.5 py-1.5 transition-all"
						style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}>
						취소
					</button>
				) : (
					<button
						onClick={onComplete}
						className="shrink-0 text-[11px] font-bold rounded-xl px-2.5 py-1.5 transition-all"
						style={{ background: 'rgba(61,219,181,0.12)', border: '1px solid rgba(61,219,181,0.35)', color: '#3DDBB5' }}>
						대기 ✓
					</button>
				)
			)}
		</div>
	)
}

// ─── 메인 ─────────────────────────────────────────────────────
export default function NotesRoutineClient({
	memberId,
	noteWorkouts,
	completedIds,
	isToday,
}: Props) {
	const [completed, setCompleted] = useState<Set<string>>(new Set(completedIds))
	const [logIdMap, setLogIdMap] = useState<Map<string, string>>(new Map())
	const [modalTarget, setModalTarget] = useState<NoteWorkout | null>(null)

	async function handleSave(workout: NoteWorkout, durationMin: number, conditionMemo: string) {
		const supabase = createClient()
		const { data } = await supabase
			.from('workout_logs')
			.insert({
				member_id: memberId,
				logged_at: new Date().toISOString().split('T')[0],
				workout_type: workout.workout_type,
				duration_min: durationMin,
				mets_score: WORKOUT_TYPE_METS[workout.workout_type],
				condition_memo: conditionMemo || null,
				source: 'routine',
				note_workout_id: workout.id,
			})
			.select('id')
			.single()

		if (data) {
			setCompleted(prev => new Set([...prev, workout.id]))
			setLogIdMap(prev => new Map([...prev, [workout.id, data.id]]))
		}
	}

	async function handleUndo(workout: NoteWorkout) {
		const logId = logIdMap.get(workout.id)
		if (!logId) return
		const supabase = createClient()
		await supabase.from('workout_logs').delete().eq('id', logId)
		setCompleted(prev => {
			const next = new Set(prev)
			next.delete(workout.id)
			return next
		})
	}

	// ★ 같은 day끼리 그룹핑, 요일 순 정렬
	const DAY_ORDER = ['전체', '월', '화', '수', '목', '금', '토', '일']
	const grouped = noteWorkouts.reduce<Record<string, NoteWorkout[]>>((acc, w) => {
		if (!acc[w.day]) acc[w.day] = []
		acc[w.day].push(w)
		return acc
	}, {})
	const sortedDays = Object.keys(grouped).sort(
		(a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
	)

	return (
		<>
			<div className="flex flex-col gap-2">
				{sortedDays.map(day => {
					const workouts = grouped[day]
					const allDone = workouts.every(w => completed.has(w.id))
					const someDone = workouts.some(w => completed.has(w.id))

					return (
						<div
							key={day}
							className="rounded-2xl overflow-hidden transition-all"
							style={{
								border: `1px solid ${allDone ? 'rgba(61,219,181,0.25)'
									: someDone ? 'rgba(61,219,181,0.12)'
										: 'rgba(255,255,255,0.07)'
									}`,
								background: allDone ? 'rgba(61,219,181,0.04)' : '#1a2740',
							}}
						>
							{/* 요일 헤더 */}
							{day !== '전체' && (
								<div
									className="flex items-center justify-between px-3 py-2"
									style={{
										background: 'rgba(255,255,255,0.02)',
										borderBottom: '1px solid rgba(255,255,255,0.05)',
									}}
								>
									<span
										className="text-[11px] font-bold px-2 py-0.5 rounded-md"
										style={{ background: 'rgba(61,219,181,0.1)', color: '#3DDBB5' }}
									>
										{day}요일
									</span>
									{allDone && isToday && (
										<span className="text-[10px] font-mono" style={{ color: 'rgba(61,219,181,0.55)' }}>
											모두 완료 ✓
										</span>
									)}
									{!allDone && isToday && (
										<span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
											{workouts.filter(w => completed.has(w.id)).length} / {workouts.length}
										</span>
									)}
								</div>
							)}

							{/* 운동 목록 */}
							<div className="flex flex-col px-3 py-3 gap-0">
								{workouts.map((workout, idx) => (
									<div key={workout.id}>
										{idx > 0 && (
											<div
												className="my-2.5"
												style={{ borderTop: '1px dashed rgba(255,255,255,0.06)' }}
											/>
										)}
										<WorkoutRow
											workout={workout}
											isDone={completed.has(workout.id)}
											isToday={isToday}
											onComplete={() => setModalTarget(workout)}
											onUndo={() => handleUndo(workout)}
										/>
									</div>
								))}
							</div>
						</div>
					)
				})}
			</div>

			{modalTarget && (
				<CompleteModal
					workout={modalTarget}
					onClose={() => setModalTarget(null)}
					onSave={async (dur, memo) => {
						await handleSave(modalTarget, dur, memo)
					}}
				/>
			)}
		</>
	)
}
