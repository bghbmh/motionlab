// src/components/member/NoteWorkoutItem.tsx
// Figma: 컴포넌트 섹션 > 알림장-아이템-메인
// Figma: group-Button (Property 1=Tabs / Variant4)
//
// 버튼 그룹은 스위치 형태 — isCompleted로 두 버튼 클래스를 동시에 전환
//   isCompleted=false : [btn-ghost "운동 했어요"] [btn-dark  "아직 안했어요"]
//   isCompleted=true  : [btn-primary "운동 했어요"] [btn-ghost "아직 안했어요"]

import { WORKOUT_TYPE_LABELS } from '@/types/database'
import type { NoteWorkout, CompletedLog } from '@/types/database'
import WorkoutTypeIcon from './ui/WorkoutTypeIcon'
import StatusBadge from './ui/StatusBadge'
import CoachMemo from './ui/CoachMemo'
import WorkoutOptions from './ui/WorkoutOptions'

interface Props {
	workout: NoteWorkout
	completedLog?: CompletedLog
	onDidIt: (workout: NoteWorkout) => void   // 완료 모달 열기
	onUndoIt: (workout: NoteWorkout) => void  // 완료 취소 (DB 삭제)
}

export default function TodayNoteCardItem({
	workout,
	completedLog,
	onDidIt,
	onUndoIt,
}: Props) {
	const isCompleted = !!completedLog
	const label = WORKOUT_TYPE_LABELS[workout.workout_type] ?? workout.workout_type

	return (
		<div className="m-card-item flex flex-col gap-3">

			{/* 헤더: 아이콘 + 운동명 + 상태 뱃지 */}
			<div className="m-card-item-header">
				<WorkoutTypeIcon workoutType={workout.workout_type} size={34} />
				<div className="grow">
					<div className="flex items-center justify-between gap-1">
						<span className="m-card-item-title">{label}</span>
						<StatusBadge status={isCompleted ? 'done' : 'default'} />
					</div>
					<WorkoutOptions
						intensity={workout.intensity}
						prescribedMin={workout.duration_min}
						actualMin={completedLog?.duration_min}
						mets={workout.mets}
					/>
				</div>
			</div>

			{/* 코치 메모 */}
			{workout.coach_memo && (
				<CoachMemo memo={workout.coach_memo} />
			)}

			{/* 스위치 버튼 그룹
			    isCompleted에 따라 두 버튼의 클래스가 동시에 전환됨 */}
			<div className="flex items-center gap-1 p-1 rounded-xl bg-white">
				<button
					className={isCompleted ? 'btn-primary' : 'btn-ghost'}
					style={{ padding: '10px 12px' }}
					onClick={() => !isCompleted && onDidIt(workout)}
				>
					{isCompleted && (
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
							<path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					)}
					운동 했어요
				</button>

				<button
					className={isCompleted ? 'btn-ghost' : 'btn-dark'}
					style={{ padding: '10px 12px' }}
					onClick={() => isCompleted && onUndoIt(workout)}
				>
					{!isCompleted && (
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
							<path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					)}
					아직 안했어요
				</button>
			</div>
		</div>
	)
}
