// src/components/member/DailyActivityCard.tsx
// Figma: home > 일상생활활동 카드
// Figma: 섹션 "일상생활활동" > 일상생활활동-아이템

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { WorkoutType } from '@/types/database'
import DailyActivityItem from './DailyActivityItem'
import DailyActivityModal, { type DailyActivityOption } from './DailyActivityModal'
import DailyActivityDurationModal from './DailyActivityDurationModal'

// ─── 타입 ──────────────────────────────────────────────────────
export interface DailyItem {
	dailyActivityId: string | null
	activity_type: string
	activity_label: string
	mets_value: number
	defaultDuration: number
	actualDuration: number
	isIncluded: boolean
	source: 'pattern' | 'modal'
}

interface PatternItem {
	id: string
	activity_type: string
	activity_label: string
	mets_value: number
	duration_min_per_day: number
}

interface Props {
	memberId: string
	patterns: PatternItem[]
	today: string
	todayLoggedTypes: string[]
}

export default function DailyActivityCard({
	memberId,
	patterns,
	today,
	todayLoggedTypes,
}: Props) {
	const router = useRouter()

	const [items, setItems] = useState<DailyItem[]>(
		patterns
			.filter(p => p.duration_min_per_day > 0)
			.map(p => ({
				dailyActivityId: p.id,
				activity_type: p.activity_type,
				activity_label: p.activity_label,
				mets_value: p.mets_value,
				defaultDuration: p.duration_min_per_day,
				actualDuration: p.duration_min_per_day,
				isIncluded: todayLoggedTypes.includes(p.activity_type),
				source: 'pattern' as const,
			}))
	)

	const [showModal, setShowModal] = useState(false)
	const [editTarget, setEditTarget] = useState<DailyItem | null>(null)  // ← 수정 대상
	const [saving, setSaving] = useState(false)
	const [savedTypes, setSavedTypes] = useState<Set<string>>(
		new Set(todayLoggedTypes)
	)

	const existingTypes = items.map(i => i.activity_type)

	// ── 신규 추가 — 즉시 DB INSERT ──────────────────────────────
	async function handleAdd(opt: DailyActivityOption, durationMin: number) {
		if (items.some(i => i.activity_type === opt.activity_type)) return

		const supabase = createClient()
		const { data: inserted, error } = await supabase
			.from('daily_activities')
			.insert({
				member_id: memberId,
				recorded_at: today,
				activity_type: opt.activity_type,
				activity_label: opt.activity_label,
				mets_value: opt.mets_value,
				duration_min_per_day: durationMin,
				frequency_per_week: 7,
				paper_code: opt.paper_code ?? null,
			})
			.select('id')
			.single()

		if (error || !inserted) {
			console.error('daily_activities INSERT 실패:', error?.message, error?.details)
			return
		}

		setItems(prev => [...prev, {
			dailyActivityId: inserted.id,
			activity_type: opt.activity_type,
			activity_label: opt.activity_label,
			mets_value: opt.mets_value,
			defaultDuration: durationMin,
			actualDuration: durationMin,
			isIncluded: false,
			source: 'modal' as const,
		}])
		setShowModal(false)
	}

	// ── 삭제 — DB DELETE ────────────────────────────────────────
	async function handleDelete(item: DailyItem) {
		if (item.dailyActivityId) {
			const supabase = createClient()
			await supabase
				.from('daily_activities')
				.delete()
				.eq('id', item.dailyActivityId)
		}
		setItems(prev => prev.filter(i => i.activity_type !== item.activity_type))
	}

	// ── 수정 모달 열기 ──────────────────────────────────────────
	function handleEdit(item: DailyItem) {
		setEditTarget(item)
	}

	// ── 수정 완료 — DB UPDATE + 상태 반영 ──────────────────────
	async function handleEditConfirm(opt: DailyActivityOption, durationMin: number) {
		if (!editTarget) return

		// DB UPDATE
		if (editTarget.dailyActivityId) {
			const supabase = createClient()
			await supabase
				.from('daily_activities')
				.update({ duration_min_per_day: durationMin })
				.eq('id', editTarget.dailyActivityId)
		}

		// 상태 반영
		setItems(prev =>
			prev.map(i =>
				i.activity_type === editTarget.activity_type
					? { ...i, defaultDuration: durationMin, actualDuration: durationMin }
					: i
			)
		)
		setEditTarget(null)
	}

	// ── 체크박스 토글 ───────────────────────────────────────────
	function toggleInclude(activityType: string) {
		setItems(prev =>
			prev.map(i =>
				i.activity_type === activityType
					? { ...i, isIncluded: !i.isIncluded }
					: i
			)
		)
	}

	// ── 포함 항목 저장 → workout_logs INSERT ──────────────────
	async function save() {
		const toSave = items.filter(
			i => i.isIncluded && i.actualDuration > 0 && !savedTypes.has(i.activity_type)
		)
		if (toSave.length === 0) return
		setSaving(true)
		const supabase = createClient()

		await supabase.from('workout_logs').insert(
			toSave.map(i => ({
				member_id: memberId,
				logged_at: today,
				workout_type: 'other' as WorkoutType,
				duration_min: i.actualDuration,
				mets_score: i.mets_value,
				condition_memo: null,
				source: 'daily',
				activity_type: i.activity_type,
				note_workout_id: null,
			}))
		)

		setSavedTypes(prev => new Set([...prev, ...toSave.map(i => i.activity_type)]))
		setSaving(false)
		router.refresh()
	}

	const hasUnsaved = items.some(i => i.isIncluded && !savedTypes.has(i.activity_type))

	return (
		<>
			<div className="m-card flex flex-col gap-2 mt-5 ">

				{/* 카드 헤더 */}
				<div className="m-card-header">
					<div className="flex flex-col gap-0">
						<p className="m-card-label">일상생활활동</p>
						<p className="m-sublabel">반복되는 일상 활동을 기록해 관리하세요</p>
					</div>
				</div>

				{/* 활동 목록 */}
				<div className="flex flex-col">
					{items.length === 0 ? (
						<div
							className="text-xs text-center py-4 rounded-[14px]"
							style={{
								color: 'var(--m-text-muted)',
								backgroundColor: 'var(--m-surface-2)',
							}}
						>
							등록된 일상생활활동이 없습니다
						</div>
					) : (
						items.map(item => (
							<DailyActivityItem
								key={item.activity_type}
								activityType={item.activity_type}
								activityLabel={item.activity_label}
								metsValue={item.mets_value}
								defaultDuration={item.defaultDuration}
								isIncluded={item.isIncluded}
								onToggleInclude={() => toggleInclude(item.activity_type)}
								onEdit={() => handleEdit(item)}
								onDelete={() => handleDelete(item)}
							/>
						))
					)}
				</div>

				{/* 저장 버튼 */}
				{hasUnsaved && (
					<button
						type="button"
						className="btn-primary"
						disabled={saving}
						onClick={save}
						style={{
							padding: '14px 12px',
							borderRadius: '100px',
							opacity: saving ? 0.5 : 1,
						}}
					>
						{saving ? '저장 중...' : '일상생활활동 저장'}
					</button>
				)}

				{/* + 일상생활활동 추가 버튼 */}
				<button
					type="button"
					className="btn-add"
					onClick={() => setShowModal(true)}
				>
					<span>일상생활활동 추가</span>
					<Plus size={16} />

				</button>

			</div>

			{/* 활동 추가 모달 */}
			{showModal && (
				<DailyActivityModal
					excludeTypes={existingTypes}
					onAdd={handleAdd}
					onClose={() => setShowModal(false)}
				/>
			)}

			{/* 수정 모달 — DailyActivityDurationModal 재사용 */}
			{editTarget && (
				<DailyActivityDurationModal
					option={{
						activity_type: editTarget.activity_type,
						activity_label: editTarget.activity_label,
						mets_value: editTarget.mets_value,
						paper_code: '',
						category: '',
					}}
					onConfirm={handleEditConfirm}
					onBack={() => setEditTarget(null)}
					onClose={() => setEditTarget(null)}
				/>
			)}
		</>
	)
}
