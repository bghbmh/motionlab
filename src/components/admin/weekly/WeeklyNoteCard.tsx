// components/admin/member/RecentNoteCard.tsx

import type { WorkoutLog } from '@/types/database'
import { WORKOUT_TYPE_LABELS, INTENSITY_LABELS, Note, NoteWorkoutCompletion } from '@/types/database'
import { formatDate } from '@/lib/weekUtils'

import Link from 'next/link'
import SendStatus from '@/components/admin/ui/SendStatus'
import { DescriptionList } from '@/components/admin/ui/NoteCard'
import NoteCardView from '@/components/admin/ui/NoteCardView'

interface WeeklyNoteCardProps {
	memberId: string
	dates: string[]
	periodLabel: string
	note: Note | null
	logs: WorkoutLog[]
	completions: NoteWorkoutCompletion[]
	hasUnsentNotes?: boolean // 추가: 미전송 알림장 존재 여부
	nextNoteSentAt?: string | null  // ← 추가
}

export default function WeeklyNoteCard({
	memberId,
	note,
	dates,
	periodLabel,
	logs,
	completions,
	hasUnsentNotes = false,
	nextNoteSentAt = null,  // ← 추가
}: WeeklyNoteCardProps) {

	if (!note) {
		return (
			<div className="h-full flex flex-col items-center justify-center
			 bg-neutral-50 border border-neutral-200 border-dashed rounded-2xl gap-4 py-12 px-4">
				{hasUnsentNotes ? (
					<div className=" flex flex-col items-center gap-4">
						<span className="text-neutral-600 text-sm">작성한 새 알림장을 먼저 전송해야 볼 수 있어요</span>
						<Link href={`/studio/members/${memberId}/notes`} className="flex items-center gap-1.5 px-5 py-3 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-dark transition-colors">
							알림장 탭에서 확인하기 →
						</Link>
					</div>
				) : (
					<>
						<span className="text-neutral-400 text-sm">등록된 알림장이 없습니다</span>
						<Link
							href={`/studio/members/${memberId}/notes/new`}
							className="flex items-center gap-1.5 px-5 py-3 bg-[#0bb489] text-white text-sm font-medium rounded-full hover:bg-[#09a07a] transition-colors"
						>
							<span className="text-base leading-none">+</span>
							새 알림장 작성
						</Link>
					</>

				)}
			</div >
		)
	}

	const workouts = note.note_workouts ?? []
	const tags = note.note_tags ?? []

	const completedIds = new Set(completions.map((c) => `${c.note_workout_id}_${c.completed_date}`))
	const sentLabel = formatDate(note.written_at)

	return (
		<div className="py-3 bg-neutral-50 rounded-2xl h-full flex flex-col gap-2">
			{/* 현재 주차 기간 + 전송일 + 전송 상태 */}
			<div className="pb-1 px-4 flex-none flex justify-between items-center">
				<span className="text-gray-600 text-xs font-semibold leading-4">
					{periodLabel}
				</span>
				<div className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-[10px]">
					<span className="text-neutral-400 text-xs leading-4">{sentLabel}</span>
					{note && <SendStatus done={note.is_sent} />}
				</div>
			</div>

			{/* 알림장 내용 요약 */}
			<div className="flex-none px-2 py-1 mx-4 border-l-[3px] border-neutral-300 flex flex-col gap-1">
				<span className="text-neutral-700 text-xs leading-4">{note.content}</span>
				<DescriptionList items={[
					{ label: '목표 -', value: `${note.recommended_mets} METs` },
					{ label: '기간 -', value: `${periodLabel}` },
				]} />
			</div>

			{/* 요일별 운동 카드 */}
			<div className='px-4 overflow-y-auto'>
				{dates.map((dateStr, idx) => {
					const isReplaced = nextNoteSentAt !== null && dateStr >= nextNoteSentAt
					return (
						<div
							className={`mb-3 ${isReplaced ? 'opacity-40' : ''}`}
							key={`${dateStr}-${idx}`}
						>
							{isReplaced && (
								<p className="text-xs text-neutral-400 mb-1">새 알림장으로 대체됨</p>
							)}
							<NoteCardView
								dateStr={dateStr}
								workouts={workouts}
								completedIds={completedIds}
								tags={tags}
							/>
						</div>
					)
				})}
			</div>

		</div>
	)
}