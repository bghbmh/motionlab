// components/admin/ui/NoteCardView.tsx
// NoteCard 원자 컴포넌트들을 조합한 완성형 — 날짜 하나의 운동 카드
// RecentNoteCard, WeekSection 등 여러 곳에서 재사용

import type { NoteWorkout, NoteTag } from '@/types/database'
import { WORKOUT_TYPE_LABELS, INTENSITY_LABELS } from '@/types/database'
import { Dot } from 'lucide-react'
import {
	NoteCard,
	NcHeader,
	ItemCounter,
	NcWorkOutList,
	NcExtraInfo,
	NceiItem,
	NcCoachMemo,
	WoItem,
	NcWorkOutTitle,
	NcKeyWord,
} from '@/components/admin/ui/NoteCard'
import {
	formatDate,
	getDayKoFull,
	getDayStatus,
	getDayKoShort,
	type DayStatus,
} from '@/lib/weekUtils'
import { Fragment } from 'react'

// ─── 날짜 상태 뱃지 ──────────────────────────────────────────────
const DAY_STATUS_BADGE: Record<DayStatus, { label: string; className: string } | null> = {
	today: { label: '오늘', className: 'bg-teal-100 text-teal-700 font-medium' },
	scheduled: { label: '예정', className: 'bg-slate-200 text-slate-600' },
	past: null,
}

// ─── Props ───────────────────────────────────────────────────────
interface NoteCardViewProps {
	/** 표시할 날짜 'YYYY-MM-DD' */
	dateStr: string
	/** 해당 날짜의 운동 처방 목록 */
	workouts: NoteWorkout[]
	/** 완료된 note_workout_id 집합 */
	completedIds: Set<string>
	/** 알림장 태그 (첫 번째 운동에만 표시) */
	tags?: NoteTag[]
}

export default function NoteCardView({
	dateStr,
	workouts,
	completedIds,
	tags = [],
}: NoteCardViewProps) {
	const dayLabel = getDayKoFull(dateStr)
	const dayStatus = getDayStatus(dateStr)
	const badge = DAY_STATUS_BADGE[dayStatus]

	const dayKo = getDayKoShort(dateStr)
	const dayWorkouts = workouts
		.filter((w) => {
			if (w.day === '전체') return true
			if (w.day.includes('-')) return w.day === dateStr  // 날짜 형식이면 직접 비교
			return w.day === dayKo                              // 요일 형식이면 요일 비교
		})
		.sort((a, b) => a.sort_order - b.sort_order)

	const completedCount = dayWorkouts.filter((w) => completedIds.has(w.id)).length


	return (
		<NoteCard>
			<NcHeader>
				<div className="flex items-center gap-2.5">
					<span className="text-neutral-900 text-xs font-medium leading-4">{formatDate(dateStr)}</span>
					<span className="text-neutral-500 text-xs font-medium leading-4">{dayLabel}</span>
					{badge && (
						<span className={`px-1.5 py-px rounded-[35px] text-xs leading-4 ${badge.className}`}>
							{badge.label}
						</span>
					)}
				</div>
				<ItemCounter completed={completedCount} total={dayWorkouts.length} />
			</NcHeader>

			<NcWorkOutList>
				{dayWorkouts.length === 0 && <div className='p-1 flex items-center justify-center h-18 text-xs text-gray-500'>등록한 운동이 없습니다</div>}
				{dayWorkouts.map((workout, i) => (
					<Fragment key={workout.id}>
						{i > 0 && <hr className="border-t border-gray-200" />}
						<WoItem>
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

							{/* 태그 — 첫 번째 운동에만 표시 */}
							{i === 0 && tags.length > 0 && (
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
}
