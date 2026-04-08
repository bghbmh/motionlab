// src/components/member/DailyActivityDurationModal.tsx
// 일상생활 활동 선택 후 수행시간 입력하는 중앙 모달
// Figma: Dialog-일상생활활동-수행시간입력

import { useState } from 'react'
import Modal from './ui/Modal'

interface DailyActivityOption {
	activity_type: string
	activity_label: string
	mets_value: number
	paper_code: string
	category: string
}

interface Props {
	option: DailyActivityOption
	onConfirm: (option: DailyActivityOption, durationMin: number) => void
	onBack: () => void   // 목록으로 돌아가기
	onClose: () => void
}

export default function DailyActivityDurationModal({
	option,
	onConfirm,
	onBack,
	onClose,
}: Props) {
	const [duration, setDuration] = useState('30')

	const durationNum = Number(duration)
	const isValid = !!duration && durationNum > 0
	const previewMets = isValid
		? Math.round(option.mets_value * durationNum)
		: null

	function handleConfirm() {
		if (!isValid) return
		onConfirm(option, durationNum)
	}

	return (
		<Modal onClose={onClose}>
			<div className="flex flex-col gap-2 p-[24px] relative">

				{/* 헤더 */}
				<div className="relative flex items-center  pb-0">
					<div>
						<p
							className="font-bold pr-8"
							style={{ fontSize: 18, color: 'var(--m-text)' }}
						>
							활동시간 입력
						</p>
					</div>


					{/* X 닫기 버튼 — absolute로 우상단 고정 */}
					{/* 닫기 버튼 */}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onClose();
						}}
						className="absolute right-[18px] top-[8px] opacity-70 hover:opacity-100 transition-opacity"
						aria-label="닫기"
					>
						<svg width="14" height="14" viewBox="0 0 11.5 11.5" fill="none">
							<path
								d="M10.75 0.75004L0.750042 10.75M0.75 0.75L10.75 10.75"
								stroke="#020618"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="1.5"
							/>
						</svg>
					</button>
				</div>

				{/* 선택된 활동 표시 */}
				<div className="rounded-[8px] px-[16px] py-[12px] bg-neutral-100">
					<div className="flex items-center gap-[12px]">
						<div className="flex flex-col gap-[2px] flex-1">
							<p className="text-sm font-medium text-neutral-800">
								{option.activity_label}
							</p>
							<div className="flex items-center gap-[6px]">
								<span className="text-[12px] text-neutral-700">
									{option.mets_value} METs/h
								</span>
								<svg width="2" height="2" viewBox="0 0 2 2" fill="none">
									<circle cx="1" cy="1" r="1" fill="#82827C" />
								</svg>
								<span className="text-[12px] text-neutral-400">
									{option.paper_code}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* 수행시간 + METs 입력 */}
				<div className="grid grid-cols-3 gap-2">
					<div className="col-span-2 flex flex-col gap-1.5">
						<label className="m-label px-[4px]">수행 시간 (분)</label>
						<input
							type="number"
							inputMode="numeric"
							min={1}
							className="m-input"
							placeholder="30"
							value={duration}
							onChange={e => setDuration(e.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="m-label px-[4px]">METs 점수</label>
						<div
							className="m-input select-none border-transparent text-neutral-700 bg-neutral-100"
							style={{ cursor: 'default' }}
						>
							{previewMets ?? '-'}
						</div>
					</div>
				</div>

				{/* METs 계산식 미리보기 */}
				{previewMets !== null && (
					<p className="text-[12px] px-2">
						<span className="text-[#1d211c]">
							{option.mets_value} METs/h × {duration}분 ={' '}
						</span>
						<span style={{ color: 'var(--color-primary)' }}>
							{previewMets} METs
						</span>
					</p>
				)}

				{/* 버튼 */}
				<div className="grid grid-cols-3 gap-2 pt-3">
					<button
						type="button"
						onClick={onBack}
						className="col-span-1 px-[16px] py-[12px] rounded-[8px] text-sm font-medium text-[#364153]"
						style={{ backgroundColor: '#f1f5f9' }}
					>
						취소
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={!isValid}
						className="btn-primary col-span-2"
						style={{
							borderRadius: 8,
							padding: '12px 16px',
							opacity: !isValid ? 0.5 : 1,
						}}
					>
						일상생활 등록
					</button>
				</div>
			</div>
		</Modal>
	)
}
