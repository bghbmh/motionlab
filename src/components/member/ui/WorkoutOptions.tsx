// src/components/member/ui/WorkoutOptions.tsx
// Figma: options 행 — intensity · duration_min · 수정전후 · mets

interface Props {
	intensity: string          // 'recovery' | 'normal' | 'high'
	prescribedMin?: number | null
	actualMin?: number | null  // 실제 수행 시간 (완료 후 수정한 경우)
	mets?: number | null
}

const INTENSITY_LABEL: Record<string, string> = {
	recovery: '리커버리',
	normal: '일반',
	high: '고강도',
}

function Bullet() {
	return (
		<span
			className="inline-block rounded-full shrink-0 bg-neutral-400"
			style={{ width: 2, height: 2, }}
		/>
	)
}

export default function WorkoutOptions({ intensity, prescribedMin, actualMin, mets }: Props) {
	const intensityLabel = INTENSITY_LABEL[intensity] ?? intensity
	const hasDiff = actualMin != null && prescribedMin != null && actualMin !== prescribedMin

	return (
		<div
			className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium"
		>
			{/* 강도 */}
			<span>{intensityLabel}</span>

			{/* 시간 */}
			{prescribedMin != null && (
				<>
					<Bullet />
					{hasDiff ? (
						<span className="flex items-center gap-1 ">
							<span className=" text-neutral-400" style={{ textDecoration: 'line-through' }}>
								{prescribedMin}분
							</span>
							<span >→</span>
							<span>{actualMin}분</span>
						</span>
					) : (
						<span>{actualMin ?? prescribedMin}분</span>
					)}
				</>
			)}

			{/* METs */}
			{mets != null && (
				<>
					<Bullet />
					<span>{mets} METs</span>
				</>
			)}
		</div>
	)
}
