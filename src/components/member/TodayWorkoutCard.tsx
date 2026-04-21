// src/components/member/TodayWorkoutCard.tsx
// Figma: home > 오늘의 운동 카드 (18:17272)
// Figma: 섹션 "오늘의 운동" (36:1961)
//   - Property 1=empty   : 기록 없을 때
//   - Property 1=add-item: 직접운동기록-아이템 (18:17107)

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { WorkoutType, Intensity } from '@/types/database'
import { WORKOUT_METS_BY_INTENSITY } from '@/types/database'
import EmptyState from './ui/EmptyState'
import WorkoutRecordItem, { type WorkoutRecord } from './WorkoutRecordItem'
import WorkoutRecordModal from './WorkoutRecordModal'

interface Props {
	memberId: string
	token: string
	today: string
	initialRecords?: WorkoutRecord[]
}

export default function TodayWorkoutCard({
	memberId,
	token,
	today,
	initialRecords = [],
}: Props) {
	const router = useRouter()
	const [records, setRecords] = useState<WorkoutRecord[]>(initialRecords)
	const [showModal, setShowModal] = useState(false)
	const [editTarget, setEditTarget] = useState<WorkoutRecord | null>(null)
	const [deleting, setDeleting] = useState<string | null>(null)  // 삭제 중인 id

	// ── 운동 기록 추가 ──────────────────────────────────────────
	async function handleAdd(data: {
		workout_type: WorkoutType
		intensity: string
		duration_min: number
		condition_memo?: string
	}) {
		const supabase = createClient()
		const metsScore = WORKOUT_METS_BY_INTENSITY[data.workout_type]?.[data.intensity as Intensity] ?? 0  // ← 추가


		const { data: inserted, error } = await supabase
			.from('workout_logs')
			.insert({
				member_id: memberId,
				logged_at: today,
				workout_type: data.workout_type,
				duration_min: data.duration_min,
				mets_score: metsScore,            // TODO: WORKOUT_TYPE_METS로 계산
				condition_memo: data.condition_memo || null,
				source: 'manual',
				note_workout_id: null,
				activity_type: null,
			})
			.select('id, workout_type, duration_min, mets_score, condition_memo, source')
			.single()

		if (error || !inserted) {
			console.error('운동 기록 추가 실패:', error?.message)
			return
		}

		setRecords(prev => [...prev, {
			id: inserted.id,
			workout_type: inserted.workout_type,
			intensity: data.intensity,
			duration_min: inserted.duration_min,
			mets_score: inserted.mets_score,
			condition_memo: inserted.condition_memo,
			source: 'manual',
		}])
		setShowModal(false)
		router.refresh()
	}

	// ── 운동 기록 수정 ──────────────────────────────────────────
	async function handleEdit(data: {
		workout_type: WorkoutType
		intensity: string
		duration_min: number
		condition_memo?: string
	}) {
		if (!editTarget) return
		const supabase = createClient()
		const metsScore = WORKOUT_METS_BY_INTENSITY[data.workout_type]?.[data.intensity as Intensity] ?? 0  // ← 추가

		const { error } = await supabase
			.from('workout_logs')
			.update({
				workout_type: data.workout_type,
				duration_min: data.duration_min,
				mets_score: metsScore,
				condition_memo: data.condition_memo || null,
			})
			.eq('id', editTarget.id)

		if (error) {
			console.error('운동 기록 수정 실패:', error.message)
			return
		}

		setRecords(prev => prev.map(r =>
			r.id === editTarget.id
				? { ...r, ...data, mets_score: metsScore }
				: r
		))
		setEditTarget(null)
		router.refresh()
	}

	// ── 운동 기록 삭제 ──────────────────────────────────────────
	async function handleDelete(record: WorkoutRecord) {
		setDeleting(record.id)
		const supabase = createClient()
		await supabase.from('workout_logs').delete().eq('id', record.id)
		setRecords(prev => prev.filter(r => r.id !== record.id))
		setDeleting(null)
		router.refresh()
	}

	return (
		<>
			<div className="m-card flex flex-col gap-2">

				{/* 카드 헤더 */}
				<div className="flex items-end justify-between px-1">
					<div className="flex flex-col gap-0">
						<p className="m-card-label">오늘의 운동</p>
						<p className="m-sublabel">오늘 하루 추가로 한 운동을 기록해요</p>
					</div>
				</div>

				{/* ── Empty: 기록 없을 때 ── */}
				{records.length === 0 && (
					<EmptyState
						icon="🏃"
						message="오늘 기록된 운동이 없어요"
					/>
				)}

				{/* ── 운동 기록 목록 ── */}
				{records.length > 0 && (
					<div className="flex flex-col">
						{records.map(record => (
							<WorkoutRecordItem
								key={record.id}
								record={record}
								deleting={deleting === record.id}
								onEdit={() => setEditTarget(record)}
								onDelete={() => handleDelete(record)}
							/>
						))}
					</div>
				)}

				{/* + 운동 추가 버튼 */}
				<button
					type="button"
					className="btn-add"
					onClick={() => setShowModal(true)}
				>
					<span>운동 추가</span>
					<Plus size={16} />

				</button>
			</div>

			{/* 신규 운동 기록 모달 */}
			{showModal && (
				<WorkoutRecordModal
					mode="add"
					onSave={handleAdd}
					onClose={() => setShowModal(false)}
				/>
			)}

			{/* 수정 모달 */}
			{editTarget && (
				<WorkoutRecordModal
					mode="edit"
					initialData={editTarget}
					onSave={handleEdit}
					onClose={() => setEditTarget(null)}
				/>
			)}
		</>
	)
}

