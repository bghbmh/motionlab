// components/admin/member/RecentNoteCard.tsx

import type { Note, NoteWorkoutCompletion } from '@/types/database'
import AdminCardHeader from '@/components/admin/common/AdminCardHeader'
import SendStatus from '@/components/admin/ui/SendStatus'
import { DescriptionList } from '@/components/admin/ui/NoteCard'
import NoteCardView from '@/components/admin/ui/NoteCardView'
import {
	formatDate,
	getDayStatus,
	resolveCurrentWeekDates,
	resolveDatesForWeek,
	getWeekEnd,
} from '@/lib/weekUtils'

// ─── Props ───────────────────────────────────────────────────────
interface RecentNoteCardProps {
	note: Note
	completions: NoteWorkoutCompletion[]
	/**
	 * 외부에서 주차 기준을 지정할 때 사용 (WeekSection에서 전달)
	 * 없으면 note.written_at 기준으로 현재 주차 자동 계산
	 */
	weekStart?: string
	moreLinkUrl?: string
}

export default function RecentNoteCard({
	note,
	completions,
	weekStart: weekStartProp,
	moreLinkUrl,
}: RecentNoteCardProps) {
	const workouts = note.note_workouts ?? []
	const tags = note.note_tags ?? []

	const completedIds = new Set(completions.map((c) => `${c.note_workout_id}_${c.completed_date}`))

	// weekStart prop이 있으면 그 주차 기준으로, 없으면 note.written_at 기준 자동 계산
	const { dates, weekStart, weekEnd } = weekStartProp
		? {
			dates: resolveDatesForWeek(weekStartProp, note.days),
			weekStart: weekStartProp,
			weekEnd: getWeekEnd(weekStartProp),
		}
		: resolveCurrentWeekDates(note.written_at, note.days)

	const periodLabel = `${formatDate(weekStart)} ~ ${formatDate(weekEnd)}`
	const sentLabel = formatDate(note.written_at)

	return (
		<div className=" flex flex-col gap-1">
			<AdminCardHeader title="최근 알림장" actionLabel="전체보기" moreLinkUrl={moreLinkUrl} />

			<div className=" py-3 bg-white rounded-2xl flex flex-col gap-2">
				{/* 기간 + 전송일 + 전송 상태 */}
				<div className="pb-1 px-4 flex justify-between items-center">
					<span className="text-gray-600 text-xs font-semibold leading-4">
						{periodLabel}
					</span>
					<div className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-[10px]">
						<span className="text-neutral-400 text-xs leading-4">{sentLabel}</span>
						<SendStatus done={note.is_sent} />
					</div>
				</div>

				{/* 알림장 내용 요약 */}
				<div className=" px-2 mx-4 py-1 border-l-[3px] border-neutral-300 flex flex-col gap-1">
					<span className="text-neutral-700 text-xs leading-4">{note.content}</span>
					<DescriptionList items={[
						{ label: '목표 -', value: `${note.recommended_mets} METs` },
						{ label: '기간 -', value: periodLabel },
					]} />
				</div>

				{/* 요일별 운동 카드 */}
				<div className='max-h-[30vh] px-4 overflow-y-auto '>
					{dates.map((dateStr, idx) => (
						<div className='mb-3' key={`${dateStr}-${idx}`}>
							<NoteCardView
								key={dateStr}
								dateStr={dateStr}
								workouts={workouts}
								completedIds={completedIds}
								tags={tags}
							/>
						</div>

					))}
				</div>

			</div>
		</div>
	)
}
