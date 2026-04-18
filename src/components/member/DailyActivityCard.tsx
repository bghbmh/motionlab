// src/components/member/DailyActivityCard.tsx
// Figma: home > 일상생활활동 카드
//
// 자동 기록 로직:
//   - 과거에 한 번이라도 daily로 저장된 적 있는 항목 (everLoggedTypes)
//   - 오늘은 아직 저장 안 된 항목 (todayLoggedTypes에 없는)
//   - 위 두 조건을 만족하면 마운트 시 자동으로 오늘 날짜로 workout_logs INSERT
//   - 처음 체크하는 경우에만 저장 버튼 표시
//
// 중복 방지:
//   - 오늘 레코드가 이미 있으면 (포함이든 건너뜀이든) autoSave 스킵
//   - 체크 해제 시 확인 모달 표시

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { WorkoutType } from '@/types/database'
import DailyActivityItem from './DailyActivityItem'
import DailyActivityModal, { type DailyActivityOption } from './DailyActivityModal'
import DailyActivityDurationModal from './DailyActivityDurationModal'
import { ALL_DAILY_ACTIVITY_OPTIONS } from '@/data/dailyActivityOptions'

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
	is_checked?: boolean  // ← 패턴의 is_checked 상태 (true=포함, false=건너뜀) - page.tsx에서 daily_activities.is_checked 필드 추가 후 활용
}

interface Props {
	memberId: string
	patterns: PatternItem[]
	today: string
	todayLoggedTypes: string[]
	everLoggedTypes: string[]
	todayAllLoggedTypes: string[]
}

// ─── 체크 해제 확인 모달 ──────────────────────────────────────
function UncheckConfirmModal({
	activityLabel,
	onConfirm,
	onCancel,
}: {
	activityLabel: string
	onConfirm: () => void
	onCancel: () => void
}) {
	return (
		<>
			{/* 딤 배경 */}
			<div className="fixed inset-0 z-50 bg-black/30" onClick={onCancel} />

			{/* 모달 */}
			<div
				className="fixed z-50 bg-white rounded-[24px] shadow-xl overflow-hidden"
				style={{
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					width: 'calc(100% - 48px)',
					maxWidth: '360px',
				}}
			>
				<div className="flex flex-col gap-[16px] p-[24px]">
					{/* 닫기 */}
					<button
						type="button"
						onClick={onCancel}
						className="absolute top-[16px] right-[16px] opacity-50"
					>
						<X size={16} />
					</button>

					{/* 내용 */}
					<div className="flex flex-col gap-[8px] pr-[24px]">
						<p className="text-[16px] font-semibold text-gray-900 leading-6">
							{activityLabel}을(를) 해제할까요?
						</p>
						<p className="text-[13px] text-[#525252] leading-5">
							지금까지의 기록은 모두 유지돼요.
						</p>
						<p className="text-[13px] text-[#525252] leading-5">
							앞으로 이 활동은 자동으로 기록되지 않아요.
						</p>
					</div>

					{/* 버튼 */}
					<div className="flex gap-[10px] pt-[4px]">
						<button
							type="button"
							onClick={onCancel}
							className="flex-1 bg-[#f1f5f9] text-[#364153] text-[14px] font-medium rounded-[8px] px-[16px] py-[12px] leading-5"
						>
							취소
						</button>
						<button
							type="button"
							onClick={onConfirm}
							className="flex-1 bg-[#0bb489] text-white text-[14px] font-medium rounded-[8px] px-[16px] py-[12px] leading-5"
						>
							해제하기
						</button>
					</div>
				</div>
			</div>
		</>
	)
}

// ─── 오늘 레코드 확인 후 upsert ──────────────────────────────
// 오늘 레코드가 이미 있으면 (포함이든 건너뜀이든) 스킵
// 없을 때만 INSERT
async function upsertDailyLog(
	supabase: ReturnType<typeof createClient>,
	memberId: string,
	today: string,
	item: { activity_type: string; actualDuration: number; mets_value: number }
) {
	const { data: existing } = await supabase
		.from('workout_logs')
		.select('id, is_skipped')
		.eq('member_id', memberId)
		.eq('logged_at', today)
		.eq('source', 'daily')
		.eq('activity_type', item.activity_type)
		.maybeSingle()

	if (existing) return  // 이미 레코드 있으면 건드리지 않음

	await supabase.from('workout_logs').insert({
		member_id: memberId,
		logged_at: today,
		workout_type: 'other' as WorkoutType,
		duration_min: item.actualDuration,
		mets_score: item.mets_value,
		condition_memo: null,
		source: 'daily',
		activity_type: item.activity_type,
		note_workout_id: null,
	})

	return true  // INSERT 성공 시 true 반환
}

export default function DailyActivityCard({
	memberId,
	patterns,
	today,
	todayLoggedTypes,
	everLoggedTypes,
	todayAllLoggedTypes
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
				isIncluded: p.is_checked === true,  // ← todayLoggedTypes 대신
				source: 'pattern' as const,
			}))
	)

	const [showModal, setShowModal] = useState(false)
	const [editTarget, setEditTarget] = useState<DailyItem | null>(null)
	const [uncheckTarget, setUncheckTarget] = useState<DailyItem | null>(null)
	const [saving, setSaving] = useState(false)
	const [savedTypes, setSavedTypes] = useState<Set<string>>(
		new Set(todayLoggedTypes)
	)

	// ── 자동 기록 — 마운트 시 1회 실행 ────────────────────────
	useEffect(() => {
		console.log('todayLoggedTypes:', todayLoggedTypes)
		console.log('todayAllLoggedTypes:', todayAllLoggedTypes)
		console.log('everLoggedTypes:', everLoggedTypes)

		const toAutoSave = items.filter(
			i => everLoggedTypes.includes(i.activity_type)
				&& !todayAllLoggedTypes.includes(i.activity_type)
				&& i.actualDuration > 0
		)

		console.log('toAutoSave:', toAutoSave.map(i => i.activity_type))

		if (toAutoSave.length === 0) return

		async function autoSave() {
			const supabase = createClient()
			const actuallyInserted: string[] = []

			for (const i of toAutoSave) {
				const inserted = await upsertDailyLog(supabase, memberId, today, {
					activity_type: i.activity_type,
					actualDuration: i.actualDuration,
					mets_value: i.mets_value,
				})
				if (inserted) actuallyInserted.push(i.activity_type)
			}

			if (actuallyInserted.length === 0) return

			setSavedTypes(prev => new Set([...prev, ...actuallyInserted]))
			setItems(prev =>
				prev.map(i =>
					actuallyInserted.includes(i.activity_type)
						? { ...i, isIncluded: true }
						: i
				)
			)
			router.refresh()
		}

		autoSave()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const existingTypes = items.map(i => i.activity_type)

	// ── 신규 추가 ────────────────────────────────────────────────
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
				is_checked: false,
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

	// 삭제 — DELETE (패턴 완전 제거, 기록 유지)
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

	// ── 수정 ────────────────────────────────────────────────────
	function handleEdit(item: DailyItem) {
		setEditTarget(item)
	}

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

	// ── 체크 토글 — 체크 해제 시 확인 모달 ──────────────────────
	async function toggleInclude(activityType: string) {
		const item = items.find(i => i.activity_type === activityType)
		if (!item) return

		if (item.isIncluded) {
			// 체크 해제 시 → 확인 모달
			setUncheckTarget(item)
		} else {
			// 체크 시 → is_checked=true 업데이트
			const supabase = createClient()
			const item = items.find(i => i.activity_type === activityType)
			if (item?.dailyActivityId) {
				await supabase
					.from('daily_activities')
					.update({ is_checked: true })
					.eq('id', item.dailyActivityId)
			}

			// ↓ 이 부분 추가
			if (item) {
				await upsertDailyLog(supabase, memberId, today, {
					activity_type: item.activity_type,
					actualDuration: item.actualDuration,
					mets_value: item.mets_value,
				})
				setSavedTypes(prev => new Set([...prev, item.activity_type]))
				router.refresh()
			}

			setItems(prev =>
				prev.map(i =>
					i.activity_type === activityType ? { ...i, isIncluded: true } : i
				)
			)
		}
	}

	// 체크 해제 — is_active=false (패턴 비활성화, 기록 유지)
	async function confirmUncheck() {
		if (!uncheckTarget) return
		const supabase = createClient()
		if (uncheckTarget.dailyActivityId) {
			await supabase
				.from('daily_activities')
				.update({ is_checked: false })
				.eq('id', uncheckTarget.dailyActivityId)
		}
		setItems(prev =>
			prev.map(i =>
				i.activity_type === uncheckTarget.activity_type
					? { ...i, isIncluded: false }
					: i
			)
		)
		setUncheckTarget(null)
	}

	// ── 수동 저장 ────────────────────────────────────────────────
	async function save() {
		const toSave = items.filter(
			i => i.isIncluded && i.actualDuration > 0 && !savedTypes.has(i.activity_type)
		)
		if (toSave.length === 0) return
		setSaving(true)
		const supabase = createClient()

		for (const i of toSave) {
			await upsertDailyLog(supabase, memberId, today, {
				activity_type: i.activity_type,
				actualDuration: i.actualDuration,
				mets_value: i.mets_value,
			})
		}

		setSavedTypes(prev => new Set([...prev, ...toSave.map(i => i.activity_type)]))
		setSaving(false)
		router.refresh()
	}

	// const hasUnsaved = items.some(
	// 	i => i.isIncluded
	// 		&& !savedTypes.has(i.activity_type)
	// 		&& !everLoggedTypes.includes(i.activity_type)
	// )

	return (
		<>
			<div className="m-card flex flex-col gap-2 mt-5 mb-5">

				<div className="m-card-header">
					<div className="flex flex-col gap-0">
						<p className="m-card-label">일상생활활동</p>
						<p className="m-sublabel">반복되는 일상 활동을 기록해 관리하세요</p>
					</div>
				</div>

				<div className="flex flex-col">
					{items.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-3 py-8 w-full rounded-2xl bg-neutral-50 border border-neutral-200 border-dashed">
							<span className='text-xs text-center'>등록된 일상생활활동이 없습니다</span>
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

				{/* {hasUnsaved && (
					<button
						type="button"
						className="btn-primary"
						disabled={saving}
						onClick={save}
						style={{ padding: '14px 12px', borderRadius: '100px', opacity: saving ? 0.5 : 1 }}
					>
						{saving ? '저장 중...' : '일상생활활동 저장'}
					</button>
				)} */}

				<button
					type="button"
					className="btn-add"
					onClick={() => setShowModal(true)}
				>
					<span>일상생활활동 추가</span>
					<Plus size={16} style={{ color: 'var(--m-gray-600)' }} />
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
						paper_code: ALL_DAILY_ACTIVITY_OPTIONS.find(o => o.activity_type === editTarget.activity_type)?.paper_code ?? '',
						category: '',
					}}
					onConfirm={handleEditConfirm}
					onBack={() => setEditTarget(null)}
					onClose={() => setEditTarget(null)}
				/>
			)}

			{/* 체크 해제 확인 모달 */}
			{uncheckTarget && (
				<UncheckConfirmModal
					activityLabel={uncheckTarget.activity_label}
					onConfirm={confirmUncheck}
					onCancel={() => setUncheckTarget(null)}
				/>
			)}
		</>
	)
}
