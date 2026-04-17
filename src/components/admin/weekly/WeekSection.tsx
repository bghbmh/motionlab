// components/admin/weekly/WeekSection.tsx

'use client'

import { useState, useEffect } from 'react'
import type { Note, NoteWorkoutCompletion, WorkoutLog } from '@/types/database'

import WeeklyRecordView from '@/components/admin/ui/WeeklyRecordView'
import NotePanel from '@/components/admin/weekly/NotePanel'
import { ChevronDown, ChevronUp } from 'lucide-react'

import WeeklyNoteCard from './WeeklyNoteCard'

import { formatDate, getWeekEnd, getWeekDates, resolveDatesForWeek } from '@/lib/weekUtils'


interface WeekSectionData {
	logs: WorkoutLog[]
	totalMets: number
	note: Note | null
	completions: NoteWorkoutCompletion[]
	nextNoteSentAt: string | null  // ← 추가
}

interface WeekSectionProps {
	memberId: string
	weekStart: string
	isOpen: boolean
	onOpen: () => void
	onToggle: () => void  // 추가
	initialData?: WeekSectionData
	hasUnsentNotes?: boolean // 추가: 미전송 알림장 존재 여부
	initialTotalMets?: number
}

export default function WeekSection({
	memberId,
	weekStart,
	isOpen,
	onOpen,
	onToggle,
	initialData,
	hasUnsentNotes = false, // 추가: 미전송 알림장 존재 여부
	initialTotalMets = 0 // 추가: 초기 METs 값
}: WeekSectionProps) {
	const [isLoading, setIsLoading] = useState(false)
	const [data, setData] = useState<WeekSectionData | null>(initialData ?? null)

	const weekEnd = getWeekEnd(weekStart)
	const weekDates = getWeekDates(weekStart)  // 기록탭용 (7일 전체)
	const noteDates = data?.note
		? (() => {
			const days = data.note.days ?? ['전체']
			if (days.includes('전체') || days.includes('매일')) return weekDates
			// 날짜 형식 ('2026-04-17')
			if (days[0]?.includes('-')) return days.filter(d => d >= weekStart && d <= weekEnd).sort()
			// 요일 형식 ('월', '화' ...)
			return resolveDatesForWeek(weekStart, days)
		})()
		: weekDates  // 알림장 날짜 (note.days → 실제 날짜로 변환, 없으면 전체 주차)


	const totalMets = data
		? data.logs.reduce((sum, l) => sum + l.mets_score * l.duration_min, 0)
		: initialTotalMets

	useEffect(() => {
		if (!isOpen || data) return

		setIsLoading(true)
		fetch(`/api/studio/members/${memberId}/weekly?weekStart=${weekStart}`)
			.then(async (res) => {
				if (!res.ok) throw new Error(`HTTP ${res.status}`)
				return res.json()
			})
			.then((json) => setData(json))
			.catch((e) => console.error('주간 데이터 로드 실패', e))
			.finally(() => setIsLoading(false))
	}, [isOpen])

	function handleHeaderClick() {
		onToggle()
	}

	return (
		<div className="flex flex-col rounded-2xl overflow-hidden border border-neutral-200 bg-white">
			<button
				type="button"
				onClick={handleHeaderClick}
				className={`w-full px-4 py-3 flex justify-between items-center   transition-colors 
					${isOpen ? 'text-primary bg-gray-200 hover:bg-gray-300' : 'text-neutral-700 bg-white hover:bg-neutral-100'}
					`}
			>
				<div className="flex items-center gap-3">
					<span className={`text-sm font-semibold ${isOpen ? 'text-primary' : 'text-neutral-700'}`}>
						{formatDate(weekStart)} ~ {formatDate(weekEnd)}
					</span>
					<span className="text-neutral-500 text-xs">
						전체 <span className="text-neutral-700 font-semibold">{totalMets.toLocaleString()}</span> METs
					</span>
				</div>
				{isOpen
					? <ChevronUp size={16} className="text-neutral-700" />
					: <ChevronDown size={16} className="text-neutral-700" />
				}
			</button>

			{isLoading && (
				<div className="w-full h-1 bg-neutral-100 overflow-hidden relative">
					<div className="absolute h-full w-2/5 bg-[#0bb489] animate-[loading_1s_ease-in-out_infinite]" />
				</div>
			)}

			{isOpen && data && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2 items-start h-auto lg:h-147  ">
					<div className='col-span-full md:col-span-2 h-full min-h-0 '>
						<WeeklyRecordView
							periodLabel={`${formatDate(weekStart)} ~ ${formatDate(weekEnd)}`}
							totalMets={data.totalMets}
							logs={data.logs}
							dates={weekDates}
							nextStartAt={data.nextNoteSentAt}
						/>
					</div>

					{/* <NotePanel
						memberId={memberId}
						note={data.note}
						completions={data.completions}
						weekStart={weekStart}
					/> */}
					<div className='col-span-full md:col-span-1 h-full min-h-0 px-2 '>
						<WeeklyNoteCard
							memberId={memberId}
							periodLabel={`${formatDate(weekStart)} ~ ${formatDate(weekEnd)}`}
							dates={noteDates}
							note={data.note}
							completions={data.completions}
							logs={data.logs}
							hasUnsentNotes={hasUnsentNotes}
							nextNoteSentAt={data.nextNoteSentAt}
						/>
					</div>

				</div>
			)}
		</div>
	)
}



