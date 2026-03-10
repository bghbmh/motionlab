// components/studio/WeeklyWorkoutDetail.tsx
'use client'

import { useState } from 'react'
import { WORKOUT_TYPE_LABELS, type WorkoutLog } from '@/types/database';
import WeeklyBaseDatePicker from './WeeklyBaseDatePicker';

// 1. 내부용 날짜 선택 컴포넌트 (이름 변경)
interface PickerProps {
	registeredAt: string
	inbodyDates: string[]
	currentBaseDate: string
	onBaseDateChange: (date: string) => void
}


// 2. 메인 상세 리스트 컴포넌트
interface MainProps {
	registeredAt: string
	inbodyDates: string[]
	workoutLogs: WorkoutLog[]
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function WeeklyWorkoutDetail({ registeredAt, inbodyDates, workoutLogs }: MainProps) {
	// 기준일 상태를 여기서 관리합니다.
	const [baseDate, setBaseDate] = useState(registeredAt)

	// 날짜 배열 계산 로직
	const startDate = new Date(baseDate)
	const weekDays = Array.from({ length: 7 }, (_, i) => {
		const d = new Date(startDate)
		d.setDate(startDate.getDate() + i)
		const iso = d.toISOString().split('T')[0]
		const dayName = DAY_LABELS[d.getDay()]
		const log = workoutLogs.find((l) => l.logged_at === iso)
		return { day: dayName, date: d, isoDate: iso, log }
	})

	const totalMets = weekDays.reduce((s, d) => s + (d.log?.mets_score ?? 0), 0)

	return (
		<div className="ml-card">
			{/* 상단에 선택기 배치 */}
			<WeeklyBaseDatePicker
				registeredAt={registeredAt}
				inbodyDates={inbodyDates}
				onBaseDateChange={setBaseDate}
			/>

			<div className="flex justify-between items-end mb-4 border-b border-white/5 pb-4">
				<div>
					<p className="ml-card-label m-0">주간 홈트 상세 기록</p>
					<p className="text-[11px] text-[#3DDBB5] font-mono mt-0.5">{baseDate} 시작</p>
				</div>
				<div className="text-right">
					<p className="text-xs font-mono text-white/50">Total <span className="text-white text-base font-bold">{totalMets.toFixed(1)}</span> METs</p>
				</div>
			</div>

			<div className="flex flex-col">
				{weekDays.map(({ day, date, log, isoDate }) => (
					<div key={isoDate} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
						<div className="flex gap-3 items-center w-[85px]">
							<span className={`text-xs font-bold ${day === '일' ? 'text-red-400' : 'text-white/70'}`}>{day}</span>
							<span className="text-[11px] font-mono text-white/30">{date.getMonth() + 1}/{date.getDate()}</span>
						</div>
						<div className="flex-1">
							{log ? (
								<div className="flex flex-col">
									<span className="text-sm">{WORKOUT_TYPE_LABELS[log.workout_type]} {log.duration_min}분</span>
									{log.condition_memo && <p className="text-[11px] text-white/40">{log.condition_memo}</p>}
								</div>
							) : (
								<span className="text-xs text-white/10 italic">기록 없음</span>
							)}
						</div>
						{log && <span className="text-xs font-mono text-[#3DDBB5]">{log.mets_score?.toFixed(1)} <small className="text-white/20">METs</small></span>}
					</div>
				))}
			</div>
		</div>
	)
}