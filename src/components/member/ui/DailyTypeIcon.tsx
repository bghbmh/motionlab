// src/components/member/ui/WorkoutTypeIcon.tsx


export type DailyType = 'repeat' | 'once'  // 일상활동 유형만 허용

const DAILY_ICON_PATHS: Record<DailyType, string> = {
	repeat: '/images/workout/daily_lifestyle.png',
	once: '/images/workout/daily_once.png',
}

export const DAILY_TYPE_LABELS: Record<DailyType, string> = {
	repeat: '반복',
	once: '한번',
}

interface Props {
	dailyType: DailyType
	size?: number  // px, 기본 34
}

export function DailyTypeIcon({ dailyType, size = 50 }: Props) {
	const src = DAILY_ICON_PATHS[dailyType]
	const label = DAILY_TYPE_LABELS[dailyType]

	return (
		<div
			className="workout-icon"
			style={{ width: size, height: size }}
		>
			<img
				src={src}
				alt={label}
				style={{ width: 'auto', height: `${size}px`, }}
			/>
		</div>
	)
}
