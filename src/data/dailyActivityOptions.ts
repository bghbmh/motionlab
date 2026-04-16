// src/data/dailyActivityOptions.ts
// 일상생활 활동 목록 — 회원앱 · 관리자앱 공용

export interface DailyActivityOption {
	activity_type: string
	activity_label: string
	mets_value: number
	paper_code: string
	category: string
}

export const DAILY_ACTIVITY_CATEGORIES = ['전체', '가사', '이동', '직장', '운동'] as const
export type DailyActivityCategory = typeof DAILY_ACTIVITY_CATEGORIES[number]

export const ALL_DAILY_ACTIVITY_OPTIONS: DailyActivityOption[] = [
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
