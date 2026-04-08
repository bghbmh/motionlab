// src/components/member/NoteCard.tsx
// 알림장 탭 > 알림장 1개 카드
// Figma: 최근-알림장 / 예전-알림장
// isLatest: true → 날짜 초록색 + 스위치 / false → 날짜 회색 + 체크/X 아이콘

import NoteDaySection from './NoteDaySection'
import type { NoteWorkoutItemData } from './NoteWorkoutItem'

export interface NoteDaySectionData {
	id: string
	day: string                    // '월요일', '수요일' 등
	items: NoteWorkoutItemData[]
}

export interface NoteCardData {
	id: string
	sentAt: string                 // 'YYYY-MM-DD'
	direction: string              // 운동 방향 텍스트
	targetMets: number
	periodStart: string            // 'YY.MM.DD'
	periodEnd: string              // 'YY.MM.DD'
	daySections: NoteDaySectionData[]
}

interface Props {
	note: NoteCardData
	isLatest: boolean
	onToggle?: (workoutId: string, completed: boolean, item: NoteWorkoutItemData) => void  // ← item 추가
}

export default function NoteCard({ note, isLatest, onToggle }: Props) {

	console.log("NoteCard - ", note)

	return (
		<div className="bg-white rounded-[16px] w-full">
			<div className="flex flex-col gap-[8px] px-[16px] py-[12px] w-full">

				{/* 알림장 전송 날짜 */}
				<div className="flex items-center justify-between pb-[8px] w-full border-b border-[#f0f0f0]">
					<span
						className="text-[12px] font-bold"
						style={{ color: isLatest ? 'var(--color-primary)' : '#525252' }}
					>
						{note.sentAt}
					</span>
				</div>

				{/* 운동 방향 */}
				<div
					className="relative flex flex-col gap-[4px] px-[8px] py-[4px] w-full"
					style={{ borderLeft: '3px solid #d4d4d4' }}
				>
					{/* 방향 텍스트 */}
					<p className="text-[12px] text-[#404040]">{note.direction}</p>

					{/* 목표 METs */}
					<div className="flex items-center gap-[4px] text-[12px]">
						<span className="text-[#737373]">목표 -</span>
						<span className="font-semibold text-[#404040]">{note.targetMets}</span>
						<span className="text-[#737373]">METs</span>
					</div>

					{/* 기간 */}
					<div className="flex items-center gap-[4px] text-[12px]">
						<span className="text-[#737373]">기간 -</span>
						<span className="font-semibold text-[#404040]">{note.periodStart}</span>
						<span className="text-[#737373]">~</span>
						<span className="font-semibold text-[#404040]">{note.periodEnd}</span>
					</div>
				</div>

				{/* 요일별 알림장 목록 */}
				{note.daySections.map((section) => {
					const completedCount = section.items.filter(i => i.completed).length
					return (
						<NoteDaySection
							key={section.id}
							day={section.day}
							completedCount={completedCount}
							totalCount={section.items.length}
							items={section.items}
							isLatest={isLatest}
							onToggle={onToggle}
						/>
					)
				})}
			</div>
		</div>
	)
}
