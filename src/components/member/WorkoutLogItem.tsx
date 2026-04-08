// src/components/member/WorkoutLogItem.tsx
// Figma: 운동기록-아이템
// 레이아웃:
//   행1) 기록종류 뱃지 + 강도  ·  수정/삭제 버튼
//   행2) 워크아웃 아이콘 + 운동명/시간  ·  METs (우측 세로)
//   행3) 회원 컨디션 메모 (있을 때만)

import type { WorkoutLog } from '@/types/database'
import { WORKOUT_TYPE_LABELS } from '@/types/database'
import RecordTypeBadge from './ui/RecordTypeBadge'
import WorkoutTypeIcon from './ui/WorkoutTypeIcon'
import { IntensityLabel } from './IntensityLabel'
import MemberMemo from './ui/MemberMemo'
import WorkoutOptions from './ui/WorkoutOptions'

interface Props {
	log: WorkoutLog
	deleting?: boolean
	onEdit: (log: WorkoutLog) => void
	onDelete: (log: WorkoutLog) => void
}

export default function WorkoutLogItem({ log, deleting = false, onEdit, onDelete }: Props) {
	const label = WORKOUT_TYPE_LABELS[log.workout_type] ?? log.workout_type
	const canEdit = log.source === 'routine' || log.source === 'manual'
	const totalMets = Math.round(log.mets_score * log.duration_min)

	// 알림장 운동(routine)이고 처방 시간과 실제 시간이 다른 경우
	const prescribedMin = log.source === 'routine' ? (log.prescribed_duration_min ?? null) : null
	const actualMin = log.source === 'routine' ? log.duration_min : null

	return (
		<div className="m-card-item flex flex-col gap-[4px] p-2 bg-white">

			{/* 행1: 기록종류 + 강도 · 수정/삭제 버튼 */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-[6px] px-[8px]">
					<RecordTypeBadge
						type={
							log.source === 'routine' ? 'routine'
								: log.source === 'daily' ? 'daily'
									: 'manual'
						}
					/>
					<span className="inline-block rounded-full shrink-0" style={{ width: 3, height: 3, backgroundColor: '#82827C' }} />
					<IntensityLabel intensity={log.intensity ?? 'normal'} />
				</div>

				<div className="flex items-center gap-[6px]">
					{canEdit && (
						<button
							type="button"
							className="btn-outline"
							onClick={() => onEdit(log)}
						>
							수정
						</button>
					)}
					<button
						type="button"
						className="btn-danger"
						onClick={() => onDelete(log)}
						disabled={deleting}
						style={{ opacity: deleting ? 0.5 : 1 }}
					>
						{deleting ? '삭제 중...' : '삭제'}
					</button>
				</div>
			</div>

			{/* 행2: 아이콘 + 운동명/시간 · METs */}
			<div className="flex items-center px-2 gap-[10px]">
				<WorkoutTypeIcon workoutType={log.workout_type} size={50} />

				<div className="flex flex-col flex-1 justify-center">
					<span className="m-card-item-title font-medium">
						{log.source === 'daily' && log.activity_type
							? log.activity_type
							: label}
					</span>

					{/* 알림장 운동 — 처방/실제 시간 WorkoutOptions로 표시 */}
					{log.source === 'routine' ? (
						<WorkoutOptions
							intensity={log.intensity ?? 'normal'}
							prescribedMin={prescribedMin}
							actualMin={actualMin}
							mets={null}
						/>
					) : (
						<span className="m-sublabel text-sm font-medium">{log.duration_min}분</span>
					)}
				</div>

				{/* METs — 우측 세로 배치 */}
				<div className="flex flex-col items-center justify-center h-[48px]">
					<span className="font-semibold text-[18px] leading-[20px]" style={{ color: 'var(--color-primary)' }}>
						{totalMets}
					</span>
					<span className="text-[10px] leading-[16px] text-[#525252]">METs</span>
				</div>
			</div>

			{/* 행3: 회원 컨디션 메모 */}
			{log.condition_memo && (
				<MemberMemo memo={log.condition_memo} />
			)}
		</div>
	)
}
