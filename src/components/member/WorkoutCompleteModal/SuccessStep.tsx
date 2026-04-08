// src/components/member/WorkoutCompleteModal/SuccessStep.tsx
// Figma: Dialog-알림장-운동했어요-실제운동시간기록 (완료 화면)

import ModalContents from '../ui/ModalContents'
import { MoveRight } from 'lucide-react'

interface Props {
	totalCount: number
	newCompletedCount: number    // 이번 완료 포함한 수
	prescribedMin: number
	savedActual: number
	allDone: boolean
	onClose: () => void
}

export default function SuccessStep({
	totalCount,
	newCompletedCount,
	prescribedMin,
	savedActual,
	allDone,
	onClose,
}: Props) {
	const isExact = savedActual === prescribedMin

	return (
		<ModalContents gap={16}>

			{/* 파티 이모지 */}
			<div className="flex justify-center mt-5 h-16">
				<img src="/images/Party_popper.png" />
			</div>

			{/* 타이틀 + 완료 개수 */}
			<div className="text-center flex flex-col gap-2">
				<p className="font-bold" style={{ fontSize: 18, color: 'var(--m-text)' }}>
					수고하셨어요!
				</p>
				{
					newCompletedCount > 1 && <p className="text-sm leading-relaxed text-gray-600" >
						오늘 알림장 운동 {totalCount}개 중{' '}
						<span className='font-bold text-primary' >
							{newCompletedCount}개
						</span>
						를 완료했어요 💪
					</p>
				}

			</div>

			{/* 추천 → 실제 시간 비교 (달랐을 때만) */}
			{!isExact && (
				<div
					className="flex items-center justify-center gap-6 px-6 py-4 rounded-xl mx-auto "
					style={{ border: '1px solid var(--color-neutral-300)' }}
				>
					<div className="text-center">
						<p className="text-xs font-medium mb-1 text-gray-600" >알림장</p>
						<p className="font-semibold text-base text-gray-600" >
							{prescribedMin}분
						</p>
					</div>

					<MoveRight width={16} className='text-neutral-400' />

					<div className="text-center">
						<p className="text-xs font-medium   text-gray-600" >실제</p>
						<p className="font-semibold text-base text-orange-500 " >
							{savedActual}분
						</p>
					</div>
				</div>
			)}

			{/* 모두 완료 문구 */}
			{allDone && (
				<p className="text-sm text-center text-gray-700" >
					오늘 알림장의 운동을 모두 <span className='font-bold text-primary' >
						완료
					</span>했어요 🥳
				</p>
			)}

			{/* 확인 버튼 */}
			<button
				className="btn-primary rounded-lg font-medium mt-5"
				style={{ padding: '14px' }}
				onClick={onClose}
			>
				확인
			</button>
		</ModalContents>
	)
}
