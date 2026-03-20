'use client'

import { useState } from 'react'
import { type WorkoutItem, calcMets, cloneItems, newItem } from './noteWorkoutTypes'

import WorkoutRow from './WorkoutRow';

interface Props {
	day: string
	items: WorkoutItem[] | null       // null = 복사 선택 전
	previousItems: WorkoutItem[]      // 복사 제안용
	onUpdate: (items: WorkoutItem[]) => void
	onAddWorkout: () => void
	onRemoveWorkout: (localId: string) => void
}

export default function DaySection({
	day, items, previousItems,
	onUpdate, onAddWorkout, onRemoveWorkout,
}: Props) {
	const [copyChoice, setCopyChoice] = useState<'copy' | 'new' | null>(
		items !== null && items.length > 0 ? 'new' : null
	)

	const dayMets = (items ?? []).reduce<number>((s, w) => s + (calcMets(w) ?? 0), 0)
	const dayMetsDisplay = dayMets > 0 ? Math.round(dayMets * 100) / 100 : null

	function handleChoice(choice: 'copy' | 'new') {
		setCopyChoice(choice)
		onUpdate(choice === 'copy' ? cloneItems(previousItems) : [newItem()])
	}

	const label = day === '전체' ? '전체' : `${day}요일`

	return (
		<div className="rounded-xl overflow-hidden">


			{/* 헤더 */}
			<div className="flex justify-between items-center px-4 py-2.5"
				style={{ background: 'rgba(61,219,181,0.06)', borderBottom: '1px solid rgba(61,219,181,0.1)' }}>
				<span className="text-xs font-bold" style={{ color: '#3DDBB5' }}>{label}</span>
				{dayMetsDisplay && (
					<span className="font-mono text-xs font-semibold" style={{ color: 'rgba(61,219,181,0.7)' }}>
						{dayMetsDisplay} METs
					</span>
				)}
			</div>

			<div className="p-3.5 flex flex-col gap-3" style={{ background: '#111927' }}>
				{copyChoice === null && previousItems.length > 0 ? (
					/* 복사 / 신규 선택 */
					<div className="flex flex-col gap-2">
						<p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
							이전 요일 운동 내용을 사용할까요?
						</p>
						<div className="flex gap-2">
							<button type="button" onClick={() => handleChoice('copy')}
								className="flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all"
								style={{ background: 'rgba(61,219,181,0.08)', border: '1px solid rgba(61,219,181,0.25)', color: '#3DDBB5' }}>
								이전 내용 그대로 사용
							</button>
							<button type="button" onClick={() => handleChoice('new')}
								className="flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all"
								style={{ background: '#1a2740', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
								신규 작성
							</button>
						</div>
					</div>
				) : (
					<>
						{(items ?? []).map((item, idx) => (
							<WorkoutRow
								key={item.localId}
								item={item} index={idx}
								showRemove={(items ?? []).length > 1}
								onChange={updated =>
									onUpdate((items ?? []).map(w => w.localId === item.localId ? updated : w))
								}
								onRemove={() => onRemoveWorkout(item.localId)}
							/>
						))}
						<button type="button" onClick={onAddWorkout}
							className="w-full py-3 mt-3 text-[13px] font-semibold rounded-xl transition-all"
							style={{
								background: 'transparent',
								border: '1px dashed rgba(255,255,255,0.3)',
								color: 'rgba(255,255,255,0.7)',
							}}>
							+ 운동 추가
						</button>
					</>
				)}
			</div>
		</div>
	)
}
