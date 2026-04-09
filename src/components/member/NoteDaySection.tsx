// src/components/member/NoteDaySection.tsx
// 알림장 탭 > 요일별-알림장목록
// Figma: 요일별-알림장목록
//
// [수정 내용]
//   - isFuture, onFutureCheck prop 추가
//   - NoteWorkoutItem으로 두 prop 전달

import NoteWorkoutItem from './NoteWorkoutItem'
import type { NoteWorkoutItemData } from './NoteWorkoutItem'

interface Props {
	day: string
	completedCount: number
	totalCount: number
	items: NoteWorkoutItemData[]
	isLatest: boolean
	isFuture?: boolean       // 이 섹션이 미래 날짜인지
	onToggle?: (id: string, completed: boolean, item: NoteWorkoutItemData) => void
	onFutureCheck?: () => void  // 미래 날짜 체크 시도 시 토스트 표시
}

export default function NoteDaySection({
	day,
	completedCount,
	totalCount,
	items,
	isLatest,
	isFuture = false,
	onToggle,
	onFutureCheck,
}: Props) {
	return (
		<div className="bg-white rounded-[12px] w-full overflow-hidden border border-neutral-200">

			{/* 요일 헤더 */}
			<div className="flex items-center justify-between px-[16px] py-[8px] w-full bg-neutral-100">
				<div className="flex items-center gap-2">
					<span className="text-[12px] font-medium text-neutral-800">{day}</span>
					{/* 미래 날짜 뱃지 */}
					{isFuture && (
						<span
							style={{
								fontSize: 10,
								fontWeight: 600,
								color: 'rgba(107,114,128,0.7)',
								backgroundColor: 'rgba(107,114,128,0.08)',
								borderRadius: 4,
								padding: '1px 6px',
							}}
						>
							예정
						</span>
					)}
				</div>
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
						isFuture={isFuture}
						onToggle={onToggle}
						onFutureCheck={onFutureCheck}
						hasDivider={idx > 0}
					/>
				))}
			</div>
		</div>
	)
}
