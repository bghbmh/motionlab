// src/components/member/WorkoutCompleteModal.tsx
// Figma: Dialog-알림장-운동했어요 + Dialog-알림장-운동했어요-실제운동시간기록

'use client'

import { useState } from 'react'
import { WORKOUT_TYPE_LABELS } from '@/types/database'
import type { WorkoutType } from '@/types/database'
import WorkoutTypeIcon from './ui/WorkoutTypeIcon'
import CoachMemo from './ui/CoachMemo'

interface NoteWorkout {
	id: string
	workout_type: WorkoutType
	intensity: string
	duration_min: number | null
	mets: number | null
	coach_memo?: string | null
}

interface Props {
	workout: NoteWorkout
	totalCount: number
	completedCount: number  // 이 운동 완료 전 기준
	onClose: () => void
	onDone: (durationMin: number, prescribedMin: number, conditionMemo: string) => Promise<void>
}

type Step = 'confirm' | 'adjust' | 'success'

export default function WorkoutCompleteModal({
	workout,
	totalCount,
	completedCount,
	onClose,
	onDone,
}: Props) {
	const [step, setStep] = useState<Step>('confirm')
	const [duration, setDuration] = useState(String(workout.duration_min ?? 30))
	const [memo, setMemo] = useState('')
	const [saving, setSaving] = useState(false)
	const [savedActual, setSavedActual] = useState<number | null>(null)

	const prescribedMin = workout.duration_min ?? 30
	const label = WORKOUT_TYPE_LABELS[workout.workout_type] ?? workout.workout_type
	const newCompletedCount = completedCount + 1
	const allDone = newCompletedCount >= totalCount
	const isExact = savedActual === prescribedMin

	async function handleExact() {
		setSaving(true)
		await onDone(prescribedMin, prescribedMin, '')
		setSavedActual(prescribedMin)
		setStep('success')
		setSaving(false)
	}

	async function handleAdjust() {
		if (!duration || Number(duration) <= 0) return
		setSaving(true)
		await onDone(Number(duration), prescribedMin, memo)
		setSavedActual(Number(duration))
		setStep('success')
		setSaving(false)
	}

	return (
		// 딤 배경 — 가운데 정렬 팝업
		<div
			className="fixed inset-0 z-50 flex items-center justify-center px-4"
			style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
			onClick={step !== 'success' ? onClose : undefined}
		>
			<div
				className="w-full max-w-[386px] flex flex-col relative"
				style={{
					backgroundColor: 'var(--m-surface)',
					borderRadius: 'var(--m-radius-3xl)',
					overflow: 'hidden',
				}}
				onClick={e => e.stopPropagation()}
			>
				{/* ── X 닫기 버튼 (공통) ── */}
				{step !== 'success' && (
					<button
						onClick={onClose}
						className="absolute top-[18px] right-[18px]"
						style={{ color: 'var(--m-text-muted)', lineHeight: 1 }}
						aria-label="닫기"
					>
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
							<path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
						</svg>
					</button>
				)}

				{/* ════════════════════════════════
            Step: success — 완료 화면
            ════════════════════════════════ */}
				{step === 'success' && (
					<div className="px-6 pt-6 pb-8 flex flex-col items-center gap-4 text-center">

						{/* 파티 이모지 */}
						<div style={{ fontSize: 64, lineHeight: 1 }}>
							{allDone ? '🎉' : '🎉'}
						</div>

						{/* 타이틀 */}
						<p
							className="font-bold"
							style={{ fontSize: 18, color: 'var(--m-text)' }}
						>
							수고하셨어요!
						</p>
						{/* 완료 개수 */}
						<p
							className="text-sm leading-relaxed"
							style={{ color: 'var(--m-text-sub)' }}
						>
							오늘 처방된 운동 {totalCount}개 중{' '}
							<span style={{ color: 'var(--m-primary)', fontWeight: 700 }}>
								{newCompletedCount}개
							</span>
							를 완료했어요 💪
						</p>

						{/* 추천 → 실제 시간 비교 (시간이 달랐을 때만) */}
						{!isExact && savedActual !== null && (
							<div
								className="flex items-center gap-6 px-6 py-4 rounded-xl"
								style={{
									backgroundColor: 'var(--m-surface-2)',
									border: '1px solid var(--m-border)',
								}}
							>
								<div className="text-center">
									<p
										className="text-xs mb-1"
										style={{ color: 'var(--m-text-muted)' }}
									>
										추천
									</p>
									<p
										className="font-semibold"
										style={{ fontSize: 16, color: 'var(--m-text-disabled)' }}
									>
										{prescribedMin}분
									</p>
								</div>

								{/* 화살표 */}
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M3 8h10M9 4l4 4-4 4" stroke="var(--m-border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>

								<div className="text-center">
									<p
										className="text-xs mb-1"
										style={{ color: 'var(--m-text-muted)' }}
									>
										실제
									</p>
									<p
										className="font-semibold"
										style={{ fontSize: 16, color: 'var(--m-orange)' }}
									>
										{savedActual}분
									</p>
								</div>
							</div>
						)}

						{/* 모두 완료 문구 */}
						{allDone && (
							<p className="text-sm" style={{ color: 'var(--m-text-sub)' }}>
								오늘 루틴을 모두 완료했어요 🥳
							</p>
						)}

						{/* 확인 버튼 — full width */}
						<button
							className="m-btn-primary w-full"
							style={{ borderRadius: 'var(--m-radius-xl)', padding: '14px' }}
							onClick={onClose}
						>
							확인
						</button>
					</div>
				)}

				{/* ── Step: 처방대로 했는지 확인 ── */}
				{step === 'confirm' && (
					<div className="px-5 pb-8 flex flex-col gap-5 pt-2">
						<div className="flex justify-between items-center">
							<p className="text-sm font-medium" style={{ color: 'var(--m-primary)' }}>
								운동 기록
							</p>
						</div>

						{/* 운동 정보 */}
						<div
							className="rounded-2xl p-4 flex items-center gap-4"
							style={{
								backgroundColor: 'var(--m-surface-2)',
								border: '1px solid var(--m-border)',
							}}
						>
							<WorkoutTypeIcon workoutType={workout.workout_type} size={56} />
							<div>
								<p className="font-bold text-sm" style={{ color: 'var(--m-text)' }}>{label}</p>
								<p className="text-xs mt-0.5" style={{ color: 'var(--m-text-muted)' }}>
									처방 시간 · {prescribedMin}분
								</p>
								{workout.coach_memo && (
									<div className="mt-1.5">
										<CoachMemo memo={workout.coach_memo} />
									</div>
								)}
							</div>
						</div>

						<p className="text-sm text-center" style={{ color: 'var(--m-text-sub)' }}>
							알림장 내용대로 운동하셨나요?
						</p>

						<div className="flex flex-col gap-2">
							<button
								className="m-btn-primary"
								style={{
									padding: '12px',
									opacity: saving ? 0.5 : 1,
								}}
								onClick={handleExact}
								disabled={saving}
							>
								{saving ? '저장 중...' : `네, ${prescribedMin}분 그대로 완료했어요`}
							</button>
							<button
								className="m-btn-default"
								style={{ padding: '12px' }}
								onClick={() => setStep('adjust')}
							>
								아니요, 시간이 달랐어요 (직접 입력)
							</button>
						</div>
					</div>
				)}

				{/* ════════════════════════════════
            Step: adjust — 운동 기록 수정
            ════════════════════════════════ */}
				{step === 'adjust' && (
					<div className="px-6 pt-6 pb-8 flex flex-col gap-5">

						{/* 타이틀 */}
						<p
							className="font-bold pr-8"
							style={{ fontSize: 18, color: 'var(--m-text)' }}
						>
							운동 기록 수정
						</p>

						{/* 기존 시간 → 실제 운동 시간 가로 배치 */}
						<div className="flex items-end gap-2">

							{/* 기존 시간 (읽기 전용) */}
							<div className="flex flex-col gap-1.5" style={{ flex: 1 }}>
								<label
									className="m-label"
									style={{ color: 'var(--m-text-sub)' }}
								>
									기존 시간
								</label>
								<div
									className="m-input flex items-center"
									style={{
										backgroundColor: 'var(--m-surface-2)',
										color: 'var(--m-text-disabled)',
										cursor: 'not-allowed',
									}}
								>
									{prescribedMin}
								</div>
							</div>

							{/* 화살표 */}
							<div
								className="flex items-center justify-center shrink-0"
								style={{ height: 44, paddingBottom: 2 }}
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path
										d="M3 8h10M9 4l4 4-4 4"
										stroke="var(--m-neutral-400)"
										strokeWidth="1.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</div>

							{/* 실제 운동 시간 입력 */}
							<div className="flex flex-col gap-1.5" style={{ flex: 2 }}>
								<label className="m-label">실제 운동 시간 (분)</label>
								<input
									className="m-input"
									type="number"
									min={1}
									placeholder={String(prescribedMin)}
									value={duration}
									onChange={e => setDuration(e.target.value)}
									autoFocus
								/>
							</div>
						</div>

						{/* 컨디션 메모 textarea */}
						<div className="flex flex-col gap-1.5">
							<label className="m-label">컨디션 메모 (선택)</label>
							<textarea
								className="m-input"
								placeholder="예: 허리가 약간 뻐근했어요"
								value={memo}
								onChange={e => setMemo(e.target.value)}
								rows={3}
								style={{ resize: 'none', lineHeight: '1.5' }}
							/>
						</div>

						{/* 최소 / 운동 기록 저장 버튼 */}
						<div className="flex gap-2">
							<button
								className="m-btn-ghost"
								style={{
									flex: 1,
									border: '1px solid var(--m-border)',
									borderRadius: 'var(--m-radius-lg)',
									padding: '12px',
								}}
								onClick={onClose}
							>
								최소
							</button>
							<button
								className="m-btn-primary"
								style={{
									flex: 2,
									borderRadius: 'var(--m-radius-lg)',
									padding: '12px',
									opacity: (saving || !duration || Number(duration) <= 0) ? 0.5 : 1,
								}}
								onClick={handleAdjust}
								disabled={saving || !duration || Number(duration) <= 0}
							>
								{saving ? '저장 중...' : '운동 기록 저장'}
							</button>
						</div>
					</div>
				)}
			</div>
		</div >
	)
}
