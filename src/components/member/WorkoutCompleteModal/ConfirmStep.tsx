// src/components/member/WorkoutCompleteModal/ConfirmStep.tsx
// Figma: Dialog-알림장-운동했어요 (처방대로 수행 확인)

import ModalHeader from '../ui/ModalHeader'
import ModalContents from '../ui/ModalContents'
import type { WorkoutType } from '@/types/database'
import { WORKOUT_TYPE_LABELS } from '@/types/database'
import WorkoutTypeIcon from '../ui/WorkoutTypeIcon'
import CoachMemo from '../ui/CoachMemo'

interface Props {
	workoutType: WorkoutType
	prescribedMin: number
	coachMemo?: string | null      // ← 추가
	saving: boolean
	onClose: () => void
	onExact: () => void           // 처방대로 완료
	onAdjust: () => void          // 시간 달랐어요 → adjust step
}

export default function ConfirmStep({
	workoutType,
	prescribedMin,
	coachMemo,                     // ← 추가
	saving,
	onClose,
	onExact,
	onAdjust,
}: Props) {
	const label = WORKOUT_TYPE_LABELS[workoutType] ?? workoutType

	return (
		<>
			<ModalHeader title="운동 기록" onClose={onClose} />

			<ModalContents>
				{/* 운동 정보 */}
				<div
					className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200"
				>
					<WorkoutTypeIcon workoutType={workoutType} size={56} />
					<div className='flex-1'>
						<p className="font-bold text-sm" style={{ color: 'var(--m-text)' }}>{label}</p>
						<p className="text-xs mt-0.5" style={{ color: 'var(--m-text-muted)' }}>
							시간  {prescribedMin}분
						</p>
						{coachMemo && (
							<div className="mt-1.5">
								<CoachMemo memo={coachMemo} />
							</div>
						)}
					</div>
				</div>

				<p className="text-sm text-center" style={{ color: 'var(--m-text-sub)' }}>
					알림장 내용대로 운동하셨나요?
				</p>

				{/* 버튼 */}
				<div className="flex flex-col gap-2">
					<button
						className="btn-primary font-medium"
						style={{
							padding: '14px',
							opacity: saving ? 0.5 : 1,
						}}
						onClick={onExact}
						disabled={saving}
					>
						{saving ? '저장 중...' : `네, ${prescribedMin}분 그대로 완료했어요`}
					</button>
					<button
						className="btn-ghost  font-medium text-gray-700 rounded-lg"
						style={{
							background: '#F1F5F9',
							padding: '14px',
						}}
						onClick={onAdjust}
					>
						아니요, 시간이 달랐어요 (직접 입력)
					</button>
				</div>
			</ModalContents>
		</>
	)
}
