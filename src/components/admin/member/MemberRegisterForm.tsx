'use client'

// src/components/admin/member/MemberRegisterForm.tsx
// 신규회원 등록 폼 — 기본정보 + 생활패턴(선택)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Equal } from 'lucide-react'

// ─── 생활 활동 옵션 ─────────────────────────────────────────────── 
import {
	ALL_DAILY_ACTIVITY_OPTIONS,
	DAILY_ACTIVITY_CATEGORIES,
	type DailyActivityOption,
	type DailyActivityCategory,
} from '@/data/dailyActivityOptions'

interface ActivityRow {
	activity_type: string
	activity_label: string
	mets_value: number
	paper_code: string
	duration_min_per_day: string
	frequency_per_week: string
	note: string
}

interface Props {
	studioId: string
	instructorId: string
}

// ─── 섹션 래퍼 ───────────────────────────────────────────────────
function FormSection({ title, sub, children }: {
	title: string
	sub?: string
	children: React.ReactNode
}) {
	return (
		<div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
			<div className="px-5 py-3.5 border-b border-neutral-100">
				<h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
				{sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
			</div>
			<div className="px-5 py-4 flex flex-col gap-4">{children}</div>
		</div>
	)
}

// 필드 래퍼
function Field({ label, required, children }: {
	label: string
	required?: boolean
	children: React.ReactNode
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<label className="text-xs font-semibold text-neutral-600 pl-1.5">
				{label}{required && <span className="text-red-500 ml-0.5">*</span>}
			</label>
			{children}
		</div>
	)
}

const inputCls = "w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-300 focus:outline-none focus:border-primary transition-colors bg-white"

export default function MemberRegisterForm({ studioId, instructorId }: Props) {
	const router = useRouter()

	const [form, setForm] = useState({
		name: '',
		phone: '',
		birth_date: '',
		sessions_per_week: '2',
		registered_at: new Date().toISOString().split('T')[0],
		memo: '',
	})
	const [activities, setActivities] = useState<ActivityRow[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	function update(key: string, value: string) {
		setForm(prev => ({ ...prev, [key]: value }))
	}

	function addActivity(opt: typeof ALL_DAILY_ACTIVITY_OPTIONS[number]) {
		if (activities.find(a => a.activity_type === opt.activity_type)) return
		setActivities(prev => [...prev, {
			activity_type: opt.activity_type,
			activity_label: opt.activity_label,
			mets_value: opt.mets_value,
			paper_code: opt.paper_code,
			duration_min_per_day: '30',
			frequency_per_week: '7',
			note: '',
		}])
	}

	function removeActivity(type: string) {
		setActivities(prev => prev.filter(a => a.activity_type !== type))
	}

	function updateActivity(type: string, key: keyof ActivityRow, value: string) {
		setActivities(prev => prev.map(a =>
			a.activity_type === type ? { ...a, [key]: value } : a
		))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!form.name.trim()) { setError('이름을 입력해주세요.'); return }
		setLoading(true)
		setError('')

		const supabase = createClient()

		// 1. 회원 등록
		const { data: member, error: memberError } = await supabase
			.from('members')
			.insert({
				studio_id: studioId,
				instructor_id: instructorId,
				name: form.name.trim(),
				phone: form.phone || null,
				birth_date: form.birth_date || null,
				sessions_per_week: Number(form.sessions_per_week),
				registered_at: form.registered_at,
				memo: form.memo || null,
			})
			.select('id')
			.single()

		if (memberError || !member) {
			setError('회원 등록 중 오류가 발생했습니다.')
			setLoading(false)
			return
		}

		// 2. 생활패턴 저장
		const validActivities = activities.filter(a => Number(a.duration_min_per_day) > 0)
		if (validActivities.length > 0) {
			await supabase.from('daily_activities').insert(
				validActivities.map(a => ({
					member_id: member.id,
					recorded_at: form.registered_at,
					activity_type: a.activity_type,
					activity_label: a.activity_label,
					mets_value: a.mets_value,
					duration_min_per_day: Number(a.duration_min_per_day),
					frequency_per_week: Number(a.frequency_per_week),
					paper_code: a.paper_code,
					note: a.note || null,
				}))
			)
		}

		// 3. 앱 설치 권유 알림 생성 ← 추가
		await supabase.from('notifications').insert({
			member_id: member.id,
			type: 'app_install',
			message: `${form.name.trim()}님, 모션로그 앱을 설치하면 더 편리하게 사용할 수 있어요. 지금 설치해보세요!`,
			is_read: false,
		})

		router.push(`/studio/members/${member.id}`)
		router.refresh()
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">

			{/* ── 기본 정보 ──────────────────────────────────────── */}
			<FormSection title="기본 정보">
				<Field label="이름" required>
					<input
						className={inputCls}
						type="text"
						placeholder="홍길동"
						value={form.name}
						onChange={e => update('name', e.target.value)}
					/>
				</Field>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					<Field label="등록일" required>
						<input
							className={inputCls}
							type="date"
							value={form.registered_at}
							onChange={e => update('registered_at', e.target.value)}
						/>
					</Field>
					<Field label="주 수업 횟수" required>
						<div className="flex items-center gap-2">
							<input
								className={inputCls}
								type="number"
								min={1}
								max={7}
								value={form.sessions_per_week}
								onChange={e => update('sessions_per_week', e.target.value)}
							/>
							<span className="text-sm  shrink-0">회 / 주</span>
						</div>
					</Field>
				</div>


				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					<Field label="연락처">
						<input
							className={inputCls}
							type="tel"
							placeholder="01012345678"
							value={form.phone}
							onChange={e => update('phone', e.target.value)}
						/>
					</Field>
					<Field label="생년월일">
						<input
							className={inputCls}
							type="date"
							value={form.birth_date}
							onChange={e => update('birth_date', e.target.value)}
						/>
					</Field>
				</div>



				<Field label="특이사항">
					<textarea
						rows={3}
						className={inputCls}
						placeholder="예: 허리 디스크 주의, 임신 중"
						value={form.memo}
						onChange={e => update('memo', e.target.value)}
					/>
				</Field>
			</FormSection>

			{/* ── 생활 패턴 ──────────────────────────────────────── */}
			<FormSection
				title="비방문일 생활 패턴"
				sub="선택 사항 · 상담 내용을 기반으로 입력해주세요"
			>
				{/* 카테고리별 선택 버튼 */}
				{DAILY_ACTIVITY_CATEGORIES.map(cat => (
					<div key={cat}>
						<p className="text-xs font-semibold text-neutral-600 mb-2 pl-1.5">{cat}</p>
						<div className="flex flex-wrap gap-1.5">
							{ALL_DAILY_ACTIVITY_OPTIONS
								.filter(o => o.category === cat)
								.map(opt => {
									const isAdded = activities.some(a => a.activity_type === opt.activity_type)
									return (
										<button
											key={opt.activity_type}
											type="button"
											onClick={() => isAdded ? removeActivity(opt.activity_type) : addActivity(opt)}
											className={`btn-ghost gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all 
												${isAdded ? ' bg-blue-50 text-blue-600 ' : 'bg-gray-300/40 text-gray-600 '} 
													`}
										>
											{isAdded ? <Check size={16} /> : ''}{opt.activity_label}
											<span className="ml-1 opacity-50 font-mono">{opt.mets_value}</span>
										</button>
									)
								})}
						</div>
					</div>
				))}

				{/* 선택된 활동 상세 입력 */}
				{activities.length > 0 && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-1">
						<p className="col-span-full text-xs font-bold"  >선택된 활동 상세</p>
						{activities.map(a => (
							<div
								key={a.activity_type}
								className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col gap-2"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="text-sm font-semibold text-neutral-800">{a.activity_label}</span>

									</div>
									<button
										type="button"
										onClick={() => removeActivity(a.activity_type)}
										className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
									>
										<X size={16} className='text-gray-800' />
									</button>
								</div>

								<div className="grid grid-cols-2 gap-2">
									<div className="flex flex-col gap-1">
										<label className="text-xs pl-1.5">하루 평균 시간(분)</label>
										<input
											className={inputCls}
											type="number"
											min={1}
											placeholder="30"
											value={a.duration_min_per_day}
											onChange={e => updateActivity(a.activity_type, 'duration_min_per_day', e.target.value)}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<label className="text-xs pl-1.5">주 빈도(일)</label>
										<input
											className={inputCls}
											type="number"
											min={1}
											max={7}
											placeholder="7"
											value={a.frequency_per_week}
											onChange={e => updateActivity(a.activity_type, 'frequency_per_week', e.target.value)}
										/>
									</div>
								</div>

								<div className="flex flex-col gap-1">
									<label className="text-xs pl-1.5">메모 (선택)</label>
									<input
										className={inputCls}
										placeholder="예: 직장 5층 계단 이용"
										value={a.note}
										onChange={e => updateActivity(a.activity_type, 'note', e.target.value)}
									/>
								</div>

								{Number(a.duration_min_per_day) > 0 && (
									<p className="text-xs pl-1.5 flex gap-1 items-center" >
										주간 기여 <span className='text-blue-600 font-bold'>{Math.round(a.mets_value * Number(a.duration_min_per_day) * Number(a.frequency_per_week))}</span> METs
										<Equal size={12} className='text-gray-500' />
										<span className=" font-mono">{a.mets_value} METs</span>
										<X size={12} className='text-gray-500' />
										{Number(a.duration_min_per_day)}
										<X size={12} className='text-gray-500' />
										{a.frequency_per_week}

									</p>
								)}
							</div>
						))}
					</div>
				)}
			</FormSection>

			{error && (
				<p className="text-sm text-red-500 text-center">{error}</p>
			)}

			{/* ── 하단 버튼 ──────────────────────────────────────── */}
			<div className="flex gap-3 pb-6">
				<button
					type="button"
					onClick={() => router.back()}
					className="flex-1 btn-ghost py-3 rounded-xl text-sm font-medium text-zinc-600 bg-zinc-200 hover:bg-zinc-300 transition-colors"
				>
					취소
				</button>
				<button
					type="submit"
					disabled={loading}
					className="flex-2 btn-primary py-4 text-sm font-bold"
					style={{ background: loading ? '#9ca3af' : '#0bb489' }}
				>
					{loading ? '등록 중...' : '회원 등록 완료'}
				</button>
			</div>
		</form>
	)
}
