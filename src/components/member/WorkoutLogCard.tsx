'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
	WorkoutType, type WorkoutLog, WORKOUT_TYPE_LABELS,
	WORKOUT_ICONS,
	WORKOUT_COLORS,

} from '@/types/database'


// ─── 기본 폼 상태 ─────────────────────────────────────────────────
const DEFAULT_FORM = {
	workout_type: 'pilates' as WorkoutType,
	duration: '',
	mets: '',
	condition_memo: '',
	logged_at: new Date().toISOString().split('T')[0],
}

interface Props {
	log: WorkoutLog
	onEdit: (log: WorkoutLog) => void
	onDelete: (log: WorkoutLog) => void
}

export default function WorkoutLogCard({ log, onEdit, onDelete, }: Props) {

	const colors = WORKOUT_COLORS[log.workout_type]
	const icon = WORKOUT_ICONS[log.workout_type]
	const label = WORKOUT_TYPE_LABELS[log.workout_type]

	const metsLevel =
		log.mets_score >= 6 ? 'high' :
			log.mets_score >= 3.5 ? 'normal' : 'low'
	const metsColor =
		metsLevel === 'high' ? '#FF6B5B' :
			metsLevel === 'normal' ? '#3DDBB5' : '#FFB347'

	return (
		<div
			className="ml-card flex flex-col gap-3"
			style={{ borderColor: colors.border }}
		>
			{/* 상단: 날짜 + 액션 버튼 */}
			<div className="flex justify-between items-center">
				<span
					className="font-mono text-xs font-medium"
					style={{ color: 'rgba(255,255,255,0.3)' }}
				>
					{log.logged_at}
				</span>
				<div className="flex gap-1.5">
					<button
						onClick={() => onEdit(log)}
						className="rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all"
						style={{
							background: 'rgba(61,219,181,0.08)',
							border: '1px solid rgba(61,219,181,0.2)',
							color: 'rgba(61,219,181,0.7)',
						}}
					>
						수정
					</button>
					<button
						onClick={() => onDelete(log)}
						className="rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all"
						style={{
							background: 'rgba(255,107,91,0.08)',
							border: '1px solid rgba(255,107,91,0.2)',
							color: 'rgba(255,107,91,0.7)',
						}}
					>
						삭제
					</button>
				</div>
			</div>

			{/* 중단: 운동 종류 + 수치 */}
			<div className="flex items-center gap-3">
				{/* 아이콘 배지 */}
				<div
					className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
					style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
				>
					{icon}
				</div>

				{/* 텍스트 */}
				<div className="flex-1 min-w-0">
					<p className="text-sm font-bold text-white">{label}</p>
					<p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
						{log.duration_min}분 운동
					</p>
				</div>

				{/* METs 점수 */}
				<div className="text-right shrink-0">
					<p className="font-mono text-xl font-medium" style={{ color: metsColor }}>
						{log.mets_score * log.duration_min}
					</p>
					<p className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
						METs
					</p>
				</div>
			</div>

			{/* 컨디션 메모 */}
			{log.condition_memo && (
				<div
					className="rounded-xl px-3 py-2"
					style={{
						background: 'rgba(255,255,255,0.03)',
						border: '1px solid rgba(255,255,255,0.06)',
					}}
				>
					<p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
						💬 {log.condition_memo}
					</p>
				</div>
			)}
		</div>
	)


}