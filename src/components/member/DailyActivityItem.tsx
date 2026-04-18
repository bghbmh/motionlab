// src/components/member/DailyActivityItem.tsx
// Figma: 컴포넌트 섹션 > 일상생활활동-아이템
// 커스텀-체크박스 + 활동명 + 수정/삭제 버튼

import { Pencil, Trash2, Check } from 'lucide-react'

interface Props {
	activityType: string
	activityLabel: string
	metsValue: number
	defaultDuration: number
	isIncluded: boolean          // 커스텀-체크박스 상태
	onToggleInclude: () => void
	onEdit: () => void
	onDelete: () => void
}

export default function DailyActivityItem({
	activityLabel,
	metsValue,
	defaultDuration,
	isIncluded,
	onToggleInclude,
	onEdit,
	onDelete,
}: Props) {
	return (
		<div
			className="flex items-center gap-3 py-4 w-full"
			style={{ borderTop: '1px dashed var(--m-border-dashed)' }}
		>
			{/* 커스텀 체크박스 — Figma: 커스텀-체크박스 (Default/active) */}
			<button
				type="button"
				className={`btn-check shrink-0 ${isIncluded ? 'btn-check-active' : ''}`}
				onClick={onToggleInclude}
				aria-label={isIncluded ? '포함 해제' : '포함'}
			>
				<Check size={20} className={`${isIncluded ? 'text-white' : 'text-gray-300'}`} />

			</button>

			{/* 활동명 + 옵션 */}
			<div className="flex-1 flex items-center min-w-0 ">
				<div className="flex flex-col justify-center ">
					<span
						className="text-sm font-medium"
						style={{ color: 'var(--color-gray-800)' }}
					>
						{activityLabel}
					</span>
					<div
						className="flex items-center gap-1.5 "
						style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}
					>
						<span>{/*기본*/} {defaultDuration}분</span>
						<span
							className="inline-block rounded-full"
							style={{ width: 2, height: 2, backgroundColor: 'var(--color-neutral-400)' }}
						/>
						<span>{metsValue} METs/h</span>
					</div>
				</div>
			</div>

			{/* 수정 버튼 */}
			<button
				type="button"
				className="btn-icon btn-icon-outline"
				onClick={onEdit}
				aria-label="수정"
			>
				<Pencil size={20} />
			</button>

			{/* 삭제 버튼 */}
			<button
				type="button"
				className="btn-icon btn-icon-danger"
				onClick={onDelete}
				aria-label="삭제"
			>
				<Trash2 size={20} className='text-red-500' />
			</button>
		</div >
	)
}
