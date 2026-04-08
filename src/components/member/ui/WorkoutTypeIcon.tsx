// src/components/member/ui/WorkoutTypeIcon.tsx

import { WORKOUT_ICON_PATHS } from '@/types/database'
import type { WorkoutType } from '@/types/database'

interface Props {
	workoutType: WorkoutType
	size?: number  // px, 기본 34
}

export default function WorkoutTypeIcon({ workoutType, size = 50 }: Props) {
	const src = WORKOUT_ICON_PATHS[workoutType]

	return (
		<div
			className="workout-icon"
			style={{ width: size, height: size }}
		>
			<img
				src={src}
				alt={workoutType}
				style={{ width: 'auto', height: `${size * 1.2}px`, }}
			/>
		</div>
	)
}
