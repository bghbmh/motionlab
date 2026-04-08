// src/components/member/NoteWorkoutItem.tsx
// Figma: 컴포넌트 섹션 > 알림장-아이템-메인
// 홈 > 오늘 알림장 카드 내부의 운동 1개 아이템

import type { WorkoutType } from '@/types/database'
import WorkoutTypeIcon from './ui/WorkoutTypeIcon'
import StatusBadge from './ui/StatusBadge'
import MemberMemo from './ui/MemberMemo'
import WorkoutOptions from './ui/WorkoutOptions'

interface NoteWorkout {
	id: string
	workout_type: WorkoutType
	intensity: string
	duration_min: number | null
	mets: number | null
	coach_memo?: string | null
}

interface CompletedLog {
	note_workout_id: string
	duration_min: number
}

interface Props {
	workout: NoteWorkout
	completedLog?: CompletedLog
	onDidIt: (workout: NoteWorkout) => void
	onUndoIt: (workout: NoteWorkout) => void
}

export default function TodayWorkoutCardItem({
	workout,
	completedLog,
	onDidIt,
	onUndoIt,
}: Props) {
	const isCompleted = !!completedLog

	return (
		<div className="m-card-item flex flex-col gap-3">

			{/* 헤더: 운동 아이콘 + 이름 + 상태 뱃지 */}
			<div className="m-card-item-header ">
				<div className="flex items-center gap-4 h-full">
					<WorkoutTypeIcon workoutType={workout.workout_type} size={34} />
					<div className=' grow'>
						<span className="m-card-item-title " >
							{workout.workout_type}
						</span>

						{/* 강도 · 시간 · METs */}
						<WorkoutOptions
							intensity={workout.intensity}
							prescribedMin={workout.duration_min}
							actualMin={completedLog?.duration_min}
							mets={workout.mets}
						/>
					</div>
				</div>

				<StatusBadge status={'added'} />
			</div>

			{/* 회원 메모 */}
			{workout.coach_memo && (
				<MemberMemo memo={workout.coach_memo} />
			)}



			{/* 완료 / 안했어요 버튼 그룹 */}
			{/* Figma: group-Button — Property 1=Tabs / Variant4 */}
			<div
				className="flex items-center justify-end gap-1 "
			>
				<button className="btn-outline">
					수정
				</button>
				<button className="btn-danger" >
					삭제
				</button>

			</div>
		</div>
	)
}
