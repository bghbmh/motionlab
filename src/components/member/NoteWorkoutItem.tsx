// src/components/member/NoteWorkoutItem.tsx
// 알림장 탭 > 요일별 목록 안의 운동 1개 아이템
// Figma: 알림장페이지-목록-아이템

import type { WorkoutType, Intensity } from '@/types/database'
import { WORKOUT_TYPE_LABELS } from '@/types/database'
import WorkoutTypeIcon from './ui/WorkoutTypeIcon'
import WorkoutOptions from './ui/WorkoutOptions'
import CoachMemo from './ui/CoachMemo'
import StatusSwitch from './ui/StatusSwitch'

function StatusIcon({ completed }: { completed: boolean }) {
	if (completed) {
		// 체크 아이콘 (초록)
		return (
			<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
				<rect width="18" height="18" rx="4.5" fill="#E6FAF5" />
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M13.3529 5.3542C13.7688 5.68688 13.8362 6.2937 13.5035 6.70957L8.36068 13.1381C8.03532 13.5449 7.44579 13.6197 7.02913 13.3071L4.4577 11.3786C4.03165 11.0591 3.9453 10.4547 4.26484 10.0286C4.58438 9.60256 5.1888 9.51621 5.61484 9.83575L7.43856 11.2035L11.9976 5.5048C12.3303 5.08893 12.9371 5.02151 13.3529 5.3542Z"
					fill="#0BB489"
				/>
			</svg>
		)
	}
	// X 아이콘 (빨강)
	return (
		<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M1.46324 0.251051C1.1285 -0.0836837 0.585786 -0.0836837 0.251051 0.251051C-0.0836837 0.585786 -0.0836837 1.1285 0.251051 1.46324L4.78782 6L0.251051 10.5368C-0.0836837 10.8715 -0.0836837 11.4142 0.251051 11.7489C0.585786 12.0837 1.1285 12.0837 1.46324 11.7489L6 7.21218L10.5368 11.7489C10.8715 12.0837 11.4142 12.0837 11.7489 11.7489C12.0837 11.4142 12.0837 10.8715 11.7489 10.5368L7.21218 6L11.7489 1.46324C12.0837 1.1285 12.0837 0.585786 11.7489 0.251051C11.4142 -0.0836837 10.8715 -0.0836837 10.5368 0.251051L6 4.78782L1.46324 0.251051Z"
				fill="#FB2C36"
			/>
		</svg>
	)
}

export interface NoteWorkoutItemData {
	id: string
	workoutType: WorkoutType
	intensity: Intensity
	durationMin: number
	actualMin?: number | null  // 실제 수행 시간 (처방과 다른 경우)
	mets: number
	coachMemo?: string | null
	completed: boolean
	dayDate: string   // 해당 요일의 실제 날짜 'YYYY-MM-DD' — workout_logs logged_at에 사용
}

interface Props {
	item: NoteWorkoutItemData
	isLatest: boolean               // 최근 알림장 여부 — true면 스위치, false면 아이콘
	onToggle?: (id: string, completed: boolean, item: NoteWorkoutItemData) => void  // ← item 추가
	hasDivider?: boolean
}

export default function NoteWorkoutItem({ item, isLatest, onToggle, hasDivider = false }: Props) {
	const label = WORKOUT_TYPE_LABELS[item.workoutType] ?? item.workoutType

	return (
		<div className="relative w-full">
			{/* 상단 점선 구분선 */}
			{hasDivider && (
				<div className="absolute top-0 inset-x-0 border-t border-dashed border-neutral-200" />
			)}

			<div className="flex items-center gap-3 overflow-hidden py-[16px] w-full">

				{/*  아이콘 + 운동명 · 상태 */}
				<div className="flex-1">
					<div className='flex items-center gap-4 '>
						<WorkoutTypeIcon workoutType={item.workoutType} size={34} />
						<div className=" ">

							<span className="m-card-item-title">{label}</span>

							{/* 옵션: 강도 · 시간 · METs */}
							<WorkoutOptions
								intensity={item.intensity}
								prescribedMin={item.durationMin}
								actualMin={item.actualMin}
								mets={item.mets}
							/>
						</div>
					</div>

					{/* 코치 메모 */}
					{item.coachMemo && (
						<div className="w-full mt-2">
							<CoachMemo memo={item.coachMemo} />
						</div>
					)}

				</div>

				{/* 우측: 스위치 or 상태 아이콘 */}
				<div className="flex items-center h-full">
					{isLatest ? (
						<StatusSwitch
							checked={item.completed}
							onChange={(v) => onToggle?.(item.id, v, item)}  // ← item 추가
						/>
					) : (
						<StatusIcon completed={item.completed} />
					)}
				</div>

			</div>

		</div>
	)
}
