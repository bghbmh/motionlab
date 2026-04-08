// src/components/member/DailyActivityModal.tsx
// 일상생활 활동 선택 BottomSheet
// Figma: Dialog-일상생활활동추가
// 활동 선택 → DailyActivityDurationModal(중앙 모달)로 연결

'use client'

import { useState } from 'react'
import BottomSheet from './ui/BottomSheet'
import DailyActivityDurationModal from './DailyActivityDurationModal'

import DailyActivityModalItem from './DailyActivityModalItem'


interface DailyActivityOption {
	activity_type: string
	activity_label: string
	mets_value: number
	paper_code: string
	category: string
}

// ── 활동 목록 데이터 ──────────────────────────────────────────

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
type Category = typeof CATEGORIES[number]

// ── Props ─────────────────────────────────────────────────────

interface Props {
	excludeTypes: string[]
	onAdd: (option: DailyActivityOption, durationMin: number) => void
	onClose: () => void
}

// ── 컴포넌트 ─────────────────────────────────────────────────

export default function DailyActivityModal({ excludeTypes, onAdd, onClose }: Props) {
	const [tab, setTab] = useState<Category>('전체')
	const [selected, setSelected] = useState<DailyActivityOption | null>(null)

	const filtered = ALL_OPTIONS.filter(o =>
		(tab === '전체' || o.category === tab) &&
		!excludeTypes.includes(o.activity_type)
	)

	function handleSelectActivity(option: DailyActivityOption) {
		setSelected(option)
	}

	function handleBackToList() {
		setSelected(null)
	}

	function handleConfirm(option: DailyActivityOption, durationMin: number) {
		onAdd(option, durationMin)
		// 모달 닫기는 부모에서 처리
	}

	return (
		<>
			{/* ── 활동 선택 BottomSheet ── */}
			<BottomSheet onClose={onClose}>

				{/* 헤더 */}
				<div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
					<p className="text-[16px] font-medium text-[#1d211c]">
						활동 선택
					</p>
					<button
						type="button"
						onClick={onClose}
						className="opacity-70 hover:opacity-100 transition-opacity"
						aria-label="닫기"
					>
						<svg width="20" height="20" viewBox="0 0 11.5 11.5" fill="none">
							<path
								d="M10.75 0.75004L0.750042 10.75M0.75 0.75L10.75 10.75"
								stroke="#020618"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="1.5"
							/>
						</svg>
					</button>
				</div>

				{/* 카테고리 탭 */}
				<div className="flex gap-1.5 px-5 pb-3 overflow-x-auto shrink-0">
					{CATEGORIES.map(c => {
						const isActive = tab === c
						return (
							<button
								key={c}
								type="button"
								onClick={() => setTab(c)}
								className="shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-[8px] transition-all"
								style={{
									backgroundColor: isActive ? '#e6faf5' : '#fafafa',
									border: `1px solid ${isActive ? 'rgba(11,180,137,0.7)' : '#e5e7eb'}`,
									color: isActive ? '#099970' : '#4a5565',
								}}
							>
								{c}
							</button>
						)
					})}
				</div>

				<hr className="m-divider mx-5 shrink-0" />

				{/* 활동 목록 — 스크롤 영역 */}
				<div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2">
					{filtered.length === 0 ? (
						<p className="text-sm text-center py-8 text-[#7f847d]">
							추가할 활동이 없습니다.
						</p>
					) : (
						filtered.map(opt => (
							<DailyActivityModalItem
								key={opt.activity_type}
								option={opt}
								onSelect={handleSelectActivity}
							/>
						))
					)}
				</div>
			</BottomSheet>

			{/* ── 수행시간 입력 중앙 모달 ── */}
			{selected && (
				<DailyActivityDurationModal
					option={selected}
					onConfirm={handleConfirm}
					onBack={handleBackToList}
					onClose={handleBackToList}  // X·취소 클릭 시 목록으로만 돌아감
				/>
			)}
		</>
	)
}

// 외부에서 타입 재사용할 수 있도록 re-export
export type { DailyActivityOption }
