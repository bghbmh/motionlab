'use client'
// src/components/member/NoteCard.tsx
// 알림장 탭 > 알림장 1개 카드
//
// [수정 내용]
//   - onFutureCheck prop 추가
//   - 각 섹션의 dayDate와 오늘을 비교해 isFuture 계산
//   - NoteDaySection으로 isFuture, onFutureCheck 전달

import { useState } from 'react'
import NoteDaySection from './NoteDaySection'
import type { NoteWorkoutItemData } from './NoteWorkoutItem'

export interface NoteDaySectionData {
	id: string
	day: string       // '4/7 월요일' 등
	dayDate: string   // 'YYYY-MM-DD' — isFuture 판단용
	items: NoteWorkoutItemData[]
}

export interface NoteCardData {
	id: string
	sentAt: string
	direction: string
	targetMets: number
	periodStart: string
	periodEnd: string
	daySections: NoteDaySectionData[]
}

interface Props {
	note: NoteCardData
	isLatest: boolean
	onToggle?: (workoutId: string, completed: boolean, item: NoteWorkoutItemData) => void
	onFutureCheck?: () => void  // 미래 날짜 체크 시도 시 토스트 표시
}

// 오늘 날짜 'YYYY-MM-DD' (로컬 기준)
function getTodayISO(): string {
	const d = new Date()
	const y = d.getFullYear()
	const m = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${y}-${m}-${day}`
}

export default function NoteCard({ note, isLatest, onToggle, onFutureCheck }: Props) {
	const [expanded, setExpanded] = useState(isLatest)

	const today = getTodayISO()

	const totalItems = note.daySections.reduce((s, sec) => s + sec.items.length, 0)
	const completedItems = note.daySections.reduce(
		(s, sec) => s + sec.items.filter(i => i.completed).length, 0
	)

	return (
		<div className="bg-white rounded-[16px] w-full">
			<div className="flex flex-col gap-[8px] px-[16px] py-[12px] w-full">

				{/* 카드 헤더 */}
				<div
					className="flex items-center justify-between pb-[8px] w-full border-b border-[#f0f0f0]"
					onClick={() => !isLatest && setExpanded(prev => !prev)}
					style={{ cursor: isLatest ? 'default' : 'pointer' }}
				>
					{isLatest && (
						<span className="text-xs font-bold text-primary">
							{note.periodStart}
						</span>
					)}

					{!isLatest && (
						<div className="flex items-center gap-[8px] flex-1 text-neutral-500">
							<span className="text-xs font-bold font-mono">
								{note.periodStart} ~ {note.periodEnd}
							</span>
							<span className="text-xs font-semibold font-mono pl-3 text-neutral-400">
								({completedItems}/{totalItems})
							</span>
						</div>
					)}

					{!isLatest && (
						expanded ? (
							<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
								<path d="M3 9l4-4 4 4" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						) : (
							<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
								<path d="M3 5l4 4 4-4" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						)
					)}
				</div>

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

						{/* 요일별 섹션 */}
						{note.daySections.map((section) => {
							// dayDate가 오늘보다 미래면 체크 불가
							const isFuture = section.dayDate > today
							const completedCount = section.items.filter(i => i.completed).length

							return (
								<NoteDaySection
									key={section.id}
									day={section.day}
									completedCount={completedCount}
									totalCount={section.items.length}
									items={section.items}
									isLatest={isLatest}
									isFuture={isFuture}
									onToggle={onToggle}
									onFutureCheck={onFutureCheck}
								/>
							)
						})}
					</>
				)}
			</div>
		</div>
	)
}
