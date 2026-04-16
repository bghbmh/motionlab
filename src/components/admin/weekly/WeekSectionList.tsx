// components/admin/weekly/WeekSectionList.tsx

'use client'

import { useState, useRef } from 'react'
import type { Note, NoteWorkoutCompletion, WorkoutLog } from '@/types/database'
import WeeklyCalendar from '@/components/admin/weekly/WeeklyCalendar'
import WeekSection from '@/components/admin/weekly/WeekSection'

interface CurrentWeekData {
	logs: WorkoutLog[]
	totalMets: number
	note: Note | null
	completions: NoteWorkoutCompletion[]
	nextNoteSentAt: string | null  // ← 추가
}

interface WeekSectionListProps {
	memberId: string
	baseDate: string
	today: string
	currentWeekStart: string
	currentWeekData: CurrentWeekData
	loggedDates: string[]
	/** 서버에서 계산한 전체 주차 목록 (최신순) */
	allWeeks: string[]
	unsentNoteCount?: number // 추가: 미전송 알림장 개수
	weekMetsMap: Record<string, number> // 추가: 주차별 METs 맵
}

export default function WeekSectionList({
	memberId,
	baseDate,
	today,
	currentWeekStart,
	currentWeekData,
	loggedDates,
	allWeeks,
	unsentNoteCount = 0,
	weekMetsMap
}: WeekSectionListProps) {
	const [openedWeeks, setOpenedWeeks] = useState<Set<string>>(
		new Set([currentWeekStart])
	)

	const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

	function openWeek(weekStart: string) {
		setOpenedWeeks((prev) => {
			if (prev.has(weekStart)) return prev
			return new Set([...prev, weekStart])
		})
	}

	function toggleWeek(weekStart: string) {
		setOpenedWeeks((prev) => {
			const next = new Set(prev)
			if (next.has(weekStart)) {
				next.delete(weekStart)  // 열려있으면 닫기
			} else {
				next.add(weekStart)     // 닫혀있으면 열기
			}
			return next
		})
	}

	function handleDateClick(weekStart: string) {
		openWeek(weekStart)
		setTimeout(() => {
			sectionRefs.current[weekStart]?.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			})
		}, 100)
	}

	console.log('allWeeks 00:', allWeeks)

	return (
		<div className="flex flex-col pt-0 pb-4">
			<WeeklyCalendar
				baseDate={baseDate}
				today={today}
				loggedDates={loggedDates}
				openedWeeks={[...openedWeeks]}
				onDateClick={handleDateClick}
			/>

			<div className="flex flex-col gap-3 ">
				{allWeeks.map((weekStart, idx) => {
					const isCurrentWeek = weekStart === currentWeekStart
					const isOpen = openedWeeks.has(weekStart)

					return (
						<div
							key={`${weekStart}-${idx}`}
							ref={(el) => { sectionRefs.current[weekStart] = el }}
						>
							<WeekSection
								memberId={memberId}
								weekStart={weekStart}
								isOpen={isOpen}
								onOpen={() => openWeek(weekStart)}
								onToggle={() => toggleWeek(weekStart)}  // 추가
								initialData={isCurrentWeek ? currentWeekData : undefined}
								hasUnsentNotes={unsentNoteCount > 0} // 추가: 현재 주차에 한해 미전송 알림장 개수 전달
								initialTotalMets={weekMetsMap[weekStart] ?? 0}  // 추가
							/>
						</div>
					)
				})}
			</div>
		</div>
	)
}
