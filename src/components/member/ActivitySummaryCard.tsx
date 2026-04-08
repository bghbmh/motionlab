// src/components/member/ActivitySummaryCard.tsx

interface StatCardProps {
	value: string | number
	unit?: string
	label: string
	valueColor?: string
	unitColor?: string
}

function StatCard({ value, unit, label, valueColor, unitColor }: StatCardProps) {
	return (
		<div
			className="flex-1 flex flex-col items-center py-5 rounded-[14px] border"
			style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
		>
			{/* 숫자 */}
			<div className="flex items-baseline justify-center w-full px-3">
				<span
					className="text-2xl font-semibold leading-8"
					style={{ color: valueColor ?? 'var(--color-text-base)' }}
				>
					{value}
				</span>
				{unit && (
					<span
						className="text-xl font-light leading-7"
						style={{ color: unitColor ?? valueColor ?? 'var(--color-text-base)' }}
					>
						{unit}
					</span>
				)}
			</div>
			{/* 레이블 */}
			<div className="w-full px-3 mt-0">
				<p
					className="text-[11px] text-center truncate"
					style={{ color: 'var(--color-text-muted)' }}
				>
					{label}
				</p>
			</div>
		</div>
	)
}

interface Props {
	weekStart: string
	weekEnd: string
	metsScore: number
	durationMin: number
	activeDays: number
}

export default function ActivitySummaryCard({
	weekStart,
	weekEnd,
	metsScore,
	durationMin,
	activeDays,
}: Props) {
	return (
		<div className="m-card flex flex-col gap-2">
			{/* 카드 타이틀 — 기간 */}
			<div className="px-1">
				<p className="m-label">
					{weekStart} ~ {weekEnd} 활동
				</p>
			</div>

			{/* 통계 3개 */}
			<div className="flex gap-[10px] items-center">
				<StatCard
					value={metsScore > 0 ? Math.round(metsScore) : '—'}
					label="METs 점수"
					valueColor="var(--color-grass-9)"
				/>
				<StatCard
					value={durationMin > 0 ? durationMin : '—'}
					unit={durationMin > 0 ? '분' : undefined}
					label="운동 시간"
					valueColor="var(--color-text-base)"
					unitColor="var(--color-text-sub)"
				/>
				<StatCard
					value={activeDays}
					unit="일"
					label="기간 내 활동일"
					valueColor="var(--color-orange-500)"
					unitColor="var(--color-orange-600)"
				/>
			</div>
		</div>
	)
}
