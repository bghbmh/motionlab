'use client'

import {
	WorkoutType, type WorkoutLog, WORKOUT_TYPE_LABELS,
	WORKOUT_ICONS, WORKOUT_COLORS,
} from '@/types/database'

interface Props {
	log: WorkoutLog
	onEdit: (log: WorkoutLog) => void
	onDelete: (log: WorkoutLog) => void
}

// source별 배지 스타일
const SOURCE_BADGE: Record<string, { label: string; bg: string; color: string; border: string }> = {
	routine: {
		label: '● 루틴',
		bg: 'rgba(61,219,181,0.1)',
		color: '#3DDBB5',
		border: 'rgba(61,219,181,0.25)',
	},
	manual: {
		label: '✎ 직접',
		bg: 'rgba(255,255,255,0.06)',
		color: 'rgba(255,255,255,0.4)',
		border: 'rgba(255,255,255,0.12)',
	},
	daily: {
		label: '🏠 일상',
		bg: 'rgba(255,179,71,0.1)',
		color: '#FFB347',
		border: 'rgba(255,179,71,0.25)',
	},
}

export default function WorkoutLogCard({ log, onEdit, onDelete }: Props) {
	const colors = WORKOUT_COLORS[log.workout_type]
	const icon = WORKOUT_ICONS[log.workout_type]
	const label = WORKOUT_TYPE_LABELS[log.workout_type]

	const metsTotal = Math.round(log.mets_score * log.duration_min * 10) / 10
	const metsColor =
		metsTotal >= 200 ? '#FF6B5B' :
			metsTotal >= 100 ? '#3DDBB5' : '#FFB347'

	// source가 없는 기존 데이터는 manual로 fallback
	const source = log.source ?? 'manual'
	const badge = SOURCE_BADGE[source] ?? SOURCE_BADGE.manual

	return (
		<div className="ml-card flex flex-col gap-3" style={{ borderColor: colors.border }}>

			{/* 상단: 날짜 + 출처 배지 + 액션 버튼 */}
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-2">
					<span className="font-mono text-xs font-medium"
						style={{ color: 'rgba(255,255,255,0.3)' }}>
						{log.logged_at}
					</span>
					{/* ★ source 배지 */}
					<span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
						style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
						{badge.label}
					</span>
				</div>
				<div className="flex gap-1.5">
					<button onClick={() => onEdit(log)}
						className="rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all"
						style={{ background: 'rgba(61,219,181,0.08)', border: '1px solid rgba(61,219,181,0.2)', color: 'rgba(61,219,181,0.7)' }}>
						수정
					</button>
					<button onClick={() => onDelete(log)}
						className="rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all"
						style={{ background: 'rgba(255,107,91,0.08)', border: '1px solid rgba(255,107,91,0.2)', color: 'rgba(255,107,91,0.7)' }}>
						삭제
					</button>
				</div>
			</div>

			{/* 중단: 운동 종류 + 수치 */}
			<div className="flex items-center gap-3">
				<div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
					style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
					{icon}
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-bold text-white">{label}</p>
					<p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
						{log.duration_min}분 운동
					</p>
				</div>
				<div className="text-right shrink-0">
					<p className="font-mono text-xl font-medium" style={{ color: metsColor }}>
						{metsTotal}
					</p>
					<p className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
						METs
					</p>
				</div>
			</div>

			{/* 컨디션 메모 */}
			{log.condition_memo && (
				<div className="rounded-xl px-3 py-2"
					style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
					<p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
						💬 {log.condition_memo}
					</p>
				</div>
			)}
		</div>
	)
}