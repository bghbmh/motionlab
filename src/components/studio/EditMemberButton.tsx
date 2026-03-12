'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
	memberId: string
	memberName: string
	memberPhone: string | null
	memberBirthDate: string | null
	memberSessionsPerWeek: number
	memberMemo: string | null
	memberWeekStartDate: string | null   // ← 추가
}

export default function EditMemberButton({
	memberId,
	memberName,
	memberPhone,
	memberBirthDate,
	memberSessionsPerWeek,
	memberMemo,
	memberWeekStartDate
}: Props) {
	const router = useRouter()
	const [showModal, setShowModal] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

	const [form, setForm] = useState({
		name: memberName,
		phone: memberPhone ?? '',
		birth_date: memberBirthDate ?? '',
		sessions_per_week: String(memberSessionsPerWeek),
		memo: memberMemo ?? '',
		week_start_date: memberWeekStartDate ?? '',   // ← 추가
	})
	const [loading, setLoading] = useState(false)
	const [deleteLoading, setDeleteLoading] = useState(false)
	const [error, setError] = useState('')

	function update(key: string, value: string) {
		setForm(prev => ({ ...prev, [key]: value }))
	}

	async function handleSave(e: React.FormEvent) {
		e.preventDefault()
		if (!form.name.trim()) { setError('이름을 입력해주세요.'); return }
		setLoading(true)
		setError('')

		const supabase = createClient()
		const { error } = await supabase
			.from('members')
			.update({
				name: form.name.trim(),
				phone: form.phone || null,
				birth_date: form.birth_date || null,
				sessions_per_week: Number(form.sessions_per_week),
				memo: form.memo || null,
				week_start_date: form.week_start_date || null,
			})
			.eq('id', memberId)

		if (error) {
			setError('저장 중 오류가 발생했습니다.')
			setLoading(false)
			return
		}

		setShowModal(false)
		router.refresh()
		setLoading(false)
	}

	async function handleDelete() {
		setDeleteLoading(true)
		const supabase = createClient()
		await supabase.from('members').update({ is_active: false }).eq('id', memberId)
		router.push('/studio')
		router.refresh()
	}

	return (
		<>
			<button
				type="button"
				onClick={() => setShowModal(true)}
				className="btn-ghost text-xs py-1 px-2.5"
			>
				회원정보 수정
			</button>

			{/* ── 수정 모달 ── */}
			{showModal && (
				<div
					className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center px-4"
					onClick={() => { setShowModal(false); setShowDeleteConfirm(false) }}
				>
					<div
						className="bg-card border border-white/10 rounded-2xl p-7 w-full max-w-md shadow-2xl"
						onClick={e => e.stopPropagation()}
					>
						{/* 헤더 */}
						<div className="flex justify-between items-center mb-6">
							<p className="font-mono text-mint text-base font-medium">회원정보 수정</p>
							<button
								onClick={() => { setShowModal(false); setShowDeleteConfirm(false) }}
								className="btn-ghost text-xs py-1 px-2.5"
							>
								✕
							</button>
						</div>

						<form onSubmit={handleSave} className="flex flex-col gap-3">
							{[
								{ key: 'name', label: '이름', placeholder: '홍길동', type: 'text' },
								{ key: 'phone', label: '연락처', placeholder: '010-0000-0000', type: 'tel' },
								{ key: 'birth_date', label: '생년월일', placeholder: '', type: 'date' },
								{ key: 'sessions_per_week', label: '주 수업 횟수', placeholder: '2', type: 'number' },
							].map(({ key, label, placeholder, type }) => (
								<div key={key}>
									<p className="ml-card-label mb-1 mt-2">{label}</p>
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
								<p className="ml-card-label mb-1 mt-2">주간 시작 기준일</p>
								<input
									className="ml-input"
									type="date"
									value={form.week_start_date}
									onChange={e => update('week_start_date', e.target.value)}
								/>
								<p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
									이 날짜 기준으로 7일 단위 주간 그래프가 표시됩니다
								</p>
							</div>

							<div>
								<p className="ml-card-label mb-1 mt-2">특이사항 (선택)</p>
								<input
									className="ml-input"
									placeholder="예: 허리 디스크 주의, 임신 중"
									value={form.memo}
									onChange={e => update('memo', e.target.value)}
								/>
							</div>

							{error && <p className="text-coral text-xs">{error}</p>}

							<div className="flex gap-2 mt-2">
								<button type="button" onClick={() => { setShowModal(false); setShowDeleteConfirm(false) }}
									className="btn-ghost flex-1 py-3">
									취소
								</button>
								<button type="submit" disabled={loading}
									className="btn-primary flex-[2] py-3 disabled:opacity-50">
									{loading ? '저장 중...' : '저장하기'}
								</button>
							</div>
						</form>

						{/* ── 회원 삭제 영역 ── */}
						<div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
							{!showDeleteConfirm ? (
								<button
									type="button"
									onClick={() => setShowDeleteConfirm(true)}
									className="w-full py-2.5 text-xs font-medium rounded-xl transition-all"
									style={{
										background: 'transparent',
										border: '1px solid rgba(255,107,91,0.2)',
										color: 'rgba(255,107,91,0.6)',
									}}
								>
									회원 삭제
								</button>
							) : (
								<div className="flex flex-col gap-2">
									<p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
										정말 삭제할까요? 데이터는 보존됩니다.
									</p>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={() => setShowDeleteConfirm(false)}
											className="btn-ghost flex-1 py-2 text-xs"
										>
											취소
										</button>
										<button
											type="button"
											onClick={handleDelete}
											disabled={deleteLoading}
											className="flex-1 py-2 text-xs font-bold rounded-xl transition-all"
											style={{
												background: 'rgba(255,107,91,0.15)',
												border: '1px solid rgba(255,107,91,0.4)',
												color: '#FF6B5B',
												opacity: deleteLoading ? 0.5 : 1,
											}}
										>
											{deleteLoading ? '처리 중...' : '삭제 확인'}
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	)
}
