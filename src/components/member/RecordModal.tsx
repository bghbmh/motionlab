'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
	WorkoutType, Intensity, type WorkoutLog,
	WORKOUT_TYPE_LABELS, WORKOUT_ICONS, WORKOUT_COLORS,
	WORKOUT_METS_BY_INTENSITY, INTENSITY_LABELS,
} from '@/types/database'

// ─── 강도 스타일 ──────────────────────────────────────────────────
const INTENSITY_STYLE: Record<Intensity, React.CSSProperties> = {
	recovery: { borderColor: '#FFB347', color: '#FFB347', backgroundColor: 'rgba(255,179,71,0.12)' },
	normal: { borderColor: '#3DDBB5', color: '#3DDBB5', backgroundColor: 'rgba(61,219,181,0.12)' },
	high: { borderColor: '#FF6B5B', color: '#FF6B5B', backgroundColor: 'rgba(255,107,91,0.12)' },
}

// ─── 기본 폼 상태 ─────────────────────────────────────────────────
const DEFAULT_FORM = {
	workout_type: 'pilates' as WorkoutType,
	intensity: 'normal' as Intensity,
	duration: '',
	condition_memo: '',
	logged_at: new Date().toISOString().split('T')[0],
}

// ─── 모달 컴포넌트 ────────────────────────────────────────────────
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
				intensity: 'normal' as Intensity,  // 기존 기록엔 intensity 없음 → fallback
				duration: String(editTarget.duration_min),
				condition_memo: editTarget.condition_memo ?? '',
				logged_at: editTarget.logged_at,
			}
			: { ...DEFAULT_FORM }
	)
	const [loading, setLoading] = useState(false)

	// METs 자동 계산 — 운동 종류 + 강도 모두 반영
	const calculatedMets = useMemo<number | null>(() => {
		if (!form.workout_type || !form.duration || Number(form.duration) <= 0) return null
		const metsPerHour = WORKOUT_METS_BY_INTENSITY[form.workout_type][form.intensity]
		return Math.round(metsPerHour * Number(form.duration) * 100) / 100
	}, [form.workout_type, form.intensity, form.duration])

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!form.duration || !calculatedMets) return

		setLoading(true)
		const supabase = createClient()
		const metsScore = WORKOUT_METS_BY_INTENSITY[form.workout_type][form.intensity]

		if (editTarget) {
			await supabase
				.from('workout_logs')
				.update({
					workout_type: form.workout_type,
					duration_min: Number(form.duration),
					mets_score: metsScore,
					condition_memo: form.condition_memo || null,
					logged_at: form.logged_at,
				})
				.eq('id', editTarget.id)
		} else {
			await supabase.from('workout_logs').insert({
				member_id: memberId,
				logged_at: form.logged_at,
				workout_type: form.workout_type,
				duration_min: Number(form.duration),
				mets_score: metsScore,
				condition_memo: form.condition_memo || null,
				source: 'manual',
			})
		}

		setLoading(false)
		onSaved()
	}

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
						<button onClick={onClose} className="btn-ghost text-xs py-1 px-2.5">✕</button>
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
										onClick={() => setForm(p => ({ ...p, workout_type: t }))}
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

					{/* 운동 강도 */}
					<div>
						<p className="ml-card-label">운동 강도</p>
						<div className="flex gap-2">
							{(['recovery', 'normal', 'high'] as Intensity[]).map(i => (
								<button
									key={i}
									type="button"
									onClick={() => setForm(p => ({ ...p, intensity: i }))}
									className="flex-1 text-[11px] font-semibold rounded-lg py-2.5 transition-all"
									style={{
										border: '1px solid',
										...(form.intensity === i
											? INTENSITY_STYLE[i]
											: { borderColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)', backgroundColor: '#1a2740' }
										),
									}}
								>
									{INTENSITY_LABELS[i]}
								</button>
							))}
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

						{/* 운동 시간 + METs */}
						<div className="grid grid-cols-3 gap-x-3">
							<div className="col-span-2">
								<p className="ml-card-label">운동 시간 (분)</p>
								<input
									className="ml-input"
									type="number"
									inputMode="numeric"
									placeholder="예: 30"
									value={form.duration}
									onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
									required
								/>
							</div>
							<div className="col-span-1">
								<p className="ml-card-label">METs 점수</p>
								<div className="ml-input border-transparent flex items-center">
									<span
										className="font-mono text-base font-bold"
										style={{ color: calculatedMets ? '#3DDBB5' : 'rgba(255,255,255,0.2)' }}
									>
										{calculatedMets ?? '—'}
									</span>
								</div>
							</div>
							{/* 강도별 METs 참고 */}
							{form.workout_type && (
								<div className="col-span-3 text-[11px] font-mono mt-0.5 px-1"
									style={{ color: 'rgba(255,255,255,0.35)' }}>
									{WORKOUT_TYPE_LABELS[form.workout_type]} ·{' '}
									리커버리 {WORKOUT_METS_BY_INTENSITY[form.workout_type].recovery} /{' '}
									일반 {WORKOUT_METS_BY_INTENSITY[form.workout_type].normal} /{' '}
									고강도 {WORKOUT_METS_BY_INTENSITY[form.workout_type].high} METs/h
								</div>
							)}
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
			</div>
		</div>
	)
}