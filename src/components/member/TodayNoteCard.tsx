'use client'
// src/components/member/TodayNoteCard.tsx

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { WORKOUT_TYPE_METS } from '@/types/database'
import type { NoteWorkout, CompletedLog } from '@/types/database'
import TodayNoteCardItem from './TodayNoteCardItem'
import WorkoutCompleteModal from './WorkoutCompleteModal'
import EmptyState from './ui/EmptyState'


interface Props {
	memberId: string
	token: string
	noteWorkouts: NoteWorkout[]
	completedLogs: CompletedLog[]
	today: string
	hasNote: boolean
}

export default function TodayNoteCard({
	memberId,
	token,
	noteWorkouts,
	completedLogs,
	today,
	hasNote,
}: Props) {
	const router = useRouter()
	const todayDayLabel = ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()]

	const [completedMap, setCompletedMap] = useState<Map<string, CompletedLog>>(
		new Map(completedLogs.map(l => [l.note_workout_id, l]))
	)
	const [modalTarget, setModalTarget] = useState<NoteWorkout | null>(null)

	const totalCount = noteWorkouts.length
	const completedCount = noteWorkouts.filter(w => completedMap.has(w.id)).length

	const handleDone = useCallback(
		async (durationMin: number, prescribedMin: number, conditionMemo: string) => {
			if (!modalTarget) return
			const supabase = createClient()
			const { data: inserted } = await supabase
				.from('workout_logs')
				.insert({
					member_id: memberId,
					logged_at: today,
					workout_type: modalTarget.workout_type,
					duration_min: durationMin,
					prescribed_duration_min: prescribedMin,
					mets_score: WORKOUT_TYPE_METS[modalTarget.workout_type],
					condition_memo: conditionMemo || null,
					source: 'routine',
					note_workout_id: modalTarget.id,
					activity_type: null,
				})
				.select('id')
				.single()

			if (inserted) {
				setCompletedMap(prev => new Map([...prev, [modalTarget.id, {
					note_workout_id: modalTarget.id,
					log_id: inserted.id,
					duration_min: durationMin,
					prescribed_duration_min: prescribedMin,
					mets_score: WORKOUT_TYPE_METS[modalTarget.workout_type],
				}]]))
				router.refresh()
			}
		},
		[modalTarget, memberId, today, router]
	)

	async function handleUndo(workout: NoteWorkout) {
		const log = completedMap.get(workout.id)
		if (!log) return
		const supabase = createClient()
		await supabase.from('workout_logs').delete().eq('id', log.log_id)
		setCompletedMap(prev => {
			const next = new Map(prev)
			next.delete(workout.id)
			return next
		})
		router.refresh()
	}



	return (
		<>
			<div className="m-card flex flex-col gap-2 ">

				{/* 카드 헤더 — m-card-header */}
				<div className="m-card-header">
					<div className="flex flex-col gap-0">
						<p className="m-card-label">오늘 알림장</p>
						<p className="m-sublabel">강사가 제안한 운동을 기록해요</p>
					</div>
					{hasNote && totalCount > 0 && (
						<p className="text-xs text-gray-500 whitespace-nowrap">
							{todayDayLabel}요일{' '}
							<span className="text-primary font-semibold">{completedCount}</span>
							{' / '}{totalCount}
						</p>
					)}
				</div>

				{/* Empty: 알림장 자체가 없을 때 */}
				{!hasNote && (
					<EmptyState icon="📋" message="강사님이 작성한 알림장이 없어요" />
				)}

				{/* Empty: 알림장은 있지만 오늘 처방 운동 없을 때 */}
				{hasNote && totalCount === 0 && (
					<EmptyState icon="😴" message="오늘 알림장에는 추천 운동이 없어요" />
				)}

				{/* 운동 아이템 목록 */}
				{hasNote && totalCount > 0 && (
					<div className="flex flex-col gap-1">
						{noteWorkouts.map(w => {
							//console.log("TodayNoteCard - ", w, completedMap)

							return (<TodayNoteCardItem
								key={w.id}
								workout={w}
								completedLog={completedMap.get(w.id)}
								onDidIt={(workout) => setModalTarget(workout)}
								onUndoIt={handleUndo}
							/>)
						})}
					</div>
				)}

				{/* 알림장 더보기 */}
				<Link href={`/m/${token}/notes`} className="btn-add">
					<span className="text-sm text-gray-600">알림장 더보기</span>
					<ChevronRight size={16} className="text-gray-600" />
				</Link>
			</div>

			{modalTarget && (
				<WorkoutCompleteModal
					workout={modalTarget}
					totalCount={totalCount}
					completedCount={completedCount}
					onClose={() => setModalTarget(null)}
					onDone={handleDone}
				/>
			)}
		</>
	)
}
