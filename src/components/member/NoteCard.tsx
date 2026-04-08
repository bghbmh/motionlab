'use client'
// src/components/member/NoteCard.tsx
// 알림장 탭 > 알림장 1개 카드
// isLatest: true  → 펼쳐진 상태 고정 (스위치 활성)
// isLatest: false → 드롭다운 (접힘/펼침 토글), 접힌 상태에서 [기간] 완료 n/n 표시

import { useState } from 'react'
import NoteDaySection from './NoteDaySection'
import type { NoteWorkoutItemData } from './NoteWorkoutItem'

export interface NoteDaySectionData {
	id: string
	day: string                    // '4/7 월요일' 등
	items: NoteWorkoutItemData[]
}

export interface NoteCardData {
	id: string
	sentAt: string                 // 'YYYY-MM-DD'
	direction: string
	targetMets: number
	periodStart: string            // 'YY.MM.DD'
	periodEnd: string              // 'YY.MM.DD'
	daySections: NoteDaySectionData[]
}

interface Props {
	note: NoteCardData
	isLatest: boolean
	onToggle?: (workoutId: string, completed: boolean, item: NoteWorkoutItemData) => void
}

export default function NoteCard({ note, isLatest, onToggle }: Props) {
	// 과거 카드는 기본 접힘, 현재 카드는 항상 펼침
	const [expanded, setExpanded] = useState(isLatest)

	// 전체 완료 개수 계산
	const totalItems = note.daySections.reduce((s, sec) => s + sec.items.length, 0)
	const completedItems = note.daySections.reduce(
		(s, sec) => s + sec.items.filter(i => i.completed).length, 0
	)

	return (
		<div className="bg-white rounded-[16px] w-full">
			<div className="flex flex-col gap-[8px] px-[16px] py-[12px] w-full">

				{/* 카드 헤더 — 클릭 시 토글 (과거 카드만) */}
				<div
					className="flex items-center justify-between pb-[8px] w-full border-b border-[#f0f0f0]"
					onClick={() => !isLatest && setExpanded(prev => !prev)}
					style={{ cursor: isLatest ? 'default' : 'pointer' }}
				>
					{isLatest && <span
						className="text-xs font-bold text-primary"
					>
						{note.periodStart}
					</span>}


					{/* 접힌 상태: 기간 + 완료 개수 표시 */}
					{!isLatest && (
						<div className="flex items-center gap-[8px] flex-1 text-neutral-500">
							<span className="text-xs font-bold font-mono ">
								{note.periodStart} ~ {note.periodEnd}
							</span>
							<span className="text-xs font-semibold font-mono pl-3 text-neutral-400" >
								{/* 완료 */} ({completedItems}/{totalItems})
							</span>
						</div>
					)}

					{/* 펼친 상태 (과거 카드): 접기 아이콘 */}
					{!isLatest && (
						expanded ? (
							<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
								<path d="M3 9l4-4 4 4" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						) : (<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
							<path d="M3 5l4 4 4-4" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
						</svg>)
					)}
				</div>

				{/* 펼쳐진 상태일 때만 상세 내용 표시 */}
				{expanded && (
					<>
						{/* 운동 방향 */}
						<div
							className="relative flex flex-col gap-[4px] px-[8px] py-[4px] w-full"
							style={{ borderLeft: '3px solid #d4d4d4' }}
						>
							<p className="text-[12px] text-[#404040]">{note.direction}</p>
							<div className="flex items-center gap-[4px] text-[12px]">
								<span className="text-[#737373]">목표 -</span>
								<span className="font-semibold text-[#404040]">{note.targetMets}</span>
								<span className="text-[#737373]">METs</span>
							</div>
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
					</>
				)}
			</div>
		</div>
	)
}
