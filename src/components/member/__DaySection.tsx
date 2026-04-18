// src/components/member/DaySection.tsx

import type { WorkoutLog } from '@/types/database'
import WorkoutLogItem from './WorkoutLogItem'

interface DaySectionProps {
	date: string              // 'YYYY-MM-DD'
	totalDurationMin: number
	totalMets: number
	logs: WorkoutLog[]
	onEdit: (log: WorkoutLog) => void
	onDelete: (log: WorkoutLog) => void
}

export function DaySection({
	date,
	totalDurationMin,
	totalMets,
	logs,
	onEdit,
	onDelete,
}: DaySectionProps) {
	return (
		<div>
			{/* 날짜 헤더 */}
			<div className="flex items-center justify-between px-2">
				<span className="text-sm font-medium text-neutral-900">{date}</span>
				<div className="flex items-center gap-2 m-sublabel text-sm">
					<span>⏱ {totalDurationMin}분</span>
					<span>•</span>
					<span>{totalMets} METs</span>
				</div>
			</div>

			{/* 운동 목록 */}
			<div className="flex flex-col gap-2 pt-1">
				{logs.map((log) => (
					<WorkoutLogItem
						key={log.id}
						log={log}
						onEdit={onEdit}
						onDelete={onDelete}
					/>
				))}
			</div>
		</div>
	)
}
