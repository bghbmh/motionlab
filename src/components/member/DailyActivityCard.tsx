// src/components/member/DailyActivityCard.tsx
// Figma: home > 일상생활활동 카드
//
// 자동 기록 로직:
//   - 과거에 한 번이라도 daily로 저장된 적 있는 항목 (everLoggedTypes)
//   - 오늘은 아직 저장 안 된 항목 (todayLoggedTypes에 없는)
//   - 위 두 조건을 만족하면 마운트 시 자동으로 오늘 날짜로 workout_logs INSERT
//   - 처음 체크하는 경우에만 저장 버튼 표시

'use client'

import { useState, useEffect } from 'react'
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
	todayLoggedTypes: string[]    // 오늘 이미 저장된 타입
	everLoggedTypes: string[]     // 과거에 한 번이라도 저장된 타입 (자동 기록 판단용)
}

export default function DailyActivityCard({
	memberId,
	patterns,
	today,
	todayLoggedTypes,
	everLoggedTypes,
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
	const [editTarget, setEditTarget] = useState<DailyItem | null>(null)
	const [saving, setSaving] = useState(false)
	const [savedTypes, setSavedTypes] = useState<Set<string>>(
		new Set(todayLoggedTypes)
	)

	// ── 자동 기록 — 마운트 시 1회 실행 ────────────────────────
	// 과거에 저장된 적 있고 오늘은 아직 없는 항목 → 자동 INSERT
	useEffect(() => {
		const toAutoSave = items.filter(
			i => everLoggedTypes.includes(i.activity_type)
				&& !todayLoggedTypes.includes(i.activity_type)
				&& i.actualDuration > 0
		)
		if (toAutoSave.length === 0) return

		async function autoSave() {
			const supabase = createClient()
			await supabase.from('workout_logs').insert(
				toAutoSave.map(i => ({
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
			// 자동 저장된 항목 → savedTypes에 추가 + 체크 상태로 표시
			setSavedTypes(prev => new Set([...prev, ...toAutoSave.map(i => i.activity_type)]))
			setItems(prev =>
				prev.map(i =>
					toAutoSave.some(s => s.activity_type === i.activity_type)
						? { ...i, isIncluded: true }
						: i
				)
			)
			router.refresh()
		}

		autoSave()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])  // 마운트 시 1회만 실행

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

		if (editTarget.dailyActivityId) {
			const supabase = createClient()
			await supabase
				.from('daily_activities')
				.update({ duration_min_per_day: durationMin })
				.eq('id', editTarget.dailyActivityId)
		}

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

	// ── 수동 저장 (처음 체크하는 항목) → workout_logs INSERT ───
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

	// 처음 체크하는 항목(과거 기록 없음)만 저장 버튼 표시
	const hasUnsaved = items.some(
		i => i.isIncluded
			&& !savedTypes.has(i.activity_type)
			&& !everLoggedTypes.includes(i.activity_type)
	)

	return (
		<>
			<div className="m-card flex flex-col gap-2 mt-5 mb-5">

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

				{/* 저장 버튼 — 처음 체크하는 항목 있을 때만 */}
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
					<Plus size={16} style={{ color: 'var(--m-gray-600)' }} />
					<span>일상생활활동 추가</span>
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

			{/* 수정 모달 */}
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
