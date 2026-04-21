// src/components/member/WorkoutRecordItem.tsx
// Figma: 컴포넌트 섹션 > 직접운동기록-아이템 (18:17107)
// TodayWorkoutCard 내부의 운동 기록 1행

import { WORKOUT_TYPE_LABELS } from '@/types/database'
import type { WorkoutType } from '@/types/database'
import StatusBadge from './ui/StatusBadge'
import MemberMemo from './ui/MemberMemo'
import WorkoutOptions from './ui/WorkoutOptions'
import WorkoutTypeIcon from './ui/WorkoutTypeIcon'
import RecordTypeBadge from './ui/RecordTypeBadge'

// ─── 타입 ──────────────────────────────────────────────────────
export interface WorkoutRecord {
	id: string
	workout_type: WorkoutType
	intensity: string
	duration_min: number
	mets_score: number
	condition_memo?: string | null
	source: 'routine' | 'manual' | 'daily'
}

interface Props {
	record: WorkoutRecord
	deleting?: boolean
	onEdit: () => void
	onDelete: () => void
}

export default function WorkoutRecordItem({
	record,
	deleting = false,
	onEdit,
	onDelete,
}: Props) {
	const label = WORKOUT_TYPE_LABELS[record.workout_type] ?? record.workout_type
	const intensityLabel =
		record.intensity === 'high' ? '고강도'
			: record.intensity === 'recovery' ? '리커버리'
				: '일반'

	return (
		<div className="m-card-item flex flex-col gap-3" style={{ marginBottom: 4 }}>

			{/* 헤더: 운동명 + 직접 뱃지 + 추가 상태 뱃지 */}
			<div className="m-card-item-header ">
				<WorkoutTypeIcon workoutType={record.workout_type} size={34} />

				<div className=' grow'>
					<div className="flex items-center ">

						{/* 운동명 */}
						<span className="m-card-item-title " >
							{label}
						</span>
						{/* 기록 종류 뱃지 — Figma: 기록-종류 */}
						<RecordTypeBadge type={record.source === 'routine' ? 'routine' : record.source === 'daily' ? 'daily' : 'manual'} />

						<span className='ml-auto'>
							<StatusBadge status={'added'} />
						</span>

					</div>



					{/* 강도 · 시간 · METs */}
					<WorkoutOptions
						intensity={record.intensity}
						prescribedMin={record.duration_min}
						mets={record.mets_score * record.duration_min}
					/>
				</div>
			</div>
			{/* 회원 컨디션 메모 */}
			{
				record.condition_memo && (
					<MemberMemo memo={record.condition_memo} />
				)
			}

			{/* 수정 / 삭제 버튼 */}
			<div className="flex items-center justify-end gap-1.5">
				<button
					type="button"
					className="btn-outline"
					onClick={onEdit}
				>
					수정
				</button>
				<button
					type="button"
					className="btn-danger"
					onClick={onDelete}
					disabled={deleting}
					style={{ opacity: deleting ? 0.5 : 1 }}
				>
					{deleting ? '삭제 중...' : '삭제'}
				</button>
			</div>
		</div>
	)
}

// ─── 내부 유틸 ─────────────────────────────────────────────────
function Bullet() {
	return (
		<span
			className="inline-block rounded-full shrink-0"
			style={{ width: 2, height: 2, backgroundColor: '#a1a1a1' }}
		/>
	)
}
