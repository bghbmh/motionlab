// components/admin/ui/WeeklyRecordView.tsx
// 순수 데이터 표시 컴포넌트 — 기간 + METs + 날짜별 기록
// WeeklyRecordCard, WeekSection 등 여러 곳에서 재사용

import type { WorkoutLog } from '@/types/database'
import { WORKOUT_TYPE_LABELS, INTENSITY_LABELS } from '@/types/database'
import WorkoutRecordItem from '@/components/admin/member/WorkoutRecordItem'
import { formatDate, formatDateShort } from '@/lib/weekUtils'
import { Fragment } from 'react'

// 'YYYY-MM-DD' → 요일 한 글자
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
function getDayLabel(dateStr: string): { label: string; isSunday: boolean } {
	const day = new Date(dateStr).getDay()
	return { label: DAY_LABELS[day], isSunday: day === 0 }
}

// WorkoutLog.source → WorkoutRecordItem의 type prop으로 변환
function toRecordType(source: WorkoutLog['source']): 'note' | 'direct' | 'daily' {
	if (source === 'routine') return 'note'
	if (source === 'manual') return 'direct'
	return 'daily'
}

interface WeeklyRecordViewProps {
	periodLabel: string
	totalMets: number
	logs: WorkoutLog[]
	dates: string[]
	nextStartAt?: string | null  // ← 추가
}

export default function WeeklyRecordView({
	periodLabel,
	totalMets,
	logs,
	dates,
	nextStartAt = null,
}: WeeklyRecordViewProps) {
	// 날짜별로 logs 그룹핑
	const logsByDate = logs.reduce<Record<string, WorkoutLog[]>>((acc, log) => {
		if (!acc[log.logged_at]) acc[log.logged_at] = []
		acc[log.logged_at].push(log)
		return acc
	}, {})

	return (
		<div className="py-3 bg-white rounded-2xl flex flex-col h-full ">
			{/* 기간 + 총 METs */}
			<div className="px-4 pb-2 flex justify-between items-center flex-none ">
				<span className="text-gray-700 text-xs font-medium leading-4">{periodLabel}</span>
				<div className="flex items-center gap-1">
					<span className="text-neutral-500 text-xs leading-4">전체</span>
					<span className="text-neutral-700 text-xs font-semibold leading-4">{totalMets.toLocaleString()}</span>
					<span className="text-neutral-500 text-xs leading-4">METs</span>
				</div>
			</div>

			{/* 일별 기록 */}
			<div className="px-4 flex-1 h-1 flex flex-col overflow-auto">
				{dates.map((dateStr) => {
					const { label: dayLabel, isSunday } = getDayLabel(dateStr)
					const dayLogs = logsByDate[dateStr] ?? []
					const isReplaced = nextStartAt !== null && dateStr >= nextStartAt  // ← 추가


					return (
						<div key={dateStr} className={`border-t border-gray-200 flex items-center ${isReplaced ? 'opacity-50' : ''}`}>
							{/* 대체됨 표시 — 날짜 위에 */}

							{/* 날짜 */}
							<div className="min-w-10 pl-2 pr-4 py-2 flex flex-col items-center justify-center shrink-0">
								<span className="text-neutral-600 text-xs font-medium leading-4 min-w-8 text-center">
									{formatDateShort(dateStr)}
								</span>
								<span className={`text-xs font-medium leading-4  ${isSunday ? 'text-red-500' : 'text-neutral-500'}`}>
									{dayLabel}
								</span>
							</div>



							{/* 운동 기록 또는 기록없음 */}
							<div className="flex-1 py-2 flex flex-col overflow-y-auto relative">
								{isReplaced && dateStr === nextStartAt && (
									<div className="absolute h-[80%] w-full flex items-center justify-center text-xs bg-neutral-200 text-neutral-900 ">{dateStr}부터 새 알림장으로 대체되었습니다</div>
								)}

								{dayLogs.length === 0 ? (
									<div className="h-14 min-h-14 px-2 py-1 bg-white rounded-2xl flex items-center">
										<span className="text-neutral-500 text-xs leading-4">기록없음</span>
									</div>
								) : (
									dayLogs.map((log, idx) => (
										<Fragment key={log.id}>
											{idx > 0 && <hr key={`hr-${log.id}`} className="border-t border-dashed border-gray-200 my-1" />}
											<WorkoutRecordItem
												type={toRecordType(log.source)}
												name={WORKOUT_TYPE_LABELS[log.workout_type]}
												intensity={log.intensity ? INTENSITY_LABELS[log.intensity] : '일반'}
												duration={`${log.duration_min}분`}
												originalDuration={
													log.prescribed_duration_min &&
														log.prescribed_duration_min !== log.duration_min
														? `${log.prescribed_duration_min}분`
														: undefined
												}
												mets={Math.round(log.mets_score * log.duration_min)}
												memo={log.condition_memo ?? undefined}
											/>
										</Fragment>

									))
								)}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
