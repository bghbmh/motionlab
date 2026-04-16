// src/components/member/DailyActivityItem.tsx
// 일상생활 활동 목록 1개 아이템
// 아이템 전체 클릭 시 DailyActivityDurationModal 열기

import type { DailyActivityOption } from '@/data/dailyActivityOptions'

interface Props {
	option: DailyActivityOption
	onSelect: (option: DailyActivityOption) => void
}

export default function DailyActivityItemModal({ option, onSelect }: Props) {
	return (
		<button
			type="button"
			onClick={() => onSelect(option)}
			className="flex items-center justify-between px-[16px] py-[12px] rounded-[8px] w-full text-left transition-colors"
			style={{
				backgroundColor: '#fafafa',
				border: '1px solid #f5f5f5',
			}}
		>
			<div className="flex flex-col gap-[2px] flex-1 min-w-0">
				<p className="text-sm font-medium text-[#1e2939] truncate">
					{option.activity_label}
				</p>
				<div className="flex items-center gap-[6px]">
					<span className="text-[12px] text-[#525252]">
						{option.mets_value} METs/h
					</span>
					<svg width="2" height="2" viewBox="0 0 2 2" fill="none">
						<circle cx="1" cy="1" r="1" fill="#82827C" />
					</svg>
					<span className="text-[12px] text-[#525252]">
						{option.paper_code}
					</span>
				</div>
			</div>

			{/* 화살표 아이콘 */}
			<svg
				width="16" height="16" viewBox="0 0 16 16" fill="none"
				className="shrink-0 ml-3 text-[#b0b0b0]"
			>
				<path
					d="M6 3l5 5-5 5"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</button>
	)
}
