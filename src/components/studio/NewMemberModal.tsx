'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
	studioId: string
	onClose: () => void
	onSuccess: () => void
}

export default function NewMemberModal({ studioId, onClose, onSuccess }: Props) {
	const [form, setForm] = useState({
		name: '',
		phone: '',
		birth_date: '',
		sessions_per_week: '2',
		memo: '',
	})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	function update(key: string, value: string) {
		setForm(prev => ({ ...prev, [key]: value }))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!form.name.trim()) { setError('이름을 입력해주세요.'); return }

		setLoading(true)
		setError('')

		const supabase = createClient()
		const { error } = await supabase.from('members').insert({
			studio_id: studioId,
			name: form.name.trim(),
			phone: form.phone || null,
			birth_date: form.birth_date || null,
			sessions_per_week: Number(form.sessions_per_week),
			memo: form.memo || null,
		})

		if (error) {
			setError('저장 중 오류가 발생했습니다.')
			setLoading(false)
			return
		}

		onSuccess()
	}

	return (
		<div
			className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center px-4"
			onClick={onClose}
		>
			<div
				className="bg-card border border-mint/20 rounded-2xl p-7 w-full max-w-md
                   shadow-2xl"
				onClick={e => e.stopPropagation()}
			>
				{/* 헤더 */}
				<div className="flex justify-between items-center mb-6">
					<p className="font-mono text-mint text-base font-medium">신규회원 등록</p>
					<button onClick={onClose} className="btn-ghost text-xs py-1 px-2.5">✕</button>
				</div>

				<form onSubmit={handleSubmit} className="flex flex-col gap-3">
					{[
						{ key: 'name', label: '이름', placeholder: '홍길동', type: 'text' },
						{ key: 'phone', label: '연락처', placeholder: '010-0000-0000', type: 'tel' },
						{ key: 'birth_date', label: '생년월일', placeholder: '', type: 'date' },
						{ key: 'sessions_per_week', label: '주 수업 횟수', placeholder: '2', type: 'number' },
					].map(({ key, label, placeholder, type }) => (
						<div key={key}>
							<p className="ml-card-label">{label}</p>
							<input
								className="ml-input"
								type={type}
								placeholder={placeholder}
								value={form[key as keyof typeof form]}
								onChange={e => update(key, e.target.value)}
								min={type === 'number' ? 1 : undefined}
								max={type === 'number' ? 7 : undefined}
							/>
						</div>
					))}

					<div>
						<p className="ml-card-label">특이사항 (선택)</p>
						<input
							className="ml-input"
							placeholder="예: 허리 디스크 주의, 임신 중"
							value={form.memo}
							onChange={e => update('memo', e.target.value)}
						/>
					</div>

					{error && <p className="text-coral text-xs">{error}</p>}

					<div className="flex gap-2 mt-2">
						<button type="button" onClick={onClose}
							className="btn-ghost flex-1 py-3">취소</button>
						<button type="submit" disabled={loading}
							className="btn-primary flex-[2] py-3 disabled:opacity-50">
							{loading ? '저장 중...' : '등록하기'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
