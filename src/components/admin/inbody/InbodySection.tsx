'use client'

// src/components/admin/inbody/InbodySection.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { InbodyRecord } from '@/types/database'
import { InbodyCardItem } from '../ui/InbodyCardItem'
import { InbodyForm } from './InbodyForm'
import { ChevronDown, ChevronUp } from 'lucide-react'

type MetricKey = keyof Pick<
	InbodyRecord,
	'weight' | 'muscle_mass' | 'body_fat_pct' | 'body_fat_mass' | 'bmi' | 'visceral_fat'
>

interface MetricConfig {
	key: MetricKey
	label: string
	unit: string
	lowerIsBetter: boolean
}

const METRICS: MetricConfig[] = [
	{ key: 'weight', label: '체중', unit: 'kg', lowerIsBetter: true },
	{ key: 'muscle_mass', label: '근육량', unit: 'kg', lowerIsBetter: false },
	{ key: 'body_fat_pct', label: '체지방률', unit: '%', lowerIsBetter: true },
	{ key: 'body_fat_mass', label: '체지방량', unit: 'kg', lowerIsBetter: true },
	{ key: 'bmi', label: 'BMI', unit: '', lowerIsBetter: true },
	{ key: 'visceral_fat', label: '내장지방', unit: '', lowerIsBetter: true },
]

function formatDiff(diff: number): string {
	const abs = Math.abs(diff).toFixed(1).replace(/\.0$/, '')
	return diff < 0 ? `▼ ${abs}` : `▲ ${abs}`
}

// ─── 삭제 확인 다이얼로그 ────────────────────────────────────────
function DeleteConfirm({
	record,
	onCancel,
	onConfirm,
	loading,
}: {
	record: InbodyRecord
	onCancel: () => void
	onConfirm: () => void
	loading: boolean
}) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center px-5"
			style={{ background: 'rgba(0,0,0,0.5)' }}
			onClick={onCancel}
		>
			<div
				className="w-full max-w-xs bg-white rounded-2xl p-6 flex flex-col gap-4 shadow-xl"
				onClick={e => e.stopPropagation()}
			>
				<div className="text-center">
					<p className="text-2xl mb-2">🗑️</p>
					<p className="text-sm font-semibold text-gray-900">인바디 기록을 삭제할까요?</p>
					<p className="text-xs text-gray-400 mt-1">{record.measured_at} 기록</p>
					<p className="text-xs text-red-500 mt-1">삭제 후 복구할 수 없습니다.</p>
				</div>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={onCancel}
						className="flex-1 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
					>
						취소
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={loading}
						className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
					>
						{loading ? '삭제 중...' : '삭제'}
					</button>
				</div>
			</div>
		</div>
	)
}

// ─── Props ───────────────────────────────────────────────────────
interface InbodySectionProps {
	memberId: string
	records: InbodyRecord[]
}

export default function InbodySection({ memberId, records }: InbodySectionProps) {
	const router = useRouter()
	const [isFormOpen, setFormOpen] = useState(true)
	const [editTarget, setEditTarget] = useState<InbodyRecord | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<InbodyRecord | null>(null)
	const [deleteLoading, setDeleteLoading] = useState(false)

	// 수정 버튼 클릭
	function handleEdit(rec: InbodyRecord) {
		setEditTarget(rec)
		setFormOpen(true)
		// 폼으로 스크롤
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	// 수정 취소
	function handleCancelEdit() {
		setEditTarget(null)
		// 새 기록 추가 모드가 아니면 폼 닫기
		//setFormOpen(false)
	}

	// 저장 완료
	function handleSaved() {
		setEditTarget(null)
		setFormOpen(false)
		router.refresh()
	}

	// 삭제 확인
	async function handleDeleteConfirm() {
		if (!deleteTarget) return
		setDeleteLoading(true)
		const supabase = createClient()
		await supabase.from('inbody_records').delete().eq('id', deleteTarget.id)
		setDeleteLoading(false)
		setDeleteTarget(null)
		router.refresh()
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 py-4 items-start">

			{/* 왼쪽: 기록 목록 */}
			<div className="col-span-full md:col-span-2 lg:col-span-3 order-2 md:order-none inbodyrecord-list  min-w-0">
				{records.length === 0 && (
					<div className="flex flex-col items-center justify-center py-16 text-sm text-neutral-400">
						아직 인바디 기록이 없습니다
					</div>
				)}

				{records.map((rec, recIdx) => {
					const measuredAt = rec.measured_at
						? new Date(rec.measured_at).toLocaleDateString('ko-KR', {
							year: 'numeric', month: '2-digit', day: '2-digit',
						}).replace(/\. /g, '-').replace('.', '')
						: null

					const isEditing = editTarget?.id === rec.id

					return (
						<div
							key={rec.id}
							className={`bg-white mb-3 rounded-xl border transition-colors ${isEditing ? 'border-[#0bb489]' : 'border-neutral-200'}`}
						>
							<div className="flex items-center justify-between p-2">
								<span className="text-xs text-neutral-700 font-medium">{measuredAt}</span>
								<div className="inline-flex gap-1">
									<button
										type="button"
										onClick={() => handleEdit(rec)}
										className={`btn-default px-2 py-1 text-xs ${isEditing ? 'text-[#0bb489] border-[#0bb489] bg-teal-50' : ''}`}
									>
										{isEditing ? '수정 중' : '수정'}
									</button>
									<button
										type="button"
										onClick={() => setDeleteTarget(rec)}
										className="btn-default px-2 py-1 text-xs text-red-500 border-red-400 hover:bg-red-50"
									>
										삭제
									</button>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 flex-wrap bg-white px-2 pb-2">
								{METRICS.map(({ key, label, unit }) => {
									const value = rec[key]
									if (value === null || value === undefined) return null

									const previousInbody = recIdx < records.length - 1 ? records[recIdx + 1] : null
									const prevValue = previousInbody?.[key] ?? null
									const diff = prevValue !== null
										? (value as number) - (prevValue as number)
										: null

									let isGood = false
									let diffText = ''
									if (diff !== null && diff !== 0) {
										diffText = formatDiff(diff)
										isGood = diff < 0
									}

									return (
										<InbodyCardItem
											key={key}
											label={label}
											value={rec[key] || null}
											unit={unit}
											status={isGood}
											gap={diffText}
											className="flex-1 flex-col items-start"
										/>
									)
								})}
							</div>
						</div>
					)
				})}
			</div>

			{/* 오른쪽: 입력 폼 */}
			<div className="col-span-1 rounded-md bg-white shrink-0 order-1 md:order-none">
				<button
					type="button"
					className={`btn-default px-2 text-sm justify-between w-full border-transparent ${isFormOpen ? 'bg-gray-300 rounded-b-none' : ''}`}
					onClick={() => {
						if (isFormOpen && !editTarget) {
							setFormOpen(false)
						} else {
							setEditTarget(null)
							setFormOpen(true)
						}
					}}
				>
					{editTarget ? '인바디 기록 수정 중' : '인바디 기록 입력하기'}
					{isFormOpen ? <ChevronUp /> : <ChevronDown />}
				</button>

				{isFormOpen && (
					<InbodyForm
						key={editTarget?.id ?? 'new'}   // ← 이거 하나면 됨
						memberId={memberId}
						editTarget={editTarget}
						onSaved={handleSaved}
						onCancel={handleCancelEdit}
					/>
				)}
			</div>

			{/* 삭제 확인 모달 */}
			{deleteTarget && (
				<DeleteConfirm
					record={deleteTarget}
					onCancel={() => setDeleteTarget(null)}
					onConfirm={handleDeleteConfirm}
					loading={deleteLoading}
				/>
			)}
		</div>
	)
}
