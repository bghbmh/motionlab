// components/admin/common/ActivityBadge.tsx

import type { ActivityLevel } from '@/types/ui'
import { ACTIVITY_LEVEL_LABELS, ACTIVITY_LEVEL_STYLES } from '@/types/ui'

interface ActivityBadgeProps {
	level: ActivityLevel
}

export default function ActivityBadge({ level }: ActivityBadgeProps) {
	const { bg, text } = ACTIVITY_LEVEL_STYLES[level]
	const label = ACTIVITY_LEVEL_LABELS[level]
	return (
		<span className={`px-1.5 py-1 rounded-sm text-xs font-medium leading-3 ${bg} ${text}`}>
			{label}
		</span>
	)
}
