// types/ui.tsx
// DB와 무관한 UI 전용 타입 및 설정값 정의

// ─── 활동 수준 ────────────────────────────────────────────────
// 회원의 주간 운동량을 기반으로 계산되는 UI 표시용 상태값
// DB에 저장되지 않고 클라이언트에서 계산하여 사용
export type ActivityLevel = 'low' | 'normal' | 'high'

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
	low: '활동 부족',
	normal: '정상',
	high: '고활동',
}

export const ACTIVITY_LEVEL_STYLES: Record<ActivityLevel, { bg: string; text: string }> = {
	low: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
	normal: { bg: 'bg-green-100', text: 'text-green-700' },
	high: { bg: 'bg-red-50', text: 'text-red-600' },
}

// ─── 운동 기록 타입 ───────────────────────────────────────────
// WorkoutLog.source 를 UI 표시용으로 매핑한 타입
// 'routine' → 'note' | 'manual' → 'direct' | 'daily' → 'daily'
export type RecordType = 'note' | 'direct' | 'daily'

interface RecordTypeConfig {
	label: string
	labelColor: string
	icon: React.ReactNode
}

export const RECORD_TYPE_CONFIG: Record<RecordType, RecordTypeConfig> = {
	note: {
		label: '알림장',
		labelColor: 'text-orange-500',
		icon: (
			<svg width= "12" height="12" viewBox="0 0 12 12" fill="none" >
			<path d="M6 1L7.5 4.5H11L8.25 6.75L9.25 10.5L6 8.25L2.75 10.5L3.75 6.75L1 4.5H4.5L6 1Z" fill = "#f97316" />
				</svg>
    ),
  },
direct: {
	label: '직접',
		labelColor: 'text-blue-500',
			icon: (
				<svg width= "12" height = "12" viewBox = "0 0 12 12" fill = "none" >
					<path d="M3 9L6 1.5L9 9" stroke = "#3b82f6" strokeWidth = "1.5" strokeLinecap = "round" strokeLinejoin = "round" />
						</svg>
    ),
},
daily: {
	label: '일상',
		labelColor: 'text-teal-500',
			icon: (
				<svg width= "12" height = "12" viewBox = "0 0 12 12" fill = "none" >
					<circle cx="6" cy = "6" r = "4.5" stroke = "#14b8a6" strokeWidth = "1.5" />
						<path d="M4 6.5L5.5 8L8 4.5" stroke = "#14b8a6" strokeWidth = "1.5" strokeLinecap = "round" strokeLinejoin = "round" />
							</svg>
    ),
},
}
