import type { Intensity, WorkoutType } from '@/types/database'
import { INTENSITY_LABELS, WORKOUT_TYPE_LABELS, WORKOUT_TYPE_METS } from '@/types/database'
import {
	type WorkoutItem, calcMets,
	INTENSITY_STYLE, WORKOUT_ICONS, WORKOUT_COLORS,
} from './noteWorkoutTypes'

interface Props {
	item: WorkoutItem
	index: number
	showRemove: boolean
	onChange: (updated: WorkoutItem) => void
	onRemove: () => void
}

export default function WorkoutRow({ item, index, showRemove, onChange, onRemove }: Props) {
	const mets = calcMets(item)
	const c = item.workout_type ? WORKOUT_COLORS[item.workout_type] : null

	return (
		<div className="flex flex-col gap-4 workout-row-item">

			<div className="flex justify-between items-center">
				<span className="text-[13px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
					운동 {index + 1}
				</span>
				{showRemove && (
					<button type="button" onClick={onRemove}
						className="text-[10px] px-2 py-0.5 rounded"
						style={{ background: 'rgba(255,107,91,0.07)', border: '1px solid rgba(255,107,91,0.15)', color: 'rgba(255,107,91,0.55)' }}>
						삭제
					</button>
				)}
			</div>

			{/* 운동 강도 */}
			<div>
				<p className="ml-card-label mb-2">운동 강도</p>
				<div className="flex gap-1.5">
					{(['recovery', 'normal', 'high'] as Intensity[]).map(i => (
						<button key={i} type="button"
							onClick={() => onChange({ ...item, intensity: i })}
							className="flex-1 text-[11px] font-semibold rounded-lg py-2 transition-all"
							style={{
								border: '1px solid',
								...(item.intensity === i
									? INTENSITY_STYLE[i]
									: { borderColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', backgroundColor: '#1a2740' })
							}}>
							{INTENSITY_LABELS[i]}
						</button>
					))}
				</div>
			</div>

			{/* 운동 종류 */}
			<div>
				<p className="ml-card-label mb-2">추천하는 운동 종류</p>
				<div className="grid grid-cols-6 gap-1.5">
					{(Object.keys(WORKOUT_TYPE_LABELS) as WorkoutType[]).map(t => {
						const isSelected = item.workout_type === t
						const wc = WORKOUT_COLORS[t]
						return (
							<button key={t} type="button"
								onClick={() => onChange({ ...item, workout_type: isSelected ? null : t })}
								className="py-2 rounded-lg text-[11px] font-semibold transition-all flex flex-col items-center gap-1"
								style={{
									background: isSelected ? wc.bg : '#1a2740',
									border: `1px solid ${isSelected ? wc.border : 'rgba(255,255,255,0.02)'}`,
									color: isSelected ? wc.text : 'rgba(255,255,255,0.7)',
								}}>
								<span className="text-sm">{WORKOUT_ICONS[t]}</span>
								<span>{WORKOUT_TYPE_LABELS[t]}</span>
							</button>
						)
					})}
				</div>
			</div>

			{/* 예상 시간 + METs */}
			<div>
				<p className="ml-card-label mb-2">예상 운동 시간</p>
				<div className="flex gap-2">
					<label className="flex flex-1">
						<input type="number" min={1} className="ml-input pr-8"
							placeholder="운동 시간"
							value={item.duration_min}
							onChange={e => onChange({ ...item, duration_min: e.target.value })}
						/>
					</label>
					<div className="flex-none flex items-center justify-center gap-2 rounded-lg"
						style={{
							width: 120,
							background: mets ? (c?.bg ?? 'rgba(61,219,181,0.07)') : '#1a2740',
							border: `1px solid ${mets ? (c?.border ?? 'rgba(61,219,181,0.2)') : 'rgba(255,255,255,0.06)'}`,
							transition: 'all 0.2s',
						}}>
						<p className="font-mono text-sm font-bold leading-none"
							style={{ color: mets ? (c?.text ?? '#3DDBB5') : 'rgba(255,255,255,0.5)' }}>
							{mets ?? ' — '}
						</p>
						<p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>METs</p>
					</div>
				</div>
				{item.workout_type && mets && (
					<p className="text-[11px] font-mono mt-1 px-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
						{WORKOUT_TYPE_LABELS[item.workout_type]} {WORKOUT_TYPE_METS[item.workout_type]}METs/h × {item.duration_min}분
					</p>
				)}
			</div>

			{/* ★ 코치 메모 (신규) */}
			<div>
				<p className="ml-card-label mb-2">
					코치 메모
					<span className="font-normal normal-case ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
						· 회원에게 표시됩니다 (선택)
					</span>
				</p>
				<input
					type="text"
					className="ml-input"
					placeholder="예: 허리가 약한 분은 무릎 굽혀 진행해 주세요"
					value={item.coach_memo ?? ''}
					onChange={e => onChange({ ...item, coach_memo: e.target.value })}
				/>
			</div>

		</div>
	)
}
