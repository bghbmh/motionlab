// components/admin/notes/InbodySummary.tsx

import type { InbodyRecord } from '@/types/database'

type MetricKey = keyof Pick<
	InbodyRecord,
	'weight' | 'muscle_mass' | 'body_fat_pct' | 'body_fat_mass' | 'bmi' | 'visceral_fat'
>

interface MetricConfig {
	key: MetricKey
	label: string
	unit: string
	lowerIsBetter: boolean
}

const METRICS: MetricConfig[] = [
	{ key: 'weight', label: '체중', unit: 'kg', lowerIsBetter: true },
	{ key: 'muscle_mass', label: '근육량', unit: 'kg', lowerIsBetter: false },
	{ key: 'body_fat_pct', label: '체지방률', unit: '%', lowerIsBetter: true },
	{ key: 'body_fat_mass', label: '체지방량', unit: 'kg', lowerIsBetter: true },
	{ key: 'bmi', label: 'BMI', unit: '', lowerIsBetter: true },
	{ key: 'visceral_fat', label: '내장지방', unit: '', lowerIsBetter: true },
]

function formatDiff(diff: number): string {
	const abs = Math.abs(diff).toFixed(1).replace(/\.0$/, '')
	return diff < 0 ? `▼ ${abs}` : `▲ ${abs}`
}

interface InbodySummaryProps {
	memberId: string
	latestInbody: InbodyRecord | null
	previousInbody?: InbodyRecord | null
	onNew: () => void   // ← 새 알림장 버튼 클릭 핸들러
}

export default function InbodySummary({
	latestInbody,
	previousInbody,
	onNew,
}: InbodySummaryProps) {

	const measuredAt = latestInbody?.measured_at
		? new Date(latestInbody.measured_at).toLocaleDateString('ko-KR', {
			year: 'numeric', month: '2-digit', day: '2-digit',
		}).replace(/\. /g, '-').replace('.', '')
		: null

	return (
		<div className=" shrink-0 flex flex-col gap-3">

			{/* 인바디 카드 */}
			<div className="bg-white rounded-2xl border border-neutral-200 p-4 flex flex-col gap-2">
				<div className="flex items-center justify-between mb-1">
					<span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
						최근 인바디
					</span>
					{measuredAt && (
						<span className="text-xs text-neutral-400">{measuredAt}</span>
					)}
				</div>

				{latestInbody ? (
					<div className="flex flex-col gap-1.5">
						{METRICS.map(({ key, label, unit, lowerIsBetter }) => {
							const value = latestInbody[key]
							if (value === null || value === undefined) return null

							const prevValue = previousInbody?.[key] ?? null
							const diff = prevValue !== null
								? (value as number) - (prevValue as number)
								: null

							let diffColor = 'text-neutral-400'
							let diffText = ''
							if (diff !== null && diff !== 0) {
								diffText = formatDiff(diff) + (unit ? ` ${unit}` : '')
								const isGood = lowerIsBetter ? diff < 0 : diff > 0
								diffColor = isGood ? 'text-[#0bb489]' : 'text-red-500'
							}

							return (
								<div
									key={key}
									className="flex items-center justify-between px-2 py-1 bg-neutral-50 rounded-lg"
								>
									<span className="text-xs text-neutral-500">{label}</span>
									<div className="flex items-center gap-1.5">
										{diffText && (
											<span className={`text-xs font-semibold whitespace-nowrap ${diffColor}`}>
												{diffText}
											</span>
										)}
										<span className="text-xs font-semibold text-neutral-800 font-mono whitespace-nowrap">
											{value}{unit ? ` ${unit}` : ''}
										</span>
									</div>
								</div>
							)
						})}
					</div>
				) : (
					<p className="text-xs text-neutral-400 text-center py-4">인바디 기록이 없습니다</p>
				)}
			</div>

			{/* 새 알림장 작성 버튼 */}
			<button
				type="button"
				onClick={onNew}
				className="flex items-center justify-center gap-1.5 w-full py-3 bg-[#0bb489] text-white text-sm font-semibold rounded-2xl hover:bg-[#09a07a] transition-colors"
			>
				<span className="text-lg leading-none">+</span>
				새 알림장 작성
			</button>
		</div>
	)
}
