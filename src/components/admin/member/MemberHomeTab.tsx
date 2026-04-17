// components/admin/member/MemberHomeTab.tsx
// 회원 홈 탭 컨텐츠 — InbodyCard + WeeklyRecordCard + RecentNoteCard

import type { InbodyRecord, WorkoutLog, Note, NoteWorkoutCompletion } from '@/types/database'
import { formatDate } from '@/lib/weekUtils'
import InbodyCard from '@/components/admin/member/InbodyCard'
import WeeklyRecordCard from '@/components/admin/member/WeeklyRecordCard'
import NotePanel from '@/components/admin/weekly/NotePanel'
import NotePanelWrapper from '@/components/admin/member/NotePanelWrapper'

interface MemberHomeTabProps {
	memberId: string
	latestInbody: InbodyRecord | null// 인바디
	previousInbody: InbodyRecord | null
	weekStart: string// 주간 기록
	weekEnd: string
	weekDates: string[]
	weeklyLogs: WorkoutLog[]
	totalMets: number
	// 알림장
	recentNote: Note | null
	completions: NoteWorkoutCompletion[]
	unsentNote: boolean
}

export default function MemberHomeTab({
	memberId,
	latestInbody,
	previousInbody,
	weekStart,
	weekEnd,
	weekDates,
	weeklyLogs,
	totalMets,
	recentNote,
	completions,
	unsentNote
}: MemberHomeTabProps) {


	return (
		<div className="flex flex-col gap-4 py-4">
			{/* 최근 인바디 */}

			<InbodyCard
				latestRecord={latestInbody}
				previousRecord={previousInbody ?? undefined}
				moreLinkUrl={`/studio/members/${memberId}/inbody`}
			/>


			{/* 주간 기록 + 알림장 */}
			<div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start h-auto lg:h-147 ">
				<div className='col-span-full lg:col-span-3 h-full  min-h-0 '>
					<WeeklyRecordCard
						periodLabel={`${formatDate(weekStart)} ~ ${formatDate(weekEnd)}`}
						totalMets={totalMets}
						logs={weeklyLogs}
						dates={weekDates}
						moreLinkUrl={`/studio/members/${memberId}/weekly`}
					/>
				</div>
				<div className='col-span-full lg:col-span-2 h-full  min-h-0 '>
					<NotePanelWrapper
						memberId={memberId}
						note={recentNote}
						completions={completions}
						moreLinkUrl={`/studio/members/${memberId}/notes`}
						hasUnsentNote={unsentNote}
					/>
				</div>
			</div>
		</div>
	)
}
