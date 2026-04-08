// src/components/member/WorkoutCompleteModal/AdjustStep.tsx
// Figma: Dialog-알림장-운동했어요-실제운동시간기록 (수정 입력)

import ModalHeader from '../ui/ModalHeader'
import ModalContents from '../ui/ModalContents'

import { MoveRight } from 'lucide-react'

interface Props {
	prescribedMin: number
	duration: string
	memo: string
	saving: boolean
	onDurationChange: (v: string) => void
	onMemoChange: (v: string) => void
	onClose: () => void
	onSave: () => void
}

export default function AdjustStep({
	prescribedMin,
	duration,
	memo,
	saving,
	onDurationChange,
	onMemoChange,
	onClose,
	onSave,
}: Props) {
	const isValid = !!duration && Number(duration) > 0

	return (
		<>
			<ModalHeader title="운동 기록 수정" onClose={onClose} />

			<ModalContents>

				{/* 기존 시간 → 실제 운동 시간 (가로 배치) */}
				<div className="flex items-end gap-2">

					{/* 기존 시간 — 읽기 전용 */}
					<div className="flex flex-col gap-1.5" style={{ flex: 1 }}>
						<label className="m-label" style={{ color: 'var(--m-text-sub)' }}>
							알림장 시간
						</label>
						<div
							className="m-input flex items-center text-gray-700 bg-neutral-100 border-transparent"
							style={{ cursor: 'default' }}
						>
							{prescribedMin}
						</div>
					</div>

					{/* 화살표 */}
					<div
						className="flex items-center justify-center shrink-0"
						style={{ height: 44, paddingBottom: 2 }}
					>
						<MoveRight width={16} className='text-neutral-600' />
					</div>

					{/* 실제 운동 시간 입력 */}
					<div className="flex flex-col gap-1.5" style={{ flex: 2 }}>
						<label className="m-label">실제 운동 시간 (분)</label>
						<input
							className="m-input"
							type="number"
							inputMode="numeric"
							min={1}
							placeholder={String(prescribedMin)}
							value={duration}
							onChange={e => onDurationChange(e.target.value)}
						/>
					</div>
				</div>

				{/* 컨디션 메모 */}
				<div className="flex flex-col gap-1.5">
					<label className="m-label">컨디션 메모 (선택)</label>
					<textarea
						className="m-input"
						placeholder="예: 허리가 약간 뻐근했어요"
						value={memo}
						onChange={e => onMemoChange(e.target.value)}
						rows={3}
						style={{ resize: 'none', lineHeight: '1.5' }}
					/>
				</div>

				{/* 최소 / 운동 기록 저장 */}
				<div className="flex gap-2">
					<button
						className="btn-ghost rounded-lg"
						style={{
							flex: 1,
							background: '#F1F5F9',
							padding: '14px',
						}}
						onClick={onClose}
					>
						최소
					</button>
					<button
						className="btn-primary"
						style={{
							flex: 2,
							padding: '14px',
							opacity: (saving || !isValid) ? 0.5 : 1,
						}}
						onClick={onSave}
						disabled={saving || !isValid}
					>
						{saving ? '저장 중...' : '운동 기록 저장'}
					</button>
				</div>
			</ModalContents>
		</>
	)
}
