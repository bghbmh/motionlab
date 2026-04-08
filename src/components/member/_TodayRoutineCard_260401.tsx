'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_METS, WORKOUT_ICONS, WORKOUT_COLORS } from '@/types/database'
import type { WorkoutType } from '@/types/database'

import DailyActivityModal, { type DailyActivityOption } from './DailyActivityModal'

// ─── 타입 ──────────────────────────────────────────────────────
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

interface CompletedLog {
	note_workout_id: string
	duration_min: number
	mets_score: number
}

// 일상활동 항목 타입
interface DailyActivity {
	id: string           // 임시 로컬 ID
	label: string        // 예: 계단 오르기
	mets: number         // METs/h
	duration: string     // 사용자 입력 시간(분)
	included: boolean    // 포함 여부
}

interface PatternItem {
	activity_type: string
	activity_label: string
	mets_value: number
	duration_min_per_day: number
	paper_code?: string | null
}

interface Props {
	memberId: string
	token: string
	noteWorkouts: NoteWorkout[]
	completedLogs: CompletedLog[]
	patterns: PatternItem[]     // 강사 입력 생활 패턴 
	today: string
}

type DailyStatus = 'included' | 'skipped' | null

interface DailyItem {
	activity_type: string
	activity_label: string
	mets_value: number
	defaultDuration: number
	actualDuration: number
	status: DailyStatus
	source: 'pattern' | 'modal'
}

// ─── 완료 모달 ─────────────────────────────────────────────────
function RoutineCompleteModal({
	workout,
	onClose,
	onDone,
}: {
	workout: NoteWorkout
	onClose: () => void
	onDone: (durationMin: number, conditionMemo: string, exact: boolean) => Promise<void>
}) {
	const [step, setStep] = useState<'confirm' | 'adjust' | 'success'>('confirm')
	const [duration, setDuration] = useState(String(workout.duration_min ?? 30))
	const [memo, setMemo] = useState('')
	const [saving, setSaving] = useState(false)
	const [successExact, setSuccessExact] = useState(true)

	const prescribedMin = workout.duration_min ?? 30
	const icon = WORKOUT_ICONS[workout.workout_type]
	const label = WORKOUT_TYPE_LABELS[workout.workout_type]
	const colors = WORKOUT_COLORS[workout.workout_type]

	async function handleExact() {
		setSaving(true)
		await onDone(prescribedMin, '', true)
		setSuccessExact(true)
		setStep('success')
		setSaving(false)
	}

	async function handleAdjust() {
		if (!duration || Number(duration) <= 0) return
		setSaving(true)
		await onDone(Number(duration), memo, false)
		setSuccessExact(false)
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
				className="w-full max-w-md rounded-t-3xl flex flex-col"
				style={{
					background: '#141e2e',
					border: '1px solid rgba(255,255,255,0.08)',
					borderBottom: 'none',
					maxHeight: '90vh',
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
								오늘의 운동 중 1개를<br />
								{successExact ? '완벽하게 ' : ''}완료하셨습니다 💪
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
						<div
							className="rounded-2xl p-4 flex items-center gap-4"
							style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
						>
							<div
								className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
								style={{ background: 'rgba(0,0,0,0.2)' }}
							>
								{icon}
							</div>
							<div>
								<p className="font-bold text-white text-sm">{label}</p>
								<p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
									처방 시간 · {prescribedMin}분
								</p>
								{workout.coach_memo && (
									<p
										className="text-xs mt-1.5 leading-relaxed rounded-lg px-2 py-1"
										style={{
											background: 'rgba(61,219,181,0.08)',
											border: '1px solid rgba(61,219,181,0.18)',
											color: 'rgba(255,255,255,0.6)',
										}}
									>
										💬 {workout.coach_memo}
									</p>
								)}
							</div>
						</div>
						<p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.55)' }}>
							처방대로 수행하셨나요?
						</p>
						<div className="flex flex-col gap-2">
							<button
								onClick={handleExact}
								disabled={saving}
								className="btn-primary py-3.5 text-sm font-bold"
								style={{ opacity: saving ? 0.5 : 1 }}
							>
								{saving ? '저장 중...' : `✓  ${prescribedMin}분 그대로 완료`}
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
							<input
								className="ml-input"
								type="number"
								min={1}
								placeholder={String(prescribedMin)}
								value={duration}
								onChange={e => setDuration(e.target.value)}
							/>
						</div>
						<div>
							<p className="ml-card-label">컨디션 메모 (선택)</p>
							<input
								className="ml-input"
								placeholder="예: 허리가 조금 불편했어요"
								value={memo}
								onChange={e => setMemo(e.target.value)}
							/>
						</div>
						<div className="flex gap-2">
							<button onClick={onClose} className="btn-ghost flex-1 py-3 text-sm">취소</button>
							<button
								onClick={handleAdjust}
								disabled={saving || !duration || Number(duration) <= 0}
								className="btn-primary flex-[2] py-3 text-sm"
								style={{ opacity: (saving || !duration) ? 0.5 : 1 }}
							>
								{saving ? '저장 중...' : '완료 기록 저장'}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

// ─── 루틴 행 (단일 운동) ──────────────────────────────────────
function RoutineWorkoutRow({
	workout,
	isCompleted,
	onDidIt,
	onUndoIt,
}: {
	workout: NoteWorkout
	isCompleted: boolean
	onDidIt: (workout: NoteWorkout) => void
	onUndoIt: (workout: NoteWorkout) => void
}) {
	const icon = WORKOUT_ICONS[workout.workout_type]
	const label = WORKOUT_TYPE_LABELS[workout.workout_type]
	const colors = WORKOUT_COLORS[workout.workout_type]

	return (
		<div className="flex items-start gap-3" >
			{/* 아이콘 */}
			<div
				className="w-5 h-5 rounded-md flex items-center justify-center text-base shrink-0 mt-0.5 "
				style={{
					background: isCompleted ? 'rgba(61,219,181,0.1)' : colors.bg,
					border: `1px solid ${isCompleted ? 'rgba(61,219,181,0.2)' : colors.border}`,
					color: isCompleted ? 'rgba(61,219,181,1)' : "#fff"
				}}
			>
				{isCompleted ? '✓' : icon}
			</div>

			{/* 텍스트 */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 flex-wrap">
					<p
						className="text-sm font-semibold"
						style={{
							color: isCompleted ? 'rgba(61,219,181,0.8)' : 'white',
							textDecoration: isCompleted ? 'line-through' : 'none',
						}}
					>
						{label}
					</p>
					{workout.duration_min && (
						<span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
							{workout.duration_min}분
						</span>
					)}
				</div>
				{workout.coach_memo && (
					<p className="text-xs mt-1 leading-relaxed rounded-lg py-1.5 text-amber" >
						💬 {workout.coach_memo}
					</p>
				)}
			</div>

			{/* 완료/취소 버튼 */}
			{isCompleted ? (
				<button
					onClick={() => onUndoIt(workout)}
					className="shrink-0 text-[11px] font-medium rounded-xl px-2.5 py-1.5 transition-all"
					style={{
						background: 'rgba(255,255,255,0.05)',
						border: '1px solid rgba(255,255,255,0.08)',
						color: 'rgba(255,255,255,0.8)',
					}}
				>
					취소
				</button>
			) : (
				<button
					onClick={() => onDidIt(workout)}
					className="shrink-0 text-[11px] font-bold rounded-xl px-2.5 py-1.5 transition-all"
					style={{
						background: 'rgba(61,219,181,0.12)',
						border: '1px solid rgba(61,219,181,0.35)',
						color: '#3DDBB5',
					}}
				>
					대기 ✓
				</button>
			)}
		</div>
	)
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────
export default function TodayRoutineCard({
	memberId,
	token,
	noteWorkouts,
	completedLogs,
	patterns,
	today
}: Props) {
	const router = useRouter()

	// ── 루틴 상태 ──
	const [modalTarget, setModalTarget] = useState<NoteWorkout | null>(null)
	const [localCompleted, setLocalCompleted] = useState<Set<string>>(
		new Set(completedLogs.map(l => l.note_workout_id))
	)
	const [logIdMap, setLogIdMap] = useState<Map<string, string>>(new Map())

	// ── 일상활동 상태 ──
	const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([])
	const [showDailyPicker, setShowDailyPicker] = useState(false)
	const [customActivity, setCustomActivity] = useState({ label: '', mets: '', duration: '' })
	const [savingDaily, setSavingDaily] = useState(false)


	// 일상활동 상태 — 패턴 목록으로 초기화
	const [dailyItems, setDailyItems] = useState<DailyItem[]>(
		patterns
			.filter(p => p.duration_min_per_day > 0)
			.map(p => ({
				activity_type: p.activity_type,
				activity_label: p.activity_label,
				mets_value: p.mets_value,
				defaultDuration: p.duration_min_per_day,
				actualDuration: p.duration_min_per_day,
				status: null,
				source: 'pattern',
			}))
	)
	const [showModal, setShowModal] = useState(false)
	const [loading, setLoading] = useState(false)
	const [saved, setSaved] = useState(false);
	const storageKey = `routine_saved_${memberId}_${today}`; // ★ 로컬 스토리지 기반 저장 여부 확인

	// 루틴 완료 저장
	const handleRoutineDone = useCallback(
		async (durationMin: number, conditionMemo: string, _exact: boolean) => {
			if (!modalTarget) return
			const supabase = createClient()
			const { data: inserted } = await supabase
				.from('workout_logs')
				.insert({
					member_id: memberId,
					logged_at: new Date().toISOString().split('T')[0],
					workout_type: modalTarget.workout_type,
					duration_min: durationMin,
					mets_score: WORKOUT_TYPE_METS[modalTarget.workout_type],
					condition_memo: conditionMemo || null,
					source: 'routine',
					note_workout_id: modalTarget.id,
				})
				.select('id')
				.single()

			if (inserted) {
				setLocalCompleted(prev => new Set([...prev, modalTarget.id]))
				setLogIdMap(prev => new Map([...prev, [modalTarget.id, inserted.id]]))
				router.refresh()
			}
		},
		[modalTarget, memberId, router]
	)

	// 루틴 완료 취소
	async function handleRoutineUndo(workout: NoteWorkout) {
		const logId = logIdMap.get(workout.id)
		if (!logId) return
		const supabase = createClient()
		await supabase.from('workout_logs').delete().eq('id', logId)
		setLocalCompleted(prev => {
			const next = new Set(prev)
			next.delete(workout.id)
			return next
		})
		setLogIdMap(prev => {
			const next = new Map(prev)
			next.delete(workout.id)
			return next
		})
		router.refresh()
	}

	// 일상활동 추가
	function addDailyActivity(label: string, mets: number, icon: string) {
		if (dailyActivities.some(a => a.label === label)) return
		setDailyActivities(prev => [...prev, {
			id: Math.random().toString(36).slice(2),
			label,
			mets,
			duration: '30',
			included: true,
		}])
		setShowDailyPicker(false)
	}

	function addCustomActivity() {
		const label = customActivity.label.trim()
		const mets = Number(customActivity.mets)
		const duration = customActivity.duration
		if (!label || !mets || !duration) return
		setDailyActivities(prev => [...prev, {
			id: Math.random().toString(36).slice(2),
			label,
			mets,
			duration,
			included: true,
		}])
		setCustomActivity({ label: '', mets: '', duration: '' })
		setShowDailyPicker(false)
	}

	function toggleActivity(id: string) {
		setDailyActivities(prev =>
			prev.map(a => a.id === id ? { ...a, included: !a.included } : a)
		)
	}

	function removeActivity(id: string) {
		setDailyActivities(prev => prev.filter(a => a.id !== id))
	}

	// 일상활동 일괄 저장
	async function saveAllDailyActivities() {
		const toSave = dailyActivities.filter(a => a.included && Number(a.duration) > 0)
		if (toSave.length === 0) return

		setSavingDaily(true)
		const supabase = createClient()
		const createdToday = new Date().toISOString().split('T')[0]

		await supabase.from('workout_logs').insert(
			toSave.map(a => ({
				member_id: memberId,
				logged_at: createdToday,
				workout_type: 'other',
				duration_min: Number(a.duration),
				mets_score: a.mets,
				condition_memo: a.label,
				source: 'daily',
			}))
		)

		setDailyActivities([])
		setSavingDaily(false)
		router.refresh()
	}

	// 모달에서 추가된 활동 처리
	function handleModalAdd(opt: DailyActivityOption, durationMin: number) {
		setDailyItems(prev => [...prev, {
			activity_type: opt.activity_type,
			activity_label: opt.activity_label,
			mets_value: opt.mets_value,
			defaultDuration: durationMin,
			actualDuration: durationMin,
			status: 'included',  // 모달에서 추가하면 바로 포함
			source: 'modal',
		}])
	}

	//if (noteWorkouts.length === 0) return null

	// 루틴 그룹핑
	const DAY_ORDER = ['전체', '월', '화', '수', '목', '금', '토', '일']
	const grouped = noteWorkouts.reduce<Record<string, NoteWorkout[]>>((acc, w) => {
		if (!acc[w.day]) acc[w.day] = []
		acc[w.day].push(w)
		return acc
	}, {})
	const sortedDays = Object.keys(grouped).sort(
		(a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
	)

	const completedCount = noteWorkouts.filter(w => localCompleted.has(w.id)).length
	const totalCount = noteWorkouts.length

	const includedDailyMets = dailyActivities
		.filter(a => a.included && Number(a.duration) > 0)
		.reduce((s, a) => s + a.mets * Number(a.duration), 0)


	const tempToday = new Date();
	// 2. 요일을 나타내는 배열 생성 (0: 일요일, 6: 토요일)
	const tempWeek = ['일', '월', '화', '수', '목', '금', '토'];

	// 3. getDay()로 숫자 요일을 가져와서 배열에서 이름 찾기
	const dayName = tempWeek[tempToday.getDay()];
	console.log("???? ==== ", dayName, sortedDays, dailyItems)

	return (
		<>
			<div className="ml-card flex flex-col gap-2">

				{/* ── 헤더 ── */}
				<div className="flex justify-between items-center">
					<p className="ml-card-label m-0">오늘의 운동</p>

					<div
						className="transition-all" >
						<div className='text-[11px] flex gap-2'>
							<span
								className="font-bold "
								style={{ color: '#3DDBB5' }}
							>
								{dayName}요일
							</span>
							알림장
							{totalCount === 0 && (<span className="pl-1 " >없음</span>)}

							{sortedDays.map(day => {
								const workouts = grouped[day]
								const allDone = workouts.every(w => localCompleted.has(w.id))
								const doneCnt = workouts.filter(w => localCompleted.has(w.id)).length

								return (
									<span
										key={day} className="pl-1 font-mono" style={{ color: allDone ? 'rgba(61,219,181,1)' : 'rgba(255,255,255,1)' }}>
										{allDone ? '모두 완료 ✓' : `${doneCnt} / ${workouts.length}`}
									</span>)
							})}
						</div>
					</div>

				</div>

				{/* ── 처방 루틴 목록 (요일 그룹) ── */}
				<div className="flex flex-col gap-2">
					{totalCount === 0 && (
						<div className="text-xs mb-2 text-center rounded-lg py-5" style={{ color: "rgba(255, 255, 255, 0.7)", background: "rgba(255, 255, 255, 0.04)" }}>알림장이 없습니다</div>
					)}
					{sortedDays.map(day => {
						const workouts = grouped[day]
						const allDone = workouts.every(w => localCompleted.has(w.id))
						const doneCnt = workouts.filter(w => localCompleted.has(w.id)).length

						return (
							<div
								key={day}
								className="rounded-2xl overflow-hidden  mb-2 transition-all"
								style={{
									border: `1px solid ${allDone ? 'rgba(61,219,181,0.25)'
										: doneCnt > 0 ? 'rgba(61,219,181,0.12)'
											: 'rgba(255,255,255,0.06)'
										}`,
									background: allDone ? 'rgba(61,219,181,0.04)' : '#1a2740',
								}}
							>

								{/* 운동 목록 */}
								<div className="flex flex-col px-3 py-3 gap-0">
									{workouts.map((w, idx) => (
										<div key={w.id}>
											{idx > 0 && (
												<div
													className="my-2.5"
													style={{ borderTop: '1px dashed rgba(255,255,255,0.06)' }}
												/>
											)}
											<RoutineWorkoutRow
												workout={w}
												isCompleted={localCompleted.has(w.id)}
												onDidIt={setModalTarget}
												onUndoIt={handleRoutineUndo}
											/>
										</div>
									))}
								</div>
							</div>
						)
					})}
				</div>

				{/* 모두 완료 메시지 */}
				{completedCount === totalCount && totalCount > 0 && (
					<div
						className="rounded-xl py-3 text-center text-sm font-semibold"
						style={{
							background: 'rgba(61,219,181,0.08)',
							border: '1px solid rgba(61,219,181,0.2)',
							color: '#3DDBB5',
						}}
					>
						🎉 오늘 루틴을 모두 완료했어요!
					</div>
				)}


				<p className="ml-card-label m-0">오늘의 활동</p>
				<div className="flex flex-col gap-2">
					{dailyItems.length === 0 && (
						<p className="text-xs text-center rounded-lg py-5" style={{ color: "rgba(255, 255, 255, 0.7)", background: "rgba(255, 255, 255, 0.04)" }}>
							오늘 기록한 활동이 없습니다
						</p>
					)}

					{dailyItems.map(item => (
						<div key={item.activity_type}
							className="rounded-xl px-3 py-2.5"
							style={{
								background: item.status === 'included' ? 'rgba(61,219,181,0.06)'
									: item.status === 'skipped' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
								border: `1px solid ${item.status === 'included' ? 'rgba(61,219,181,0.2)'
									: item.status === 'skipped' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.07)'}`,
								opacity: item.status === 'skipped' ? 0.5 : 1,
							}}>

							<div className="flex items-center justify-between gap-2">
								<div className="flex-1 min-w-0">
									<p className="text-sm text-white"
										style={{ textDecoration: item.status === 'skipped' ? 'line-through' : 'none' }}>
										{item.activity_label}
									</p>
									{/* 포함 시 시간 수정 가능 */}
									{item.status === 'included' ? (
										<div className="flex items-center gap-1.5 mt-1">
											<input
												type="number" min={1}
												className="font-mono text-[11px] text-center rounded-lg py-0.5"
												style={{
													width: 48, background: 'rgba(255,255,255,0.07)',
													border: '1px solid rgba(255,255,255,0.12)', color: 'white',
												}}
												value={item.actualDuration}
												onChange={e => setDailyItems(prev =>
													prev.map(d => d.activity_type === item.activity_type
														? { ...d, actualDuration: Number(e.target.value) }
														: d
													)
												)}
											/>
											<span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
												분 · {Math.round(item.mets_value * item.actualDuration)} METs
											</span>
										</div>
									) : (
										<p className="text-[10px] font-mono mt-0.5"
											style={{ color: 'rgba(255,255,255,0.3)' }}>
											{item.defaultDuration}분 · {item.mets_value} METs/h
										</p>
									)}
								</div>

								{/* 포함 / 건너뜀 버튼 */}
								<div className="flex gap-1 shrink-0">
									{(['included', 'skipped'] as DailyStatus[]).map(s => (
										<button
											key={s}
											type="button"
											onClick={() => setDailyItems(prev =>
												prev.map(d => d.activity_type === item.activity_type
													? { ...d, status: d.status === s ? null : s }
													: d
												)
											)}
											className="text-[11px] font-semibold px-2 py-1 rounded-lg transition-all"
											style={{
												background: item.status === s
													? s === 'included' ? 'rgba(61,219,181,0.2)' : 'rgba(255,255,255,0.1)'
													: 'transparent',
												border: `1px solid ${item.status === s
													? s === 'included' ? 'rgba(61,219,181,0.4)' : 'rgba(255,255,255,0.2)'
													: 'rgba(255,255,255,0.08)'}`,
												color: item.status === s
													? s === 'included' ? '#3DDBB5' : 'rgba(255,255,255,0.6)'
													: 'rgba(255,255,255,0.8)',
											}}
										>
											{s === 'included' ? '포함' : '건너뜀'}
										</button>
									))}
								</div>
							</div>
						</div>
					))}

					{/* 다른 활동 추가 버튼 */}
					<button
						type="button"
						onClick={() => setShowModal(true)}
						className="w-full py-2.5 text-[12px] font-semibold rounded-xl transition-all mb-2"
						style={{
							background: 'transparent',
							border: '1px dashed rgba(255,255,255,0.4)',
							color: 'rgba(255,255,255,0.6)',
						}}
					>
						+ 다른 활동 추가
					</button>
				</div>

				<p className="ml-card-label m-0">일상생활활동</p>
				<div className="flex flex-col gap-2">
					{dailyItems.length === 0 && (
						<p className="text-xs   text-center rounded-lg py-5" style={{ color: "rgba(255, 255, 255, 0.7)", background: "rgba(255, 255, 255, 0.04)" }}>
							일상생활활동이 설정되지 않았습니다.
						</p>
					)}

					{dailyItems.map(item => (
						<div key={item.activity_type}
							className="rounded-xl px-3 py-2.5"
							style={{
								background: item.status === 'included' ? 'rgba(61,219,181,0.06)'
									: item.status === 'skipped' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
								border: `1px solid ${item.status === 'included' ? 'rgba(61,219,181,0.2)'
									: item.status === 'skipped' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.07)'}`,
								opacity: item.status === 'skipped' ? 0.5 : 1,
							}}>

							<div className="flex items-center justify-between gap-2">
								<div className="flex-1 min-w-0">
									<p className="text-sm text-white"
										style={{ textDecoration: item.status === 'skipped' ? 'line-through' : 'none' }}>
										{item.activity_label}
									</p>
									{/* 포함 시 시간 수정 가능 */}
									{item.status === 'included' ? (
										<div className="flex items-center gap-1.5 mt-1">
											<input
												type="number" min={1}
												className="font-mono text-[11px] text-center rounded-lg py-0.5"
												style={{
													width: 48, background: 'rgba(255,255,255,0.07)',
													border: '1px solid rgba(255,255,255,0.12)', color: 'white',
												}}
												value={item.actualDuration}
												onChange={e => setDailyItems(prev =>
													prev.map(d => d.activity_type === item.activity_type
														? { ...d, actualDuration: Number(e.target.value) }
														: d
													)
												)}
											/>
											<span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
												분 · {Math.round(item.mets_value * item.actualDuration)} METs
											</span>
										</div>
									) : (
										<p className="text-[10px] font-mono mt-0.5"
											style={{ color: 'rgba(255,255,255,0.3)' }}>
											{item.defaultDuration}분 · {item.mets_value} METs/h
										</p>
									)}
								</div>

								{/* 포함 / 건너뜀 버튼 */}
								<div className="flex gap-1 shrink-0">
									{(['included', 'skipped'] as DailyStatus[]).map(s => (
										<button
											key={s}
											type="button"
											onClick={() => setDailyItems(prev =>
												prev.map(d => d.activity_type === item.activity_type
													? { ...d, status: d.status === s ? null : s }
													: d
												)
											)}
											className="text-[11px] font-semibold px-2 py-1 rounded-lg transition-all"
											style={{
												background: item.status === s
													? s === 'included' ? 'rgba(61,219,181,0.2)' : 'rgba(255,255,255,0.1)'
													: 'transparent',
												border: `1px solid ${item.status === s
													? s === 'included' ? 'rgba(61,219,181,0.4)' : 'rgba(255,255,255,0.2)'
													: 'rgba(255,255,255,0.08)'}`,
												color: item.status === s
													? s === 'included' ? '#3DDBB5' : 'rgba(255,255,255,0.6)'
													: 'rgba(255,255,255,0.8)',
											}}
										>
											{s === 'included' ? '포함' : '건너뜀'}
										</button>
									))}
								</div>
							</div>
						</div>
					))}

					{/* 생활 패턴 추가 버튼 */}
					<button
						type="button"
						onClick={() => setShowModal(true)}
						className="w-full py-2.5 text-[12px] font-semibold rounded-xl transition-all "
						style={{
							background: 'transparent',
							border: '1px dashed rgba(255,255,255,0.4)',
							color: 'rgba(255,255,255,0.6)',
						}}
					>
						+ 일상생활 등록
					</button>
				</div>

			</div>

			{modalTarget && (
				<RoutineCompleteModal
					workout={modalTarget}
					onClose={() => setModalTarget(null)}
					onDone={handleRoutineDone}
				/>
			)}

			{/* 모달 */}
			{showModal && (
				<DailyActivityModal
					excludeTypes={dailyItems.map(d => d.activity_type)}
					onAdd={handleModalAdd}
					onClose={() => setShowModal(false)}
				/>
			)}
		</>
	)
}
