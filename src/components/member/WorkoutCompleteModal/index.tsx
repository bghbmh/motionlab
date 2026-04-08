// src/components/member/WorkoutCompleteModal/index.tsx
// step 상태 관리만 담당 — UI는 각 Step 컴포넌트에 위임

'use client'

import { useState } from 'react'
import type { NoteWorkout } from '@/types/database'
import Modal from '../ui/Modal'
import ConfirmStep from './ConfirmStep'
import AdjustStep from './AdjustStep'
import SuccessStep from './SuccessStep'


interface Props {
	workout: NoteWorkout
	totalCount: number
	completedCount: number    // 이 운동 완료 전 기준
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

	// 모달이 열릴 때의 completedCount를 고정 (useState 초기값으로 캡처)
	// handleDone 후 부모의 completedCount가 바뀌어도 영향 없음
	const [fixedCompletedCount] = useState(completedCount)
	const newCompletedCount = fixedCompletedCount + 1
	const allDone = newCompletedCount >= totalCount

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

	// success 단계에서는 배경 클릭으로 닫기 비활성
	const handleBackdropClose = step !== 'success' ? onClose : undefined

	return (
		<Modal onClose={handleBackdropClose}>
			{step === 'confirm' && (
				<ConfirmStep
					workoutType={workout.workout_type}
					prescribedMin={prescribedMin}
					coachMemo={workout.coach_memo}
					saving={saving}
					onClose={onClose}
					onExact={handleExact}
					onAdjust={() => setStep('adjust')}
				/>
			)}

			{step === 'adjust' && (
				<AdjustStep
					prescribedMin={prescribedMin}
					duration={duration}
					memo={memo}
					saving={saving}
					onDurationChange={setDuration}
					onMemoChange={setMemo}
					onClose={onClose}
					onSave={handleAdjust}
				/>
			)}

			{step === 'success' && savedActual !== null && (
				<SuccessStep
					totalCount={totalCount}
					newCompletedCount={newCompletedCount}
					prescribedMin={prescribedMin}
					savedActual={savedActual}
					allDone={allDone}
					onClose={onClose}
				/>
			)}
		</Modal>
	)
}
