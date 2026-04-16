// components/admin/weekly/NotePanel.tsx

import type { Note, NoteWorkoutCompletion } from '@/types/database'
import RecentNoteCard from '@/components/admin/member/RecentNoteCard'
import Link from 'next/link'
import {
	resolveCurrentWeekDates,
	resolveDatesForWeek,
	getWeekEnd,
} from '@/lib/weekUtils'

interface NotePanelProps {
	memberId: string
	note: Note | null
	completions: NoteWorkoutCompletion[]
	/** 현재 표시 중인 주차 시작일 — RecentNoteCard 기간 표시 기준 */
	weekStart?: string,
	moreLinkUrl?: string
	onNew?: () => void  // 추가: 새 알림장 작성 버튼 클릭 시 호출되는 콜백 (예: 모달 열기)
	hasUnsentNote?: boolean
}

export default function NotePanel({ memberId, note, completions, weekStart: weekStartProp, moreLinkUrl, onNew, hasUnsentNote }: NotePanelProps) {
	if (note) {

		// weekStart prop이 있으면 그 주차 기준으로, 없으면 note.written_at 기준 자동 계산
		const { dates, weekStart, weekEnd } = weekStartProp
			? {
				dates: resolveDatesForWeek(weekStartProp, note.days),
				weekStart: weekStartProp,
				weekEnd: getWeekEnd(weekStartProp),
			}
			: resolveCurrentWeekDates(note.written_at, note.days)

		return (
			<RecentNoteCard
				note={note}
				completions={completions}
				weekStart={weekStart}
				moreLinkUrl={moreLinkUrl}
			/>
		)
	}

	return (
		<div className=" flex flex-col items-center justify-center gap-4 py-12 px-4 h-full border border-dashed bg-white border-neutral-300 rounded-2xl">
			{/* // note가 null일 때 */}
			{hasUnsentNote ? (
				<div className=" flex flex-col items-center gap-4">
					<span className="text-neutral-600 text-sm">작성한 새 알림장을 먼저 전송해야 볼 수 있어요</span>
					{moreLinkUrl && (
						<Link href={moreLinkUrl} className="flex items-center gap-1.5 px-5 py-3 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-dark transition-colors">
							알림장 탭에서 확인하기 →
						</Link>
					)}
				</div>
			) : (
				<div className=" flex flex-col items-center gap-4">
					<span className="text-neutral-600 text-sm">등록한 알림장이 없습니다</span>
					<button
						type='button'
						onClick={onNew}
						className="flex items-center gap-1.5 px-5 py-3 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-dark transition-colors"
					>
						<span className="text-base leading-none">+</span>
						새 알림장 작성
					</button>
				</div>
			)}
		</div>
	)
}
