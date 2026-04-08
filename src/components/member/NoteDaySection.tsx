// src/components/member/NoteDaySection.tsx
// 알림장 탭 > 요일별-알림장목록
// Figma: 요일별-알림장목록

import NoteWorkoutItem from './NoteWorkoutItem'
import type { NoteWorkoutItemData } from './NoteWorkoutItem'

interface Props {
	day: string                  // '월요일', '수요일' 등
	completedCount: number       // 완료한 운동 수
	totalCount: number           // 전체 운동 수
	items: NoteWorkoutItemData[]
	isLatest: boolean
	onToggle?: (id: string, completed: boolean, item: NoteWorkoutItemData) => void  // ← item 추가
}

export default function NoteDaySection({
	day,
	completedCount,
	totalCount,
	items,
	isLatest,
	onToggle,
}: Props) {

	console.log("NoteDaySection - ", items)

	return (
		<div className="bg-white rounded-[12px] w-full overflow-hidden border border-neutral-200">

			{/* 요일 헤더 */}
			<div
				className="flex items-center justify-between px-[16px] py-[8px] w-full bg-neutral-100"
			>
				<span className="text-[12px] font-medium text-neutral-800">{day}</span>
				<span className="text-[12px] font-medium text-neutral-800">
					{completedCount}/{totalCount}
				</span>
			</div>

			{/* 운동 아이템 목록 */}
			<div className="flex flex-col px-[16px]">
				{items.map((item, idx) => (
					<NoteWorkoutItem
						key={item.id}
						item={item}
						isLatest={isLatest}
						onToggle={onToggle}
						hasDivider={idx > 0}
					/>
				))}
			</div>
		</div>
	)
}
