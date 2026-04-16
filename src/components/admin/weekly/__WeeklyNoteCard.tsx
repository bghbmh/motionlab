// components/admin/member/RecentNoteCard.tsx

import type { Note, NoteWorkoutCompletion } from '@/types/database'
import { WORKOUT_TYPE_LABELS, INTENSITY_LABELS } from '@/types/database'
import AdminCardHeader from '@/components/admin/common/AdminCardHeader'
import { Dot } from 'lucide-react'
import SendStatus from '@/components/admin/ui/SendStatus'
import {
	NoteCardContainer,
	DescriptionList,
	NoteCard, NcHeader, ItemCounter,
	NcWorkOutList, NcExtraInfo, NceiItem,
	NcCoachMemo, WoItem, NcWorkOutTitle, NcKeyWord,
	NcCoachDirection
} from '@/components/admin/ui/NoteCard'
import {
	formatDate,
	getDayKoFull,
	getDayKoShort,
	getDayStatus,
	resolveCurrentWeekDates,
	resolveDatesForWeek,
	getWeekEnd,
	type DayStatus,
} from '@/lib/weekUtils'
import { Fragment } from 'react'


// ─── UI 전용 — 알림장에만 쓰는 상수 ────────────────────────────
const DAY_STATUS_BADGE: Record<DayStatus, { label: string; className: string } | null> = {
	today: { label: '오늘', className: 'bg-sky-500 text-sky-50 font-semibold' },
	scheduled: { label: '예정', className: 'bg-slate-200 text-slate-600' },
	past: null,
}

// ─── Props ───────────────────────────────────────────────────────
interface RecentNoteCardProps {
	note: Note
	completions: NoteWorkoutCompletion[]
	/**
	 * 외부에서 주차 기준을 지정할 때 사용 (WeekSection에서 전달)
	 * 없으면 note.written_at 기준으로 현재 주차 자동 계산
	 */
	weekStart?: string
}

export default function WeeklyNoteCard({ note, completions, weekStart: weekStartProp }: RecentNoteCardProps) {
	const workouts = note.note_workouts ?? []
	const tags = note.note_tags ?? []

	const completedIds = new Set(completions.map((c) => c.note_workout_id))

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
		<div className="w-96 flex flex-col gap-1">

			<div className="px-4 py-3 bg-neutral-50 rounded-2xl flex flex-col gap-2">
				{/* 현재 주차 기간 + 전송일 + 전송 상태 */}
				<div className="pb-1 flex justify-between items-center">
					<span className="text-gray-600 text-xs font-semibold leading-4">
						{periodLabel}
					</span>
					<div className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-[10px]">
						<span className="text-neutral-400 text-xs leading-4">{sentLabel}</span>
						<SendStatus done={note.is_sent} />
					</div>
				</div>

				{/* 알림장 내용 요약 */}
				<div className="w-80 px-2 py-1 border-l-[3px] border-neutral-300 flex flex-col gap-1">
					<NcCoachDirection direction={note.content} />
					<DescriptionList items={[
						{ label: '목표 -', value: `${note.recommended_mets} METs` },
						{ label: '기간 -', value: periodLabel },
					]} />
				</div>

				{/* 요일별 운동 목록 */}
				<NoteCardContainer className='max-h-[40vh]'>
					{dates.map((dateStr) => {
						const dayLabel = getDayKoFull(dateStr)
						const dayStatus = getDayStatus(dateStr)
						const badge = DAY_STATUS_BADGE[dayStatus]

						const dayKo = getDayKoShort(dateStr)
						const dayWorkouts = workouts
							.filter((w) => w.day === dayKo || w.day === '전체')
							.sort((a, b) => a.sort_order - b.sort_order)

						const completedCount = dayWorkouts.filter((w) => completedIds.has(w.id)).length

						return (
							<NoteCard key={dateStr}>
								<NcHeader>
									<div className="flex items-center gap-2.5">
										<span className="text-neutral-900 text-xs font-medium leading-4">{formatDate(dateStr)}</span>
										<span className="text-neutral-500 text-xs font-medium leading-4">{dayLabel}</span>
										{/** 오늘, 예정 상태 */}
										{badge && (
											<span className={`px-1.5 py-px rounded-[35px] text-xs leading-4 ${badge.className}`}>
												{badge.label}
											</span>
										)}
									</div>
									<ItemCounter completed={completedCount} total={dayWorkouts.length} />
								</NcHeader>

								<NcWorkOutList>
									{dayWorkouts.map((workout, i) => (
										<Fragment key={workout.id}>
											{i > 0 && <hr className="border-t border-gray-200" />}
											<WoItem key={workout.id}>
												<NcWorkOutTitle
													type={WORKOUT_TYPE_LABELS[workout.workout_type]}
													status={completedIds.has(workout.id)}
												/>

												{workout.coach_memo && (
													<NcCoachMemo memo={workout.coach_memo} />
												)}

												<NcExtraInfo>
													<NceiItem info={INTENSITY_LABELS[workout.intensity]} />
													<Dot size={16} className="text-gray-400" />
													<NceiItem info={`${workout.duration_min}분`} />
													<Dot size={16} className="text-gray-400" />
													<NceiItem info={`${workout.mets} METs`} />
												</NcExtraInfo>

												{tags.length > 0 && (
													<div className="flex items-center gap-0.5 flex-wrap">
														{tags.map((tag) => (
															<NcKeyWord key={tag.id} word={tag.tag} />
														))}
													</div>
												)}
											</WoItem>
										</Fragment>
									))}
								</NcWorkOutList>
							</NoteCard>
						)
					})}
				</NoteCardContainer>

			</div>
		</div>
	)
}
