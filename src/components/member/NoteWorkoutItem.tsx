// src/components/member/NoteWorkoutItem.tsx
// 알림장 탭 > 요일별 목록 안의 운동 1개 아이템
//
// [수정 내용]
//   - isFuture prop 추가
//   - 미래 날짜 체크 시도 시:
//     1. document.body에 --toast-y 인라인 변수로 Y좌표 기록
//     2. onFutureCheck() 호출 → NoteListManager에서 토스트 표시
//   - onFutureCheck 시그니처는 () => void 유지 (좌표는 CSS 변수로 전달)

import { useRef } from 'react'
import type { WorkoutType, Intensity } from '@/types/database'
import { WORKOUT_TYPE_LABELS } from '@/types/database'
import WorkoutTypeIcon from './ui/WorkoutTypeIcon'
import WorkoutOptions from './ui/WorkoutOptions'
import CoachMemo from './ui/CoachMemo'
import StatusSwitch from './ui/StatusSwitch'

function StatusIcon({ completed }: { completed: boolean }) {
	if (completed) {
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
	actualMin?: number | null
	mets: number
	coachMemo?: string | null
	completed: boolean
	dayDate: string   // 'YYYY-MM-DD'
}

interface Props {
	item: NoteWorkoutItemData
	isLatest: boolean
	isFuture?: boolean
	onToggle?: (id: string, completed: boolean, item: NoteWorkoutItemData) => void
	onFutureCheck?: () => void   // () => void 유지 — 좌표는 CSS 변수로 전달
	hasDivider?: boolean
}

export default function NoteWorkoutItem({
	item,
	isLatest,
	isFuture = false,
	onToggle,
	onFutureCheck,
	hasDivider = false,
}: Props) {
	const label = WORKOUT_TYPE_LABELS[item.workoutType] ?? item.workoutType

	function handleSwitchChange(v: boolean) {
		// 완료 → 미완료(해제)는 미래여도 허용
		if (v && isFuture) {
			onFutureCheck?.()
			return
		}
		onToggle?.(item.id, v, item)
	}

	// 터치/클릭 시 Y좌표를 body CSS 변수에 기록
	// FutureCheckToast가 이 값을 읽어서 위치 결정
	function captureY(clientY: number) {
		document.body.style.setProperty('--toast-y', String(clientY))
	}

	return (
		<div className="relative w-full">
			{hasDivider && (
				<div className="absolute top-0 inset-x-0 border-t border-dashed border-neutral-200" />
			)}

			<div className="flex items-center gap-3 overflow-hidden py-[16px] w-full">

				<div className="flex-1">
					<div className="flex items-center gap-4">
						<div  >
							<WorkoutTypeIcon workoutType={item.workoutType} size={34} />
						</div>
						<div >
							<span className="m-card-item-title">{label}</span>
							<WorkoutOptions
								intensity={item.intensity}
								prescribedMin={item.durationMin}
								actualMin={item.actualMin}
								mets={item.mets}
							/>
						</div>
					</div>

					{item.coachMemo && (
						<div className="w-full mt-2" >
							<CoachMemo memo={item.coachMemo} />
						</div>
					)}
				</div>

				{/* 우측: 스위치 or 상태 아이콘 */}
				<div className="flex items-center h-full">
					{isLatest ? (
						<div
							style={{ opacity: isFuture && !item.completed ? 0.35 : 1 }}
							onTouchStart={e => captureY(e.touches[0].clientY)}
							onClick={e => captureY(e.clientY)}
						>
							<StatusSwitch
								checked={item.completed}
								onChange={handleSwitchChange}
							/>
						</div>
					) : (
						<StatusIcon completed={item.completed} />
					)}
				</div>

			</div>
		</div>
	)
}
