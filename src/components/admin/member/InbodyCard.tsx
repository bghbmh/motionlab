// components/admin/member/InbodyCard.tsx

import type { InbodyRecord } from '@/types/database'
import AdminCardHeader from '@/components/admin/common/AdminCardHeader'

interface InbodyCardProps {
	/** 가장 최근 인바디 기록 */
	latestRecord: InbodyRecord | null
	/** 이전 인바디 기록 (diff 계산용, 없으면 diff 미표시) */
	previousRecord?: InbodyRecord
	moreLinkUrl?: string
}

// 표시할 지표 목록 정의
// diffPositive: true → 값이 감소할 때 초록 (체중, 체지방 등)
//               false → 값이 증가할 때 초록 (근육량 등)
type MetricKey = keyof Pick<
	InbodyRecord,
	'weight' | 'muscle_mass' | 'body_fat_pct' | 'body_fat_mass' | 'bmi' | 'visceral_fat'
>

interface MetricConfig {
	key: MetricKey
	label: string
	unit: string
	lowerIsBetter: boolean  // true → 감소가 좋음(초록), false → 증가가 좋음(초록)
}

const METRICS: MetricConfig[] = [
	{ key: 'weight', label: '체중', unit: 'kg', lowerIsBetter: true },
	{ key: 'muscle_mass', label: '근육량', unit: 'kg', lowerIsBetter: false },
	{ key: 'body_fat_pct', label: '체지방률', unit: '%', lowerIsBetter: true },
	{ key: 'body_fat_mass', label: '체지방량', unit: 'kg', lowerIsBetter: true },
	{ key: 'bmi', label: 'BMI', unit: '', lowerIsBetter: true },
	{ key: 'visceral_fat', label: '내장지방', unit: '', lowerIsBetter: true },
]

function formatDiff(diff: number, unit: string): { text: string; isPositive: boolean } {
	const abs = Math.abs(diff).toFixed(1).replace(/\.0$/, '')
	const arrow = diff < 0 ? '▼' : '▲'
	const text = unit ? `${arrow} ${abs} ${unit}` : `${arrow} ${abs}`
	return { text, isPositive: diff !== 0 }
}

export default function InbodyCard({ latestRecord, previousRecord, moreLinkUrl }: InbodyCardProps) {
	{/* 측정일 */ }
	const caption = latestRecord ? `측정일 ${latestRecord.measured_at}` : '';

	return (
		<div className="w-full py-2 bg-white rounded-2xl flex flex-col gap-2">
			{/* 헤더 */}
			<AdminCardHeader title='최근 인바디' caption={caption} actionLabel="더보기" moreLinkUrl={moreLinkUrl} />

			{/* 지표 그리드 */}
			<div className="px-2.5 flex gap-2 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6">
				{latestRecord === null && METRICS.map(({ key, label, unit, lowerIsBetter }) => {
					return (
						<div
							key={key}
							className="flex-1 min-w-[120px] p-3 bg-neutral-50 rounded-lg 
							flex flex-row sm:flex-col gap-1"
						>
							<span className="text-neutral-600 text-xs leading-4">{label}</span>
							<div className="flex items-center gap-1.5 ">
								<p className='text-gray-400  text-xs font-semibold'>
									<span className=" font-mono pr-1">0</span>
									<span>{unit ? ` ${unit}` : ''}</span>
								</p>

							</div>
						</div>
					)
				})}

				{latestRecord && METRICS.map(({ key, label, unit, lowerIsBetter }) => {
					const value = latestRecord[key]
					if (value === null || value === undefined) return null

					const prevValue = previousRecord?.[key] ?? null
					const diff = prevValue !== null ? (value as number) - (prevValue as number) : null

					// diff가 있을 때 색상 결정
					// lowerIsBetter=true → 감소(diff<0)가 좋음 → 초록
					// lowerIsBetter=false → 증가(diff>0)가 좋음 → 초록
					let diffColor = 'text-neutral-400'
					let diffText = ''
					if (diff !== null && diff !== 0) {
						const { text } = formatDiff(diff, unit)
						diffText = text
						const isGood = lowerIsBetter ? diff < 0 : diff > 0
						diffColor = isGood ? 'text-[#0bb489]' : 'text-red-500'
					}

					return (
						<div
							key={key}
							className="flex-1 min-w-[120px] p-3 bg-neutral-50 rounded-lg 
							flex flex-row justify-between items-center
							sm:flex-col sm:items-start  gap-1"
						>
							<span className="text-neutral-600 text-xs leading-4">{label}</span>
							<div className="flex items-center gap-1.5">
								<p className='text-gray-700 text-xs font-semibold whitespace-nowrap order-2 sm:order-0'>
									<span className=" font-mono">{value}</span>
									<span>{unit ? ` ${unit}` : ''}</span>
								</p>
								{diffText && (
									<span className={`text-xs font-semibold leading-4  whitespace-nowrap ${diffColor}`}>
										{diffText}
									</span>
								)}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
