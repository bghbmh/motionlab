'use client'

// src/components/admin/inbody/InbodyForm.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { InbodyRecord } from '@/types/database'

const FIELDS = [
	{ key: 'weight', label: '체중', unit: 'kg', placeholder: '58.4' },
	{ key: 'muscle_mass', label: '근육량', unit: 'kg', placeholder: '21.2' },
	{ key: 'body_fat_pct', label: '체지방률', unit: '%', placeholder: '28.1' },
	{ key: 'body_fat_mass', label: '체지방량', unit: 'kg', placeholder: '16.4' },
	{ key: 'bmi', label: 'BMI', unit: '', placeholder: '22.1' },
	{ key: 'visceral_fat', label: '내장지방', unit: 'lv', placeholder: '10' },
] as const

interface Props {
	memberId: string
	editTarget?: InbodyRecord | null
	onSaved?: () => void
	onCancel?: () => void
}

export function InbodyForm({ memberId, editTarget, onSaved, onCancel }: Props) {
	const router = useRouter()
	const today = new Date().toISOString().split('T')[0]

	const [measDate, setMeasDate] = useState(editTarget?.measured_at ?? today)
	const [memo, setMemo] = useState(editTarget?.memo ?? '')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [values, setValues] = useState<Record<string, string>>(
		editTarget
			? Object.fromEntries(
				FIELDS.map(f => [f.key, editTarget[f.key] != null ? String(editTarget[f.key]) : ''])
			)
			: {}
	)

	function updateVal(key: string, val: string) {
		setValues(prev => ({ ...prev, [key]: val }))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		setError('')

		const supabase = createClient()

		const payload = {
			member_id: memberId,
			measured_at: measDate,
			memo: memo.trim() || null,
			weight: values.weight ? Number(values.weight) : null,
			muscle_mass: values.muscle_mass ? Number(values.muscle_mass) : null,
			body_fat_pct: values.body_fat_pct ? Number(values.body_fat_pct) : null,
			body_fat_mass: values.body_fat_mass ? Number(values.body_fat_mass) : null,
			bmi: values.bmi ? Number(values.bmi) : null,
			visceral_fat: values.visceral_fat ? Number(values.visceral_fat) : null,
		}

		if (editTarget) {
			const { error: err } = await supabase
				.from('inbody_records')
				.update(payload)
				.eq('id', editTarget.id)
			if (err) { setError('수정 중 오류가 발생했습니다.'); setLoading(false); return }
		} else {
			const { error: err } = await supabase
				.from('inbody_records')
				.insert(payload)
			if (err) { setError('저장 중 오류가 발생했습니다.'); setLoading(false); return }
		}

		setLoading(false)
		router.refresh()
		onSaved?.()
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col relative bg-white w-full">
			{/* 수정 중 표시 */}
			{editTarget && (
				<div className="alarm-banner-1 absolute w-full rounded-xl px-3 py-2 text-xs font-medium " style={{ bottom: 'calc(100% + 3rem)' }}>
					✏️ {editTarget.measured_at} 기록 수정 중
				</div>
			)}

			<div className="m-card">
				<div className="mb-3">
					<p className="m-card-label">측정 날짜</p>
					<input
						type="date"
						className="m-input text-sm"
						value={measDate}
						onChange={e => setMeasDate(e.target.value)}
					/>
				</div>
				<div>
					<p className="m-card-label">특이사항</p>
					<input
						className="m-input"
						placeholder="예: 생리 직후, 부종 있음"
						value={memo}
						onChange={e => setMemo(e.target.value)}
					/>
				</div>
			</div>

			<div className="m-card">
				<p className="m-card-label">인바디 수치</p>
				<div className="flex flex-col gap-3 w-full">
					{FIELDS.map(f => (
						<div key={f.key} className="flex gap-1 items-center">
							<p className="m-card-label flex-none m-0" style={{ width: 52 }}>{f.label}</p>
							<input
								type="number"
								step="0.1"
								className="m-input text-sm flex-1"
								placeholder={f.placeholder}
								value={values[f.key] ?? ''}
								onChange={e => updateVal(f.key, e.target.value)}
							/>
						</div>
					))}
				</div>
			</div>

			{error && (
				<p className="px-3 text-xs text-red-500">{error}</p>
			)}

			<div className="flex gap-1 px-3 pb-4">
				<button
					type="button"
					onClick={onCancel}
					className="btn-ghost bg-slate-200 flex-1 py-3 text-sm"
				>
					취소
				</button>
				<button
					type="submit"
					disabled={loading}
					className="btn-primary py-3 text-sm"
					style={{ flex: 2, opacity: loading ? 0.5 : 1 }}
				>
					{loading ? '저장 중...' : editTarget ? '수정 완료' : '저장하기'}
				</button>
			</div>
		</form>
	)
}
