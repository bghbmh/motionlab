'use client'

import { useState } from 'react'

export interface DailyActivityOption {
	activity_type: string
	activity_label: string
	mets_value: number
	paper_code: string
	category: string
}

const ALL_OPTIONS: DailyActivityOption[] = [
	// 가사
	{ activity_type: 'light_housework', activity_label: '가벼운 가사 (설거지·빨래)', mets_value: 2.1, paper_code: 'A0121', category: '가사' },
	{ activity_type: 'cleaning', activity_label: '집 청소 (진공청소기·바닥)', mets_value: 3.3, paper_code: 'A0133', category: '가사' },
	{ activity_type: 'heavy_housework', activity_label: '무거운 가사 (가구 이동)', mets_value: 4.4, paper_code: 'A0135', category: '가사' },
	{ activity_type: 'childcare', activity_label: '아이·노인 돌보기', mets_value: 3.3, paper_code: 'A0132', category: '가사' },
	{ activity_type: 'pet_walk', activity_label: '반려동물 산책', mets_value: 3.4, paper_code: 'A0123', category: '가사' },
	{ activity_type: 'gardening', activity_label: '정원·화분 관리', mets_value: 3.7, paper_code: 'A0631', category: '가사' },
	{ activity_type: 'home_repair', activity_label: '집 수리·도배·페인팅', mets_value: 3.2, paper_code: 'A0831', category: '가사' },
	// 이동
	{ activity_type: 'slow_walk', activity_label: '느린 걷기 (통근·마트)', mets_value: 2.3, paper_code: 'B0921', category: '이동' },
	{ activity_type: 'moderate_walk', activity_label: '보통 걷기 (4.8km/h)', mets_value: 4.8, paper_code: 'B0932', category: '이동' },
	{ activity_type: 'fast_walk', activity_label: '빠른 걷기 (7.2km/h)', mets_value: 6.9, paper_code: 'B0941', category: '이동' },
	{ activity_type: 'stairs', activity_label: '계단 오르기', mets_value: 8.3, paper_code: 'B0942', category: '이동' },
	{ activity_type: 'cycling', activity_label: '자전거 통근', mets_value: 7.2, paper_code: 'B1241', category: '이동' },
	// 직장
	{ activity_type: 'desk_work', activity_label: '주로 앉아서 사무직', mets_value: 1.5, paper_code: 'C1311', category: '직장' },
	{ activity_type: 'standing_work', activity_label: '서서 하는 업무 (서비스직)', mets_value: 2.3, paper_code: 'C1321', category: '직장' },
	{ activity_type: 'physical_work', activity_label: '육체 노동 (건설·청소부)', mets_value: 4.4, paper_code: 'C1333', category: '직장' },
	// 운동
	{ activity_type: 'yoga_extra', activity_label: '요가 (별도)', mets_value: 2.5, paper_code: 'D1921', category: '운동' },
	{ activity_type: 'swim', activity_label: '수영', mets_value: 6.8, paper_code: 'D1741', category: '운동' },
	{ activity_type: 'badminton', activity_label: '배드민턴', mets_value: 5.3, paper_code: 'D1833', category: '운동' },
	{ activity_type: 'hiking', activity_label: '등산', mets_value: 7.8, paper_code: 'D1842', category: '운동' },
	{ activity_type: 'jogging_extra', activity_label: '조깅 (별도)', mets_value: 6.4, paper_code: 'B1141', category: '운동' },
]

const CATEGORIES = ['전체', '가사', '이동', '직장', '운동'] as const

interface Props {
	excludeTypes: string[]   // 이미 카드에 있는 항목 제외
	onAdd: (opt: DailyActivityOption, durationMin: number) => void
	onClose: () => void
}

export default function DailyActivityModal({ excludeTypes, onAdd, onClose }: Props) {
	const [tab, setTab] = useState<typeof CATEGORIES[number]>('전체')
	const [pendingType, setPendingType] = useState<string | null>(null)
	const [duration, setDuration] = useState('30')

	const filtered = ALL_OPTIONS.filter(o =>
		(tab === '전체' || o.category === tab) &&
		!excludeTypes.includes(o.activity_type)
	)

	function handleAdd(opt: DailyActivityOption) {
		const min = Number(duration)
		if (!min || min <= 0) return
		onAdd(opt, min)
		onClose()
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center"
			style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
			onClick={onClose}
		>
			<div
				className="w-full max-w-md flex flex-col"
				style={{
					background: '#141e2e',
					border: '1px solid rgba(255,255,255,0.08)',
					borderBottom: 'none',
					borderRadius: '1.5rem 1.5rem 0 0',
					maxHeight: '80vh',
				}}
				onClick={e => e.stopPropagation()}
			>
				{/* 핸들 */}
				<div className="flex justify-center pt-3 pb-2">
					<div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
				</div>

				{/* 헤더 */}
				<div className="flex justify-between items-center px-5 pb-3">
					<p className="font-mono text-sm font-medium" style={{ color: '#3DDBB5' }}>
						활동 추가
					</p>
					<button onClick={onClose} className="btn-ghost text-xs py-1 px-2.5">✕</button>
				</div>

				{/* 카테고리 탭 */}
				<div className="flex gap-1.5 px-5 pb-3 overflow-x-auto">
					{CATEGORIES.map(c => (
						<button
							key={c}
							type="button"
							onClick={() => setTab(c)}
							className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
							style={{
								background: tab === c ? 'rgba(61,219,181,0.12)' : '#1a2740',
								border: `1px solid ${tab === c ? 'rgba(61,219,181,0.4)' : 'rgba(255,255,255,0.08)'}`,
								color: tab === c ? '#3DDBB5' : 'rgba(255,255,255,0.4)',
							}}
						>
							{c}
						</button>
					))}
				</div>

				{/* 시간 입력 (상단 고정) */}
				<div className="px-5 pb-3"
					style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
					<div className="flex items-center gap-2">
						<p className="text-[11px] shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
							오늘 수행 시간
						</p>
						<input
							type="number" min={1}
							className="ml-input py-1.5 text-sm"
							style={{ maxWidth: 80 }}
							value={duration}
							onChange={e => setDuration(e.target.value)}
						/>
						<p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>분</p>
					</div>
				</div>

				{/* 활동 목록 */}
				<div className="overflow-y-auto flex-1 px-5 py-3 flex flex-col gap-2">
					{filtered.length === 0 ? (
						<p className="text-xs text-center py-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
							추가할 활동이 없습니다.
						</p>
					) : (
						filtered.map(opt => (
							<div key={opt.activity_type}
								className="flex items-center justify-between py-2.5 px-3 rounded-xl"
								style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
								<div>
									<p className="text-sm text-white">{opt.activity_label}</p>
									<p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
										{opt.mets_value} METs/h · {opt.paper_code}
									</p>
								</div>
								<button
									type="button"
									onClick={() => handleAdd(opt)}
									className="shrink-0 ml-3 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
									style={{
										background: 'rgba(61,219,181,0.1)',
										border: '1px solid rgba(61,219,181,0.3)',
										color: '#3DDBB5',
									}}
								>
									+ 추가
								</button>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	)
}