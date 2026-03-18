'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── 논문 기반 일상활동 기본 목록 ──────────────────────────────────
const DAILY_ACTIVITY_OPTIONS = [
	// 가사
	{ activity_type: 'light_housework', activity_label: '가벼운 가사 (설거지·빨래)', mets_value: 2.1, paper_code: 'A0121', category: '가사' },
	{ activity_type: 'cleaning', activity_label: '집 청소 (진공청소기·바닥)', mets_value: 3.3, paper_code: 'A0133', category: '가사' },
	{ activity_type: 'heavy_housework', activity_label: '무거운 가사 (가구 이동)', mets_value: 4.4, paper_code: 'A0135', category: '가사' },
	{ activity_type: 'childcare', activity_label: '아이·노인 돌보기', mets_value: 3.3, paper_code: 'A0132', category: '가사' },
	{ activity_type: 'pet_walk', activity_label: '반려동물 산책', mets_value: 3.4, paper_code: 'A0123', category: '가사' },
	{ activity_type: 'gardening', activity_label: '정원·화분 관리', mets_value: 3.7, paper_code: 'A0631', category: '가사' },
	// 이동
	{ activity_type: 'slow_walk', activity_label: '느린 걷기 (통근·마트)', mets_value: 2.3, paper_code: 'B0921', category: '이동' },
	{ activity_type: 'moderate_walk', activity_label: '보통 걷기 (4.8km/h)', mets_value: 4.8, paper_code: 'B0932', category: '이동' },
	{ activity_type: 'stairs', activity_label: '계단 오르기', mets_value: 8.3, paper_code: 'B0942', category: '이동' },
	{ activity_type: 'cycling', activity_label: '자전거 통근', mets_value: 7.2, paper_code: 'B1241', category: '이동' },
	// 직장
	{ activity_type: 'desk_work', activity_label: '주로 앉아서 사무직', mets_value: 1.5, paper_code: 'C1311', category: '직장' },
	{ activity_type: 'standing_work', activity_label: '서서 하는 업무 (서비스직)', mets_value: 2.3, paper_code: 'C1321', category: '직장' },
	{ activity_type: 'physical_work', activity_label: '육체 노동 (건설·청소부)', mets_value: 4.4, paper_code: 'C1333', category: '직장' },
] as const

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

	// 활동 추가
	function addActivity(opt: typeof DAILY_ACTIVITY_OPTIONS[number]) {
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

	// 활동 제거
	function removeActivity(type: string) {
		setActivities(prev => prev.filter(a => a.activity_type !== type))
	}

	// 활동 값 수정
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

		// 2. 일상활동 패턴 저장
		if (activities.length > 0) {
			const validActivities = activities.filter(
				a => Number(a.duration_min_per_day) > 0
			)
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
		}

		router.push(`/studio/members/${member.id}`)
		router.refresh()
	}

	const categories = ['가사', '이동', '직장'] as const

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">

			{/* ── 기본 정보 ── */}
			<div className="ml-card flex flex-col gap-3">
				<p className="ml-card-label text-base font-bold text-white m-0">기본 정보</p>

				{[
					{ key: 'name', label: '이름 *', placeholder: '홍길동', type: 'text' },
					{ key: 'registered_at', label: '등록일 *', placeholder: '', type: 'date' },
					{ key: 'phone', label: '연락처', placeholder: '010-0000-0000', type: 'tel' },
					{ key: 'birth_date', label: '생년월일', placeholder: '', type: 'date' },
					{ key: 'sessions_per_week', label: '주 수업 횟수 *', placeholder: '2', type: 'number' },
				].map(({ key, label, placeholder, type }) => (
					<div key={key}>
						<p className="ml-card-label mb-1">{label}</p>
						<input
							className="ml-input" type={type} placeholder={placeholder}
							value={form[key as keyof typeof form]}
							onChange={e => update(key, e.target.value)}
							required={label.includes('*')}
							min={type === 'number' ? 1 : undefined}
							max={type === 'number' ? 7 : undefined}
						/>
					</div>
				))}

				<div>
					<p className="ml-card-label mb-1">특이사항 (선택)</p>
					<input
						className="ml-input" placeholder="예: 허리 디스크 주의"
						value={form.memo} onChange={e => update('memo', e.target.value)}
					/>
				</div>
			</div>

			{/* ── 비방문일 생활 패턴 ── */}
			<div className="ml-card flex flex-col gap-4">
				<div>
					<p className="ml-card-label text-base font-bold text-white m-0">
						비방문일 생활 패턴
						<span className="font-normal text-[11px] ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
							선택 · 상담 내용 기반
						</span>
					</p>
					<p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
						활동을 선택하고 하루 평균 시간과 주 빈도를 입력해 주세요.
					</p>
				</div>

				{/* 카테고리별 선택 버튼 */}
				{categories.map(cat => (
					<div key={cat}>
						<p className="text-[11px] font-bold mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
							{cat}
						</p>
						<div className="flex flex-wrap gap-1.5">
							{DAILY_ACTIVITY_OPTIONS
								.filter(o => o.category === cat)
								.map(opt => {
									const isAdded = activities.some(a => a.activity_type === opt.activity_type)
									return (
										<button
											key={opt.activity_type}
											type="button"
											onClick={() => isAdded ? removeActivity(opt.activity_type) : addActivity(opt)}
											className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all"
											style={{
												background: isAdded ? 'rgba(61,219,181,0.12)' : '#1a2740',
												border: `1px solid ${isAdded ? 'rgba(61,219,181,0.4)' : 'rgba(255,255,255,0.08)'}`,
												color: isAdded ? '#3DDBB5' : 'rgba(255,255,255,0.5)',
											}}
										>
											{isAdded ? '✓ ' : ''}{opt.activity_label}
											<span className="ml-1 font-mono opacity-60">{opt.mets_value}</span>
										</button>
									)
								})}
						</div>
					</div>
				))}

				{/* 선택된 활동 상세 입력 */}
				{activities.length > 0 && (
					<div className="flex flex-col gap-2 mt-1">
						<p className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
							선택된 활동 상세
						</p>
						{activities.map(a => (
							<div key={a.activity_type}
								className="rounded-xl p-3 flex flex-col gap-2"
								style={{ background: 'rgba(61,219,181,0.04)', border: '1px solid rgba(61,219,181,0.12)' }}>

								<div className="flex justify-between items-center">
									<span className="text-sm font-semibold text-white">{a.activity_label}</span>
									<span className="font-mono text-[11px]" style={{ color: 'rgba(61,219,181,0.7)' }}>
										{a.mets_value} METs/h
									</span>
								</div>

								<div className="grid grid-cols-2 gap-2">
									<div>
										<p className="ml-card-label mb-1">하루 평균 시간(분)</p>
										<input
											className="ml-input py-2" type="number" min={1} placeholder="30"
											value={a.duration_min_per_day}
											onChange={e => updateActivity(a.activity_type, 'duration_min_per_day', e.target.value)}
										/>
									</div>
									<div>
										<p className="ml-card-label mb-1">주 빈도(일)</p>
										<input
											className="ml-input py-2" type="number" min={1} max={7} placeholder="7"
											value={a.frequency_per_week}
											onChange={e => updateActivity(a.activity_type, 'frequency_per_week', e.target.value)}
										/>
									</div>
								</div>

								<div>
									<p className="ml-card-label mb-1">메모 (선택)</p>
									<input
										className="ml-input py-2" placeholder="예: 직장 5층 계단 이용"
										value={a.note}
										onChange={e => updateActivity(a.activity_type, 'note', e.target.value)}
									/>
								</div>

								{/* 주간 METs 기여 미리보기 */}
								{Number(a.duration_min_per_day) > 0 && (
									<p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
										주간 기여 ≈ {Math.round(a.mets_value * Number(a.duration_min_per_day) * Number(a.frequency_per_week))} METs
									</p>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{error && (
				<p className="text-xs text-center" style={{ color: '#FF6B5B' }}>{error}</p>
			)}

			<button
				type="submit"
				disabled={loading}
				className="btn-primary py-4 text-sm font-bold"
				style={{ opacity: loading ? 0.5 : 1 }}
			>
				{loading ? '등록 중...' : '회원 등록 완료'}
			</button>
		</form>
	)
}