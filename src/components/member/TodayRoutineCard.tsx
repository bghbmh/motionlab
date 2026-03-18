'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WORKOUT_TYPE_LABELS, INTENSITY_LABELS, WORKOUT_METS_BY_INTENSITY } from '@/types/database'
import type { Intensity, WorkoutType } from '@/types/database'
import DailyActivityModal, { type DailyActivityOption } from './DailyActivityModal'

// ── 타입 ──────────────────────────────────────────────────────────
interface RoutineItem {
	id: string          // note_workout_id
	day: string
	workout_type: WorkoutType
	intensity: Intensity
	duration_min: number | null
	mets: number | null
	coach_memo?: string | null
}

interface PatternItem {
	activity_type: string
	activity_label: string
	mets_value: number
	duration_min_per_day: number
	paper_code?: string | null
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

interface Props {
	memberId: string
	today: string
	routines: RoutineItem[]     // 강사 처방 루틴
	patterns: PatternItem[]     // 강사 입력 생활 패턴 
}

export default function TodayRoutineCard({
	memberId, today, routines, patterns
}: Props) {
	const router = useRouter()
	const [checked, setChecked] = useState<Set<string>>(new Set())// 루틴 체크 상태

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

	useEffect(() => {
		// 마운트 시 오늘 날짜 저장 여부 확인
		if (localStorage.getItem(storageKey) === 'true') {
			setSaved(true)
		}
	}, [storageKey])

	// 완료 버튼 활성화 조건: 루틴 체크 1개 이상 or 일상활동 포함 1개 이상
	const includedDaily = dailyItems.filter(d => d.status === 'included')
	const canSave = checked.size > 0 || includedDaily.length > 0

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

	async function handleComplete() {
		if (!canSave || loading) return
		setLoading(true)

		const supabase = createClient()
		const rows: any[] = []

		// 루틴 체크 완료 항목
		for (const routine of routines) {
			if (!checked.has(routine.id)) continue
			const metsPerHour = WORKOUT_METS_BY_INTENSITY[routine.workout_type][routine.intensity]
			rows.push({
				member_id: memberId,
				logged_at: today,
				workout_type: routine.workout_type,
				duration_min: routine.duration_min ?? 0,
				mets_score: metsPerHour,
				source: 'routine',
				note_workout_id: routine.id,
				activity_type: null,
				condition_memo: null,
			})
		}

		// 일상활동 포함 항목
		for (const item of includedDaily) {
			rows.push({
				member_id: memberId,
				logged_at: today,
				workout_type: 'other',
				duration_min: item.actualDuration,
				mets_score: item.mets_value,
				source: 'daily',
				note_workout_id: null,
				activity_type: item.activity_type,
				condition_memo: null,
			})
		}

		if (rows.length > 0) {
			await supabase.from('workout_logs').insert(rows)
		}

		// ★ 로컬 스토리지에 저장 완료 기록
		localStorage.setItem(storageKey, 'true')

		setLoading(false)
		setSaved(true)
		router.refresh()  // ← onSaved() 대신
	}

	if (saved) {
		return (
			<div className="ml-card flex flex-col items-center gap-2 py-6">
				<p className="text-2xl">✅</p>
				<p className="text-sm font-semibold text-white">오늘 활동이 기록됐어요!</p>
				<p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
					수고하셨습니다 {':)'}
				</p>
			</div>
		)
	}

	return (
		<>
			<div className="ml-card flex flex-col gap-4">
				<p className="ml-card-label m-0">오늘의 루틴</p>

				{/* ── 강사 처방 루틴 ── */}
				{routines.length > 0 ? (
					<div className="flex flex-col gap-2">
						{routines.map(r => {
							const isChecked = checked.has(r.id)
							const metsPerHour = WORKOUT_METS_BY_INTENSITY[r.workout_type]?.[r.intensity]
							const totalMets = metsPerHour && r.duration_min
								? Math.round(metsPerHour * r.duration_min)
								: null

							return (
								<button
									key={r.id}
									type="button"
									onClick={() => setChecked(prev => {
										const next = new Set(prev)
										isChecked ? next.delete(r.id) : next.add(r.id)
										return next
									})}
									className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
									style={{
										background: isChecked ? 'rgba(61,219,181,0.08)' : 'rgba(255,255,255,0.03)',
										border: `1px solid ${isChecked ? 'rgba(61,219,181,0.3)' : 'rgba(255,255,255,0.07)'}`,
									}}
								>
									{/* 체크박스 */}
									<div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
										style={{
											background: isChecked ? '#3DDBB5' : 'transparent',
											border: `2px solid ${isChecked ? '#3DDBB5' : 'rgba(255,255,255,0.2)'}`,
										}}>
										{isChecked && (
											<span className="text-[10px] font-bold text-navy">✓</span>
										)}
									</div>

									{/* 운동 정보 */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-1.5">
											<span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
												style={{
													background: r.intensity === 'high' ? 'rgba(255,107,91,0.12)' :
														r.intensity === 'recovery' ? 'rgba(255,179,71,0.12)' : 'rgba(61,219,181,0.12)',
													color: r.intensity === 'high' ? '#FF6B5B' :
														r.intensity === 'recovery' ? '#FFB347' : '#3DDBB5',
												}}>
												{INTENSITY_LABELS[r.intensity]}
											</span>
											<span className="text-sm font-semibold text-white">
												{WORKOUT_TYPE_LABELS[r.workout_type]}
											</span>
										</div>
										{r.duration_min && (
											<p className="text-[11px] font-mono mt-0.5"
												style={{ color: 'rgba(255,255,255,0.4)' }}>
												{r.duration_min}분
												{totalMets ? ` · ${totalMets} METs` : ''}
											</p>
										)}
										{r.coach_memo && (
											<p className="text-[11px] mt-1 leading-relaxed"
												style={{ color: 'rgba(255,179,71,0.8)' }}>
												💡 {r.coach_memo}
											</p>
										)}
									</div>
								</button>
							)
						})}
					</div>
				) : (
					<p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
						오늘 처방된 루틴이 없습니다.
					</p>
				)}

				{/* ── 구분선 ── */}
				<div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

				{/* ── 오늘의 일상활동 ── */}
				<div className="flex flex-col gap-2">
					<p className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
						오늘의 일상활동
					</p>

					{dailyItems.length === 0 && (
						<p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
							생활 패턴이 설정되지 않았습니다.
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
											className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-all"
											style={{
												background: item.status === s
													? s === 'included' ? 'rgba(61,219,181,0.2)' : 'rgba(255,255,255,0.1)'
													: 'transparent',
												border: `1px solid ${item.status === s
													? s === 'included' ? 'rgba(61,219,181,0.4)' : 'rgba(255,255,255,0.2)'
													: 'rgba(255,255,255,0.08)'}`,
												color: item.status === s
													? s === 'included' ? '#3DDBB5' : 'rgba(255,255,255,0.6)'
													: 'rgba(255,255,255,0.3)',
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
						className="w-full py-2.5 text-[12px] font-semibold rounded-xl transition-all"
						style={{
							background: 'transparent',
							border: '1px dashed rgba(255,255,255,0.2)',
							color: 'rgba(255,255,255,0.5)',
						}}
					>
						+ 다른 활동 추가
					</button>
				</div>

				{/* ── 완료 버튼 ── */}
				<button
					type="button"
					onClick={handleComplete}
					disabled={!canSave || loading}
					className="btn-primary py-3.5 text-sm font-bold transition-all"
					style={{ opacity: (!canSave || loading) ? 0.4 : 1 }}
				>
					{loading ? '저장 중...' : '오늘 활동 완료'}
				</button>
			</div>

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