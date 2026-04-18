// src/components/member/WorkoutLogItem.tsx
// 레이아웃:
//   일반(routine/manual):
//     행1) 기록종류 뱃지 + 강도  ·  수정/삭제 버튼
//     행2) 워크아웃 아이콘 + 운동명/시간  ·  METs
//     행3) 회원 컨디션 메모 (있을 때만)
//
//   일상활동 자동기록(daily, activity_type 있음):
//     행1) 일상활동 뱃지  ·  METs (건너뜀 시 0)
//     행2) 아이콘 + 활동명/시간  ·  [포함][건너뜀] 버튼
//
//   일상활동 수동추가(daily, activity_type 있음, is_manual_daily):
//     행1) 일상활동 뱃지  ·  수정/삭제 버튼
//     행2) 아이콘 + 활동명/시간  ·  METs

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WorkoutLog, WorkoutType } from '@/types/database'
import { WORKOUT_TYPE_LABELS } from '@/types/database'
import { ALL_DAILY_ACTIVITY_OPTIONS } from '@/data/dailyActivityOptions'
import RecordTypeBadge from './ui/RecordTypeBadge'
import WorkoutTypeIcon from './ui/WorkoutTypeIcon'
import { IntensityLabel } from './IntensityLabel'
import MemberMemo from './ui/MemberMemo'
import WorkoutOptions from './ui/WorkoutOptions'
import { Dot } from 'lucide-react'
import DailyTypeIcon from './ui/DailyTypeIcon'

interface Props {
	log: WorkoutLog
	memberId: string
	deleting?: boolean
	onEdit: (log: WorkoutLog) => void
	onDelete: (log: WorkoutLog) => void
}

export default function WorkoutLogItem({ log, memberId, deleting = false, onEdit, onDelete }: Props) {
	const label = WORKOUT_TYPE_LABELS[log.workout_type] ?? log.workout_type
	const activityLabel = log.source === 'daily' && log.activity_type
		? (ALL_DAILY_ACTIVITY_OPTIONS.find(o => o.activity_type === log.activity_type)?.activity_label ?? log.activity_type)
		: null

	const totalMets = Math.round(log.mets_score * log.duration_min)
	const prescribedMin = log.source === 'routine' ? (log.prescribed_duration_min ?? null) : null

	// 자동기록 daily: note_workout_id 없고 홈탭에서 자동 생성된 것
	// 수동추가 daily: 기록탭 플로팅 버튼으로 추가한 것 → is_manual_daily로 구분
	// 현재는 둘 다 source='daily'라 구분이 어려움
	// → autoSave로 생성된 것은 포함/건너뜀 UI, 수동추가는 수정/삭제 UI
	// → is_skipped가 있으면 자동기록, 없으면 수동추가로 판단
	const isAutoDailyRecord = log.source === 'daily' && !log.is_manual_daily
	const isManualDailyRecord = log.source === 'daily' && !!log.is_manual_daily

	const canEdit = log.source === 'manual' || isManualDailyRecord

	// ── 일상활동 포함/건너뜀 상태 (자동기록만) ────────────────
	const [isSkipped, setIsSkipped] = useState(log.is_skipped ?? false)
	const [toggling, setToggling] = useState(false)

	async function handleSkip() {
		if (toggling) return
		setToggling(true)
		const supabase = createClient()
		await supabase
			.from('workout_logs')
			.update({ is_skipped: true })
			.eq('id', log.id)
		setIsSkipped(true)
		setToggling(false)
	}

	async function handleInclude() {
		if (toggling) return
		setToggling(true)
		const supabase = createClient()
		await supabase
			.from('workout_logs')
			.update({ is_skipped: false })
			.eq('id', log.id)
		setIsSkipped(false)
		setToggling(false)
	}

	// ── 일상활동 자동기록 UI ───────────────────────────────────
	if (isAutoDailyRecord) {
		const displayMets = isSkipped ? 0 : totalMets
		return (
			<div className="m-card-item flex flex-col gap-[4px] p-2 bg-white">
				<div className="flex items-center justify-between px-[8px]">
					<div className="flex items-center gap-0">
						<RecordTypeBadge type="daily" />
						<Dot size={14} className='text-gray-500' />
						<span className='m-sublabel text-xs font-medium'>반복</span>
					</div>
					<div className="flex flex-col items-center justify-center">
						<span className="font-semibold text-[18px] leading-[20px] text-primary">
							{displayMets}
						</span>
						<span className="text-[10px] leading-[16px] text-[#525252]">METs</span>
					</div>
				</div>

				<div className="flex items-center px-2 gap-[10px]">
					<DailyTypeIcon dailyType='lifestyle' size={50} />
					<div className="flex flex-col flex-1 justify-center">
						<span className="m-card-item-title font-medium">{activityLabel ?? label}</span>
						<span className="m-sublabel text-sm font-medium">{log.duration_min}분</span>
					</div>
					<div className="flex items-center gap-[6px]">
						<button
							type="button"
							disabled={toggling}
							onClick={isSkipped ? handleInclude : undefined}
							className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${!isSkipped ? 'bg-primary/10 text-primary border-primary-300' : 'bg-transparent text-gray-400 border-gray-300'
								}`}
						>
							포함
						</button>
						<button
							type="button"
							disabled={toggling}
							onClick={!isSkipped ? handleSkip : undefined}
							className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${isSkipped ? 'bg-red-50 text-red-500 border-red-300' : 'bg-transparent text-gray-400 border-gray-300'}`}
						>
							건너뜀
						</button>
					</div>
				</div>
			</div>
		)
	}

	// ── 일반 운동 / 일상활동 수동추가 UI ──────────────────────
	return (
		<div className="m-card-item flex flex-col gap-[4px] p-2 bg-white">

			{/* 행1: 기록종류 + 강도 · 수정/삭제 버튼 */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-0 px-[8px]">
					<RecordTypeBadge
						type={
							log.source === 'routine' ? 'routine'
								: log.source === 'daily' ? 'daily'
									: 'manual'
						}
					/>
					<Dot size={14} className='text-gray-500' />

					{log.source === 'daily'
						? <span className='m-sublabel text-xs font-medium'>한번</span>
						: <IntensityLabel intensity={log.intensity ?? 'normal'} />}
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
				{log.source === 'daily'
					? <DailyTypeIcon dailyType='once' size={50} />
					: <WorkoutTypeIcon workoutType={log.workout_type} size={50} />}


				<div className="flex flex-col flex-1 justify-center">
					<span className="m-card-item-title font-medium">
						{activityLabel ?? label}
					</span>
					{log.source === 'routine' ? (
						<WorkoutOptions
							intensity={log.intensity ?? 'normal'}
							prescribedMin={prescribedMin}
							actualMin={log.duration_min}
							mets={null}
						/>
					) : (
						<span className="m-sublabel text-sm font-medium">{log.duration_min}분</span>
					)}
				</div>

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
