// components/admin/member/WeeklyRecordCard.tsx
// 관리자용 래퍼 — AdminCardHeader + WeeklyRecordView

import type { WorkoutLog } from '@/types/database'
import AdminCardHeader from '@/components/admin/common/AdminCardHeader'
import WeeklyRecordView from '@/components/admin/ui/WeeklyRecordView'

interface WeeklyRecordCardProps {
	periodLabel: string
	totalMets: number
	logs: WorkoutLog[]
	dates: string[]
	moreLinkUrl?: string
}

export default function WeeklyRecordCard({
	periodLabel,
	totalMets,
	logs,
	dates,
	moreLinkUrl,
}: WeeklyRecordCardProps) {
	return (
		<div className=" flex flex-col gap-1 h-full">
			<div className='flex-none'>
				<AdminCardHeader title="주간 홈트 기록" actionLabel="더보기" moreLinkUrl={moreLinkUrl} />
			</div>
			<div className='flex-1 h-1'>
				<WeeklyRecordView
					periodLabel={periodLabel}
					totalMets={totalMets}
					logs={logs}
					dates={dates}
				/>
			</div>

		</div>
	)
}
