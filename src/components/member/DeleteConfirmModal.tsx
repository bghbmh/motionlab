'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
	WorkoutType, type WorkoutLog, WORKOUT_TYPE_LABELS,
	WORKOUT_ICONS,
	WORKOUT_COLORS,

} from '@/types/database'


// ─── 삭제 확인 모달 ───────────────────────────────────────────────
export default function DeleteConfirmModal({
	log,
	onClose,
	onDeleted,
}: {
	log: WorkoutLog
	onClose: () => void
	onDeleted: () => void
}) {
	const [loading, setLoading] = useState(false)

	async function handleDelete() {
		setLoading(true)
		const supabase = createClient()
		await supabase.from('workout_logs').delete().eq('id', log.id)
		setLoading(false)
		onDeleted()
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center px-5"
			style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
			onClick={onClose}
		>
			<div
				className="w-full max-w-xs rounded-2xl p-6 flex flex-col gap-4"
				style={{
					background: '#141e2e',
					border: '1px solid rgba(255,107,91,0.25)',
				}}
				onClick={e => e.stopPropagation()}
			>
				<div className="text-center">
					<p className="text-2xl mb-2">🗑️</p>
					<p className="text-sm font-semibold text-white">기록을 삭제할까요?</p>
					<p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
						{log.logged_at} · {WORKOUT_TYPE_LABELS[log.workout_type]} {log.duration_min}분
					</p>
					<p className="text-xs mt-0.5" style={{ color: 'rgba(255,107,91,0.7)' }}>
						삭제 후 복구할 수 없습니다.
					</p>
				</div>
				<div className="flex gap-2">
					<button onClick={onClose} className="btn-ghost flex-1 py-2.5 text-sm">
						취소
					</button>
					<button
						onClick={handleDelete}
						disabled={loading}
						className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
						style={{
							background: 'rgba(255,107,91,0.15)',
							border: '1px solid rgba(255,107,91,0.4)',
							color: '#FF6B5B',
							opacity: loading ? 0.5 : 1,
						}}
					>
						{loading ? '삭제 중...' : '삭제'}
					</button>
				</div>
			</div>
		</div>
	)
}