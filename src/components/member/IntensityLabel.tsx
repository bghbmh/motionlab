// src/components/member/IntensityLabel.tsx

import type { Intensity } from '@/types/database'
import { INTENSITY_LABELS } from '@/types/database'

interface IntensityLabelProps {
	intensity: Intensity
}

export function IntensityLabel({ intensity }: IntensityLabelProps) {
	return (
		<span className="m-sublabel text-xs font-medium">
			{INTENSITY_LABELS[intensity]}
		</span>
	)
}
