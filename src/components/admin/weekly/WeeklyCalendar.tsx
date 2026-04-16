// components/admin/weekly/WeeklyCalendar.tsx
// 가로 스크롤 달력 — embla-carousel-react 사용
// 날짜 클릭 → 해당 주차 섹션 열기

'use client'

import { useEffect, useMemo } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { parseLocalDate, toLocalISO, isSameWeek } from '@/lib/weekUtils'

interface CalendarDay {
	date: string        // 'YYYY-MM-DD'
	day: number         // 1~31
	monthLabel?: string // 월이 바뀌는 날에만 표시 ('2월', '3월')
	isSunday: boolean
	isToday: boolean
	hasLog: boolean     // 운동 기록 있는 날
}

interface WeeklyCalendarProps {
	baseDate: string // 등록일 기준 첫 날짜 
	today: string // 오늘 날짜 'YYYY-MM-DD' 
	loggedDates: string[] //운동 기록이 있는 날짜 목록 
	openedWeeks: string[] //현재 열린 주차 시작일들
	onDateClick: (weekStart: string) => void //날짜 클릭 시 콜백 — 해당 날짜가 속한 weekStart 전달
}

export default function WeeklyCalendar({
	baseDate,
	today,
	loggedDates,
	openedWeeks,
	onDateClick,
}: WeeklyCalendarProps) {
	const [emblaRef, emblaApi] = useEmblaCarousel({
		dragFree: true,
		containScroll: 'keepSnaps',
		align: 'start',
	})

	const loggedSet = useMemo(() => new Set(loggedDates), [loggedDates])

	// ✅ useMemo로 클라이언트에서만 날짜 목록 계산 — hydration 불일치 방지
	const days = useMemo<CalendarDay[]>(() => {
		const result: CalendarDay[] = []
		// 변경 후 — baseDate와 (오늘 - 60일) 중 더 이른 날짜
		const registeredDate = parseLocalDate(baseDate)
		const twoMonthsAgo = parseLocalDate(today)
		twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60)
		const start = registeredDate < twoMonthsAgo ? registeredDate : twoMonthsAgo
		const end = parseLocalDate(today)
		end.setDate(end.getDate() + 60) // 오늘로부터 2달 뒤까지 표시 (미래 날짜는 월 레이블만 보임)

		let prevMonth = -1
		const cursor = new Date(start)
		while (cursor <= end) {
			const dateStr = toLocalISO(cursor)
			const month = cursor.getMonth()

			// 다음 날의 월 확인
			const nextDay = new Date(cursor)
			nextDay.setDate(nextDay.getDate() + 1)
			const nextMonth = nextDay.getMonth()

			// 월 레이블 조건:
			// 다음 달 1일 → 해당 달 레이블 표시
			// 오늘 → 현재 달 레이블 표시
			// 직전 달 마지막 날 → 직전 달 레이블 표시
			const isLastDayOfMonth = nextMonth !== month
			const isFirstDayOfMonth = cursor.getDate() === 1
			const monthLabel =
				dateStr === today
					// 오늘 → 현재 달 레이블
					? `${month + 1}월` : isFirstDayOfMonth && toLocalISO(cursor) > today
						// 미래의 1일 → 해당 달 레이블
						? `${month + 1}월` : isLastDayOfMonth && toLocalISO(nextDay) <= today
							// 직전 달 마지막 날 → 현재 달 레이블
							? `${month + 1}월` : undefined

			result.push({
				date: dateStr,
				day: cursor.getDate(),
				monthLabel,
				isSunday: cursor.getDay() === 0,
				isToday: dateStr === today,
				hasLog: loggedSet.has(dateStr),
			})

			cursor.setDate(cursor.getDate() + 1)
		}
		return result
	}, [baseDate, today, loggedSet])

	// 오늘 날짜로 스크롤 — 마운트 시 1회
	useEffect(() => {
		if (!emblaApi) return
		const todayIndex = days.findIndex((d) => d.date === today)
		if (todayIndex > 0) {
			emblaApi.scrollTo(Math.max(0, todayIndex - 3), false)
		}
	}, [emblaApi])

	// 클릭한 날짜가 속한 주차 시작일 계산
	function getWeekStartForDate(dateStr: string): string {
		const base = parseLocalDate(baseDate)
		const target = parseLocalDate(dateStr)
		base.setHours(0, 0, 0, 0)
		target.setHours(0, 0, 0, 0)
		const daysSinceBase = Math.floor(
			(target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)
		)
		const weeksElapsed = Math.floor(Math.max(0, daysSinceBase) / 7)
		const weekStart = parseLocalDate(baseDate)
		weekStart.setDate(weekStart.getDate() + weeksElapsed * 7)
		return toLocalISO(weekStart)
	}

	return (
		<div className="w-full  py-2">
			<div className="overflow-hidden " ref={emblaRef}>
				<div className="flex items-end gap-0 select-none ">
					{days.map((d) => {
						const weekStart = getWeekStartForDate(d.date)
						const isInOpenedWeek = openedWeeks.some((ws) => isSameWeek(d.date, ws))
						return (
							<button
								key={d.date}
								type="button"
								onClick={() => onDateClick(weekStart)}
								className="relative flex flex-col items-center min-w-[36px] gap-0.5"
							>
								{/* 월 레이블 */}

								{d.monthLabel && <span className="text-[11px] font-medium  bg-sky-50 text-sky-500 rounded-3xl whitespace-nowrap border border-sky-300 inlineflex -mb-1 "
									style={{
										lineHeight: 1,
										padding: '0.25em 0.5em',
										zIndex: 2
									}}>{d.monthLabel} </span>}


								{/* 날짜 원 */}
								<div className='bg-white px-1 pt-1.5 pb-3 '>
									<div className={`
										w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors
										${d.isToday
											? 'bg-sky-500 text-white'
											: isInOpenedWeek
												? 'bg-neutral-100 text-neutral-900'
												: 'text-neutral-500'
										}
										${d.isSunday && !d.isToday ? 'text-red-400' : ''}
									`}>
										{d.day}
									</div>
								</div>


								{/* 운동 기록 점 */}
								<div className={`w-1 h-1  rounded-full ${d.hasLog ? 'bg-sky-500' : 'bg-transparent'}`} style={{
									transform: 'translateY(-0.6rem)'
								}} />
							</button>
						)
					})}
				</div>
			</div>
		</div>
	)
}
