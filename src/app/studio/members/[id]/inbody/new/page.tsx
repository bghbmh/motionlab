'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MemberNav from '@/components/studio/MemberNav'

// ─── 필드 정의 ───────────────────────────────────────────────────
const FIELDS = [
	{ key: 'weight', label: '체중', unit: 'kg', placeholder: '58.4' },
	{ key: 'muscle_mass', label: '근육량', unit: 'kg', placeholder: '21.2' },
	{ key: 'body_fat_pct', label: '체지방률', unit: '%', placeholder: '28.1' },
	{ key: 'body_fat_mass', label: '체지방량', unit: 'kg', placeholder: '16.4' },
	{ key: 'bmi', label: 'BMI', unit: '', placeholder: '22.1' },
	{ key: 'visceral_fat', label: '내장지방', unit: 'lv', placeholder: '10' },
] as const

type FieldKey = typeof FIELDS[number]['key']

// ─── 타입 ─────────────────────────────────────────────────────────
interface InbodyRecord {
	id: string
	measured_at: string
	created_at: string
	weight: number | null
	muscle_mass: number | null
	body_fat_pct: number | null
	body_fat_mass: number | null
	bmi: number | null
	visceral_fat: number | null
	memo: string | null
}

// ─── 인바디 입력 폼 ───────────────────────────────────────────────
function InbodyForm({
	memberId,
	editTarget,
	onSaved,
	onCancelEdit,
}: {
	memberId: string
	editTarget: InbodyRecord | null
	onSaved: () => void
	onCancelEdit: () => void
}) {
	const router = useRouter()
	const today = new Date().toISOString().split('T')[0]

	const [measDate, setMeasDate] = useState(editTarget?.measured_at ?? today)
	const [values, setValues] = useState<Record<string, string>>(
		editTarget
			? Object.fromEntries(FIELDS.map(f => [f.key, editTarget[f.key] != null ? String(editTarget[f.key]) : '']))
			: {}
	)
	const [memo, setMemo] = useState(editTarget?.memo ?? '')
	const [loading, setLoading] = useState(false)

	// editTarget 바뀌면 폼 리셋
	useEffect(() => {
		setMeasDate(editTarget?.measured_at ?? today)
		setValues(
			editTarget
				? Object.fromEntries(FIELDS.map(f => [f.key, editTarget[f.key] != null ? String(editTarget[f.key]) : '']))
				: {}
		)
		setMemo(editTarget?.memo ?? '')
	}, [editTarget])

	function updateVal(key: string, val: string) {
		setValues(prev => ({ ...prev, [key]: val }))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		const supabase = createClient()

		const payload = {
			measured_at: measDate,
			weight: values.weight ? Number(values.weight) : null,
			muscle_mass: values.muscle_mass ? Number(values.muscle_mass) : null,
			body_fat_pct: values.body_fat_pct ? Number(values.body_fat_pct) : null,
			body_fat_mass: values.body_fat_mass ? Number(values.body_fat_mass) : null,
			bmi: values.bmi ? Number(values.bmi) : null,
			visceral_fat: values.visceral_fat ? Number(values.visceral_fat) : null,
			memo: memo || null,
		}

		if (editTarget) {
			await supabase.from('inbody_records').update(payload).eq('id', editTarget.id)
		} else {
			await supabase.from('inbody_records').insert({ member_id: memberId, ...payload })
			// 신규 저장 후 폼 초기화
			setMeasDate(new Date().toISOString().split('T')[0])
			setValues({})
			setMemo('')
		}

		setLoading(false)
		onSaved()
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4 relative" style={{ width: 224, flexShrink: 0 }}>
			{/* 수정 중 표시 */}
			{editTarget && (
				<div className="alarm-banner-1 absolute w-full rounded-xl px-3 py-2 text-xs font-medium top-[-1.5rem]" >
					✏️ {editTarget.measured_at} 기록 수정 중
				</div>
			)}

			<div className="ml-card">
				<div className="mb-3">
					<p className="ml-card-label">측정 날짜</p>
					<input type="date" className="ml-input" value={measDate}
						onChange={e => setMeasDate(e.target.value)} />
				</div>
				<div>
					<p className="ml-card-label">특이사항</p>
					<input className="ml-input" placeholder="예: 생리 직후, 부종 있음"
						value={memo} onChange={e => setMemo(e.target.value)} />
				</div>
			</div>

			<div className="ml-card">
				<p className="ml-card-label">인바디 수치</p>
				<div className="flex flex-col gap-3">
					{FIELDS.map(f => (
						<div key={f.key} className="flex gap-3 items-center">
							<p className="ml-card-label flex-none m-0" style={{ width: 52 }}>{f.label}</p>
							<input
								type="number" step="0.1" className="ml-input flex-1"
								placeholder={f.placeholder}
								value={values[f.key] ?? ''}
								onChange={e => updateVal(f.key, e.target.value)}
							/>
						</div>
					))}
				</div>
			</div>

			<div className="flex gap-2">
				{editTarget ? (
					<button type="button" onClick={onCancelEdit} className="btn-ghost flex-1 py-3 text-sm">
						취소
					</button>
				) : (
					<button type="button" onClick={() => router.back()} className="btn-ghost flex-1 py-3 text-sm">
						취소
					</button>
				)}
				<button type="submit" disabled={loading} className="btn-primary py-3 text-sm"
					style={{ flex: 2, opacity: loading ? 0.5 : 1 }}>
					{loading ? '저장 중...' : editTarget ? '수정 완료' : '저장하기'}
				</button>
			</div>
		</form>
	)
}

function formatDateTime(isoString: string) {
	const d = new Date(isoString)
	const yy = String(d.getFullYear()).slice(2)
	const mm = String(d.getMonth() + 1).padStart(2, '0')
	const dd = String(d.getDate()).padStart(2, '0')
	const hh = String(d.getHours()).padStart(2, '0')
	const min = String(d.getMinutes()).padStart(2, '0')
	return `${yy}.${mm}.${dd} ${hh}:${min}`
}

// ─── 인바디 카드 ──────────────────────────────────────────────────
function InbodyCard({
	record,
	onEdit,
	onDelete,
}: {
	record: InbodyRecord
	onEdit: () => void
	onDelete: () => void
}) {
	const items: [string, string][] = [
		['체중', record.weight != null ? `${record.weight}kg` : '—'],
		['근육량', record.muscle_mass != null ? `${record.muscle_mass}kg` : '—'],
		['체지방률', record.body_fat_pct != null ? `${record.body_fat_pct}%` : '—'],
		['체지방량', record.body_fat_mass != null ? `${record.body_fat_mass}kg` : '—'],
		['BMI', record.bmi != null ? `${record.bmi}` : '—'],
		['내장지방', record.visceral_fat != null ? `${record.visceral_fat}` : '—'],
	]

	return (
		<div className="ml-card">
			<div className="flex items-center justify-between gap-2 mb-3">
				<div className="flex items-center gap-2 flex-wrap">
					{/* 측정 날짜 */}
					<span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
						측정일
					</span>
					<span className="font-mono text-xs font-medium" style={{ color: '#3DDBB5' }}>
						{formatDateTime(record.created_at)}
					</span>
					{/* 등록 시각 */}

					{record.memo && (
						<span className="text-[10px] px-2 py-0.5 rounded-full"
							style={{ background: '#1a2740', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
							{record.memo}
						</span>
					)}
				</div>
				<div className="flex gap-1 shrink-0">
					<button onClick={onEdit}
						className="rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer"
						style={{ background: 'rgba(61,219,181,0.08)', border: '1px solid rgba(61,219,181,0.2)', color: 'rgba(61,219,181,0.75)' }}>
						수정
					</button>
					<button onClick={onDelete}
						className="rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer"
						style={{ background: 'rgba(255,107,91,0.08)', border: '1px solid rgba(255,107,91,0.2)', color: 'rgba(255,107,91,0.75)' }}>
						삭제
					</button>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
				{items.map(([label, val]) => (
					<dl key={label} className="flex justify-between gap-1">
						<dt style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</dt>
						<dd className="font-mono text-white">{val}</dd>
					</dl>
				))}
			</div>
		</div>
	)
}

// ─── 삭제 확인 모달 ───────────────────────────────────────────────
function DeleteConfirm({
	record,
	onCancel,
	onConfirm,
}: {
	record: InbodyRecord
	onCancel: () => void
	onConfirm: () => void
}) {
	const [loading, setLoading] = useState(false)

	async function handleConfirm() {
		setLoading(true)
		await onConfirm()
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-5"
			style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
			onClick={onCancel}>
			<div className="w-full max-w-xs rounded-2xl p-6 flex flex-col gap-4"
				style={{ background: '#141e2e', border: '1px solid rgba(255,107,91,0.25)' }}
				onClick={e => e.stopPropagation()}>
				<div className="text-center">
					<p className="text-2xl mb-2">🗑️</p>
					<p className="text-sm font-semibold text-white">인바디 기록을 삭제할까요?</p>
					<p className="text-xs mt-1 font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
						{record.measured_at}
					</p>
					<p className="text-xs mt-1" style={{ color: 'rgba(255,107,91,0.7)' }}>
						삭제 후 복구할 수 없습니다.
					</p>
				</div>
				<div className="flex gap-2">
					<button onClick={onCancel} className="btn-ghost flex-1 py-2.5 text-sm">취소</button>
					<button onClick={handleConfirm} disabled={loading}
						className="flex-1 py-2.5 text-sm font-bold rounded-xl"
						style={{ background: 'rgba(255,107,91,0.15)', border: '1px solid rgba(255,107,91,0.4)', color: '#FF6B5B', opacity: loading ? 0.5 : 1 }}>
						{loading ? '삭제 중...' : '삭제'}
					</button>
				</div>
			</div>
		</div>
	)
}

// ─── 메인 페이지 ─────────────────────────────────────────────────
export default function InbodyPage() {
	const { id } = useParams<{ id: string }>()

	const [records, setRecords] = useState<InbodyRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [editTarget, setEditTarget] = useState<InbodyRecord | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<InbodyRecord | null>(null)

	const fetchRecords = useCallback(async () => {
		const supabase = createClient()
		const { data } = await supabase
			.from('inbody_records')
			.select('id, measured_at, created_at, weight, muscle_mass, body_fat_pct, body_fat_mass, bmi, visceral_fat, memo')
			.eq('member_id', id)
			.order('created_at', { ascending: false })

		setRecords((data ?? []) as InbodyRecord[])
		setLoading(false)
	}, [id])

	useEffect(() => { fetchRecords() }, [fetchRecords])

	async function handleDelete(record: InbodyRecord) {
		const supabase = createClient()
		await supabase.from('inbody_records').delete().eq('id', record.id)
		setDeleteTarget(null)
		fetchRecords()
	}

	return (
		<div>
			<MemberNav memberId={id} />

			<div className="flex gap-5">

				{/* 왼쪽: 기록 목록 */}
				<div className="flex-1 flex flex-col gap-3 min-w-0">
					<div className="flex justify-between items-center">
						<h2 className="text-base font-bold text-white">인바디 기록</h2>
						{!loading && (
							<span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
								총 {records.length}개
							</span>
						)}
					</div>

					{loading ? (
						<div className="flex justify-center pt-12">
							<div className="w-6 h-6 rounded-full border-2 animate-spin"
								style={{ borderColor: 'rgba(61,219,181,0.3)', borderTopColor: 'transparent' }} />
						</div>
					) : records.length === 0 ? (
						<div className="text-center py-20">
							<p className="text-3xl mb-3">📊</p>
							<p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
								아직 인바디 기록이 없습니다.
							</p>
						</div>
					) : (
						records.map(record => (
							<InbodyCard
								key={record.id}
								record={record}
								onEdit={() => setEditTarget(record)}
								onDelete={() => setDeleteTarget(record)}
							/>
						))
					)}
				</div>

				{/* 오른쪽: 입력 폼  */}
				<InbodyForm
					memberId={id}
					editTarget={editTarget}
					onSaved={() => { setEditTarget(null); fetchRecords() }}
					onCancelEdit={() => setEditTarget(null)}
				/>



			</div>

			{deleteTarget && (
				<DeleteConfirm
					record={deleteTarget}
					onCancel={() => setDeleteTarget(null)}
					onConfirm={() => handleDelete(deleteTarget)}
				/>
			)}
		</div>
	)
}
