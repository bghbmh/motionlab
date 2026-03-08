'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const today = new Date().toISOString().split('T')[0]

const FIELDS = [
	{ key: 'weight', label: '체중 (kg)', placeholder: '58.4' },
	{ key: 'muscle_mass', label: '근육량 (kg)', placeholder: '21.2' },
	{ key: 'body_fat_pct', label: '체지방률 (%)', placeholder: '28.1' },
	{ key: 'body_fat_mass', label: '체지방량 (kg)', placeholder: '16.4' },
	{ key: 'bmi', label: 'BMI', placeholder: '22.1' },
	{ key: 'bmr', label: '기초대사량 (kcal)', placeholder: '1320' },
] as const

export default function NewInbodyPage() {
	const router = useRouter()
	const { id } = useParams<{ id: string }>()   // ← useParams 사용

	const [measDate, setMeasDate] = useState(today)
	const [values, setValues] = useState<Record<string, string>>({})
	const [memo, setMemo] = useState('')
	const [loading, setLoading] = useState(false)

	function updateVal(key: string, val: string) {
		setValues(prev => ({ ...prev, [key]: val }))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)

		const supabase = createClient()
		const { error } = await supabase.from('inbody_records').insert({
			member_id: id,
			measured_at: measDate,
			weight: values.weight ? Number(values.weight) : null,
			muscle_mass: values.muscle_mass ? Number(values.muscle_mass) : null,
			body_fat_pct: values.body_fat_pct ? Number(values.body_fat_pct) : null,
			body_fat_mass: values.body_fat_mass ? Number(values.body_fat_mass) : null,
			bmi: values.bmi ? Number(values.bmi) : null,
			bmr: values.bmr ? Number(values.bmr) : null,
			memo: memo || null,
		})

		if (!error) {
			router.push(`/studio/members/${id}`)
			router.refresh()
		}
		setLoading(false)
	}

	return (
		<div className="flex gap-5" style={{ maxWidth: 720 }}>
			<form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">

				<div className="ml-card">
					<p className="ml-card-label">측정 정보</p>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="ml-card-label">측정 날짜</p>
							<input
								type="date"
								className="ml-input"
								value={measDate}
								onChange={e => setMeasDate(e.target.value)}
							/>
						</div>
						<div>
							<p className="ml-card-label">특이사항</p>
							<input
								className="ml-input"
								placeholder="예: 생리 직후, 부종 있음"
								value={memo}
								onChange={e => setMemo(e.target.value)}
							/>
						</div>
					</div>
				</div>

				<div className="ml-card">
					<p className="ml-card-label">인바디 수치</p>
					<div className="grid grid-cols-3 gap-3">
						{FIELDS.map(f => (
							<div key={f.key}>
								<p className="ml-card-label">{f.label}</p>
								<input
									type="number"
									step="0.1"
									className="ml-input"
									placeholder={f.placeholder}
									value={values[f.key] ?? ''}
									onChange={e => updateVal(f.key, e.target.value)}
								/>
							</div>
						))}
					</div>
				</div>

				<div className="flex gap-3">
					<button type="button" onClick={() => router.back()} className="btn-ghost flex-1 py-3">
						취소
					</button>
					<button type="submit" disabled={loading} className="btn-primary py-3"
						style={{ flex: 2, opacity: loading ? 0.5 : 1 }}>
						{loading ? '저장 중...' : '저장하기'}
					</button>
				</div>
			</form>
		</div>
	)
}
