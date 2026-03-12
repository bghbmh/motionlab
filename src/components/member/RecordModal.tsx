'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
	WorkoutType, type WorkoutLog, WORKOUT_TYPE_LABELS,
	WORKOUT_ICONS,
	WORKOUT_COLORS,
	WORKOUT_TYPE_METS

} from '@/types/database'

// ─── 기본 폼 상태 ─────────────────────────────────────────────────
const DEFAULT_FORM = {
	workout_type: 'pilates' as WorkoutType,
	duration: '',
	mets: '',
	condition_memo: '',
	logged_at: new Date().toISOString().split('T')[0],
}

// ─── 로그 입력 모달 ───────────────────────────────────────────────
export default function RecordModal({
	editTarget,
	onClose,
	onSaved,
	memberId,
}: {
	editTarget: WorkoutLog | null
	onClose: () => void
	onSaved: () => void
	memberId: string
}) {
	const [form, setForm] = useState(() =>
		editTarget
			? {
				workout_type: editTarget.workout_type,
				duration: String(editTarget.duration_min),
				mets: String(editTarget.mets_score),
				condition_memo: editTarget.condition_memo ?? '',
				logged_at: editTarget.logged_at,
			}
			: { ...DEFAULT_FORM }
	)
	const [loading, setLoading] = useState(false)

	function selectType(t: WorkoutType) {
		setForm(prev => ({
			...prev,
			workout_type: t,
			mets: prev.mets || String(WORKOUT_TYPE_METS[t]),
		}))
	}

	async function handleSubmit(e: React.FormEvent) {

		console.log("handleSubmit - ", memberId, calculatedMets, form);

		e.preventDefault()  // ← 맨 위로 이동

		if (!form.duration || !calculatedMets) return  // form.mets 대신 calculatedMets 사용

		setLoading(true)
		const supabase = createClient()

		if (editTarget) {
			console.log("수정 - ", memberId, form)
			// 수정
			await supabase
				.from('workout_logs')
				.update({
					workout_type: form.workout_type,
					duration_min: Number(form.duration),
					mets_score: WORKOUT_TYPE_METS[form.workout_type],
					condition_memo: form.condition_memo || null,
					logged_at: form.logged_at,
				})
				.eq('id', editTarget.id)
		} else {
			// 신규

			console.log("신규 - ", memberId, form)
			await supabase.from('workout_logs').insert(
				{
					member_id: memberId,
					logged_at: form.logged_at,
					workout_type: form.workout_type,
					duration_min: Number(form.duration),
					mets_score: WORKOUT_TYPE_METS[form.workout_type],
					condition_memo: form.condition_memo || null,
				} // ,
				// { onConflict: 'member_id,logged_at' }
			)
		}

		setLoading(false)
		onSaved()
	}

	// METs 자동 계산 (운동 종류 기준 METs/h × 시간/60), 60으로 나누는건 안함
	const calculatedMets = useMemo<number | null>(() => {
		if (!form.workout_type || !form.duration || Number(form.duration) <= 0) return null
		const base = WORKOUT_TYPE_METS[form.workout_type]  // METs per hour
		//return Math.round(base * (Number(form.duration) / 60) * 100) / 100 

		return Math.round(base * Number(form.duration) * 100) / 100
	}, [form.workout_type, form.duration])

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center"
			style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
			onClick={onClose}
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
				{/* 핸들 */}
				<div className="flex justify-center pt-3 pb-1">
					<div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
				</div>

				<div className="px-5 pb-8 flex flex-col gap-5">
					{/* 헤더 */}
					<div className="flex justify-between items-center pt-2">
						<p className="font-mono text-sm font-medium" style={{ color: '#3DDBB5' }}>
							{editTarget ? '기록 수정' : '새 운동 기록'}
						</p>
						<button
							onClick={onClose}
							className="btn-ghost text-xs py-1 px-2.5"
						>
							✕
						</button>
					</div>

					{/* 운동 종류 */}
					<div>
						<p className="ml-card-label">운동 종류</p>
						<div className="grid grid-cols-3 gap-2">
							{(Object.keys(WORKOUT_TYPE_LABELS) as WorkoutType[]).map(t => {
								const colors = WORKOUT_COLORS[t]
								const isSelected = form.workout_type === t
								return (
									<button
										key={t}
										type="button"
										onClick={() => selectType(t)}
										className="py-2.5 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-1"
										style={{
											background: isSelected ? colors.bg : '#1a2740',
											border: `1px solid ${isSelected ? colors.border : 'rgba(255,255,255,0.07)'}`,
											color: isSelected ? colors.text : 'rgba(255,255,255,0.35)',
										}}
									>
										<span className="text-base">{WORKOUT_ICONS[t]}</span>
										<span className="text-[11px]">{WORKOUT_TYPE_LABELS[t]}</span>
									</button>
								)
							})}
						</div>
					</div>

					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						{/* 날짜 */}
						<div>
							<p className="ml-card-label">날짜</p>
							<input
								className="ml-input"
								type="date"
								value={form.logged_at}
								onChange={e => setForm(p => ({ ...p, logged_at: e.target.value }))}
								required
							/>
						</div>

						{/* METs + 시간 가로 배치 */}
						<div className="grid grid-cols-3 gap-1 gap-x-3">
							<div className='col-span-2'>
								<p className="ml-card-label">운동 시간 (분)</p>
								<input
									className="ml-input"
									type="number"
									placeholder="예: 30"
									value={form.duration}
									onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
									required
								/>
							</div>
							<div className='col-span-1'>
								<p className="ml-card-label">METs 점수</p>
								{/* <input
									className="ml-input"
									type="number"
									step="0.1"
									placeholder="예: 4.5"
									value={form.mets}
									onChange={e => setForm(p => ({ ...p, mets: e.target.value }))}
									required
								/> */}
								<div className="ml-input border-transparent">
									{calculatedMets ?? '—'}
								</div>
							</div>

							{/* 참고 METs */}
							<div
								className="text-[11px] col-span-3"
								style={{ color: 'rgba(255,255,255,0.5) ' }}
							>참고 · 스트레칭 2.5 / 근력운동 5.0 / 유산소 6.0 / 필라테스 4.0 / 요가 3.0 / 기타 3.5
							</div>
						</div>



						{/* 컨디션 메모 */}
						<div>
							<p className="ml-card-label">컨디션 메모 (선택)</p>
							<input
								className="ml-input"
								placeholder="예: 허리가 약간 뻐근했어요"
								value={form.condition_memo}
								onChange={e => setForm(p => ({ ...p, condition_memo: e.target.value }))}
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="btn-primary py-3.5 text-sm mt-1"
							style={{ opacity: loading ? 0.5 : 1 }}
						>
							{loading ? '저장 중...' : editTarget ? '수정 완료' : '기록 저장'}
						</button>
					</form>
				</div>
			</div >
		</div >
	)
}