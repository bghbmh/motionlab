'use client'

// src/components/admin/notes/DaySection.tsx
// 알림장 작성 모달 > 날짜별 운동 섹션
// 디자인: 알림장-운동할날선택_선택안함.png

import { useState } from 'react'
import { type WorkoutItem, calcMets, cloneItems, newItem } from './noteWorkoutTypes'
import { WORKOUT_TYPE_LABELS, INTENSITY_LABELS } from '@/types/database'
import WorkoutRecordModal from '@/components/member/WorkoutRecordModal'
import type { WorkoutType, Intensity } from '@/types/database'

interface Props {
	day: string
	items: WorkoutItem[] | null
	previousItems: WorkoutItem[]
	onUpdate: (items: WorkoutItem[]) => void
	onAddWorkout: () => void
	onRemoveWorkout: (localId: string) => void
}

// ─── 날짜 헤더 포맷 ──────────────────────────────────────────────
// "전체" → "전체", "월" → "26.03.03 월" 형태는 부모에서 날짜 계산
// 여기서는 day 레이블만 표시
function getDayLabel(day: string) {
	return day === '전체' ? '전체' : `${day}`
}

export default function DaySection({
	day, items, previousItems,
	onUpdate, onAddWorkout, onRemoveWorkout,
}: Props) {
	const [copyChoice, setCopyChoice] = useState<'copy' | 'new' | null>(
		items !== null && items.length > 0 ? 'new' : null
	)
	// 운동 선택 모달 — null이면 닫힘, localId이면 해당 운동 수정
	const [editingId, setEditingId] = useState<string | null>(null)
	// 새 운동 추가 모달
	const [addingWorkout, setAddingWorkout] = useState(false)

	const dayMets = (items ?? []).reduce<number>((s, w) => s + (calcMets(w) ?? 0), 0)
	const dayMetsDisplay = dayMets > 0 ? Math.round(dayMets) : null

	function handleCopyChoice(choice: 'copy' | 'new') {
		setCopyChoice(choice)
		onUpdate(choice === 'copy' ? cloneItems(previousItems) : [newItem()])
	}

	// 운동 선택 모달에서 저장
	function handleWorkoutSave(localId: string, data: {
		workout_type: WorkoutType
		intensity: string
		duration_min: number
		condition_memo?: string
	}) {
		onUpdate(
			(items ?? []).map(w =>
				w.localId === localId
					? {
						...w,
						workout_type: data.workout_type,
						intensity: data.intensity as Intensity,
						duration_min: String(data.duration_min),
						coach_memo: data.condition_memo ?? w.coach_memo,
					}
					: w
			)
		)
		setEditingId(null)
	}

	// 새 운동 추가
	function handleAddWorkoutSave(data: {
		workout_type: WorkoutType
		intensity: string
		duration_min: number
		condition_memo?: string
	}) {
		const item = newItem()
		item.workout_type = data.workout_type
		item.intensity = data.intensity as Intensity
		item.duration_min = String(data.duration_min)
		item.coach_memo = data.condition_memo ?? ''
		onUpdate([...(items ?? []), item])
		setAddingWorkout(false)
	}

	const currentItems = items ?? []
	const editingItem = editingId ? currentItems.find(w => w.localId === editingId) : null

	return (
		<>
			<div className="rounded-xl overflow-hidden border border-gray-200 bg-white">

				{/* 날짜 헤더 */}
				<div
					className="flex items-center justify-between px-4 py-2"
					style={{ backgroundColor: '#f0f0f0' }}
				>
					<span className="text-sm font-semibold text-gray-700">
						{getDayLabel(day)}
					</span>
					{dayMetsDisplay && (
						<span className="text-xs font-mono text-gray-500">
							{dayMetsDisplay} METs
						</span>
					)}
				</div>

				{/* 콘텐츠 */}
				<div className="flex flex-col">

					{/* 복사 선택 — 이전 요일이 있을 때 */}
					{copyChoice === null && previousItems.length > 0 ? (
						<div className="flex flex-col gap-2 p-4">
							<p className="text-xs text-gray-500">이전 요일 운동 내용을 사용할까요?</p>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => handleCopyChoice('copy')}
									className="flex-1 py-2.5 text-xs font-semibold rounded-xl border transition-all text-[#0bb489] border-[#0bb489] bg-teal-50 hover:bg-teal-100"
								>
									이전 내용 그대로 사용
								</button>
								<button
									type="button"
									onClick={() => handleCopyChoice('new')}
									className="flex-1 py-2.5 text-xs font-semibold rounded-xl border transition-all text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
								>
									신규 작성
								</button>
							</div>
						</div>
					) : (
						<>
							{/* 운동 목록 */}
							{currentItems.map((item, idx) => (
								<div key={item.localId}>
									{idx > 0 && <hr className="border-gray-100" />}
									<WorkoutListItem
										item={item}
										onEdit={() => setEditingId(item.localId)}
										onRemove={() => onRemoveWorkout(item.localId)}
									/>
								</div>
							))}

							{/* + 운동 추가 버튼 */}
							<button
								type="button"
								onClick={() => setAddingWorkout(true)}
								className="w-full py-4 text-sm font-medium text-gray-500 border border-dashed border-gray-300 rounded-none hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
								style={{
									borderLeft: 'none',
									borderRight: 'none',
									borderBottom: 'none',
									borderTop: currentItems.length > 0 ? '1px dashed #e5e7eb' : '1px dashed #e5e7eb',
								}}
							>
								<span className="text-base leading-none">+</span>
								운동 추가
							</button>
						</>
					)}
				</div>
			</div>

			{/* 운동 수정 모달 (기존 WorkoutRecordModal 재사용) */}
			{editingItem && (
				<WorkoutRecordModal
					mode="edit"
					initialData={{
						workout_type: editingItem.workout_type ?? undefined,
						intensity: editingItem.intensity,
						duration_min: editingItem.duration_min ? Number(editingItem.duration_min) : undefined,
						condition_memo: editingItem.coach_memo,
					}}
					onSave={async (data) => handleWorkoutSave(editingItem.localId, data)}
					onClose={() => setEditingId(null)}
				/>
			)}

			{/* 운동 추가 모달 */}
			{addingWorkout && (
				<WorkoutRecordModal
					mode="add"
					onSave={async (data) => handleAddWorkoutSave(data)}
					onClose={() => setAddingWorkout(false)}
				/>
			)}
		</>
	)
}

// ─── 운동 아이템 행 ───────────────────────────────────────────────
function WorkoutListItem({
	item,
	onEdit,
	onRemove,
}: {
	item: WorkoutItem
	onEdit: () => void
	onRemove: () => void
}) {

	if (!item.workout_type) return;

	const mets = calcMets(item)
	const typeName = WORKOUT_TYPE_LABELS[item.workout_type]
	const intensityName = INTENSITY_LABELS[item.intensity]

	return (
		<div className="px-4 py-3 flex flex-col gap-1.5">
			{/* 운동명 + 수정/삭제 */}
			<div className="flex items-center justify-between">
				<span className="text-sm font-semibold text-gray-800">{typeName}</span>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onEdit}
						className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
					>
						수정
					</button>
					<button
						type="button"
						onClick={onRemove}
						className="text-xs font-medium text-white bg-red-400 hover:bg-red-500 px-2 py-0.5 rounded transition-colors"
					>
						삭제
					</button>
				</div>
			</div>

			{/* 코치 메모 */}
			{item.coach_memo && (
				<p className="text-xs text-red-500 leading-relaxed">{item.coach_memo}</p>
			)}

			{/* 세부 정보 */}
			<div className="flex items-center gap-1.5 text-xs text-gray-500">
				<span>{intensityName}</span>
				<span>·</span>
				<span>{item.duration_min ? `${item.duration_min}분` : '-'}</span>
				<span>·</span>
				<span>{mets ? `${Math.round(mets)} METs` : '-'}</span>
			</div>

			{/* 태그 (coach_memo를 태그처럼 표시하는 경우 있음 — 필요 시 확장) */}
		</div>
	)
}
