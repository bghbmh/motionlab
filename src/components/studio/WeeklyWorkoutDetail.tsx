'use client'

import { useState } from 'react'
import { WORKOUT_TYPE_LABELS, type WorkoutLog, WORKOUT_METS_BY_INTENSITY } from '@/types/database'
import WeeklyBaseDatePicker from './WeeklyBaseDatePicker'
import { createClient } from '@/lib/supabase/client'

interface MainProps {
	memberId: string                  // ← 추가: DB 저장용
	registeredAt: string
	inbodyDates: string[]
	workoutLogs: WorkoutLog[]
	initialWeekStartDate?: string     // ← 추가: DB에 저장된 기준일
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function WeeklyWorkoutDetail({
	memberId,
	registeredAt,
	inbodyDates,
	workoutLogs,
	initialWeekStartDate,
}: MainProps) {
	// DB 저장값 우선, 없으면 가입일 fallback
	const [baseDate, setBaseDate] = useState(initialWeekStartDate ?? registeredAt)
	const [saving, setSaving] = useState(false)

	async function handleBaseDateChange(date: string) {
		setBaseDate(date)
		setSaving(true)
		const supabase = createClient()
		await supabase
			.from('members')
			.update({ week_start_date: date })
			.eq('id', memberId)
		setSaving(false)
	}

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
			{/* 기준일 선택기 — 변경 시 DB 저장 */}
			<WeeklyBaseDatePicker
				registeredAt={registeredAt}
				inbodyDates={inbodyDates}
				initialWeekStartDate={baseDate}   // ← 추가 (이미 DB값으로 초기화된 state)
				onBaseDateChange={handleBaseDateChange}
			/>

			<div className="flex justify-between items-end mb-4 border-b border-white/5 pb-4">
				<div>
					<div className="flex items-center gap-2">
						<p className="ml-card-label m-0">주간 홈트 상세 기록</p>
						{/* 저장 중 표시 */}
						{saving && (
							<span className="text-[10px] font-mono animate-pulse"
								style={{ color: 'rgba(61,219,181,0.6)' }}>
								저장 중...
							</span>
						)}
					</div>
					<p className="text-[11px] text-[#3DDBB5] font-mono mt-0.5">{baseDate} 시작</p>
				</div>
				<div className="text-right">
					<p className="text-xs font-mono text-white/50">
						Total <span className="text-white text-base font-bold">{totalMets.toFixed(1)}</span> METs
					</p>
				</div>
			</div>

			<div className="flex flex-col">
				{weekDays.map(({ day, date, log, isoDate }) => (
					<div key={isoDate}
						className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
						<div className="flex gap-3 items-center w-[85px]">
							<span className={`text-xs font-bold ${day === '일' ? 'text-red-400' : 'text-white/70'}`}>
								{day}
							</span>
							<span className="text-[11px] font-mono text-white/30">
								{date.getMonth() + 1}/{date.getDate()}
							</span>
						</div>
						<div className="flex-1">
							{log ? (
								<div className="flex flex-col justify-center min-h-[37px]">
									<span className="text-sm">
										{WORKOUT_TYPE_LABELS[log.workout_type]} {log.duration_min}분
									</span>
									{log.condition_memo && (
										<p className="text-[11px] text-white/40">{log.condition_memo}</p>
									)}
								</div>
							) : (
								<div className="text-xs text-white/50 flex flex-col justify-center min-h-[37px]">
									기록 없음
								</div>
							)}
						</div>
						{log ? (
							<div className="flex flex-col justify-center gap-1 min-h-[37px]">
								{/* 출처 배지 + 운동 정보 */}
								<div className="flex items-center gap-1.5 flex-wrap">
									{/* source 배지 */}
									{log.source === 'routine' && (
										<span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
											style={{ background: 'rgba(61,219,181,0.12)', color: '#3DDBB5', border: '1px solid rgba(61,219,181,0.25)' }}>
											● 루틴
										</span>
									)}
									{log.source === 'manual' && (
										<span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
											style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
											✎ 직접
										</span>
									)}
									{log.source === 'daily' && (
										<span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
											style={{ background: 'rgba(255,179,71,0.1)', color: '#FFB347', border: '1px solid rgba(255,179,71,0.2)' }}>
											🏠 일상
										</span>
									)}
									<span className="text-sm">
										{WORKOUT_TYPE_LABELS[log.workout_type]} {log.duration_min}분
									</span>
								</div>
								{/* 컨디션 메모 */}
								{log.condition_memo && (
									<p className="text-[11px] text-white/40">{log.condition_memo}</p>
								)}
							</div>
						) : (
							<div className="text-xs text-white/50 flex flex-col justify-center min-h-[37px]">
								기록 없음
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	)
}