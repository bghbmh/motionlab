'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
	WORKOUT_TYPE_LABELS,
	WORKOUT_TYPE_METS,
	type WorkoutType,
} from '@/types/database'

const today = new Date().toISOString().split('T')[0]

export default function RecordPage() {
	const router = useRouter()
	const { token } = useParams<{ token: string }>()   // ← useParams 사용

	const [workoutType, setWorkoutType] = useState<WorkoutType>('pilates')
	const [duration, setDuration] = useState('')
	const [mets, setMets] = useState('')
	const [conditionMemo, setConditionMemo] = useState('')
	const [loading, setLoading] = useState(false)
	const [done, setDone] = useState(false)

	function selectType(t: WorkoutType) {
		setWorkoutType(t)
		if (!mets) setMets(String(WORKOUT_TYPE_METS[t]))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!duration || !mets) return
		setLoading(true)

		const supabase = createClient()

		const { data: member } = await supabase
			.from('members')
			.select('id')
			.eq('access_token', token)
			.single()

		if (!member) { setLoading(false); return }

		const { error } = await supabase.from('workout_logs').upsert({
			member_id: member.id,
			logged_at: today,
			workout_type: workoutType,
			duration_min: Number(duration),
			mets_score: Number(mets),
			condition_memo: conditionMemo || null,
		}, { onConflict: 'member_id,logged_at' })

		if (!error) {
			setDone(true)
			setTimeout(() => router.push(`/m/${token}`), 1200)
		}
		setLoading(false)
	}

	if (done) {
		return (
			<div className="flex flex-col items-center justify-center h-64 gap-3">
				<span className="text-4xl">🎉</span>
				<p className="text-white font-semibold">기록 완료!</p>
				<p className="text-white/40 text-sm">홈으로 이동합니다...</p>
			</div>
		)
	}

	return (
		<div className="p-4 flex flex-col gap-4">
			<div className="ml-card">
				<p className="ml-card-label">운동 종류</p>
				<div className="grid grid-cols-3 gap-2">
					{(Object.keys(WORKOUT_TYPE_LABELS) as WorkoutType[]).map(t => (
						<button
							key={t}
							type="button"
							onClick={() => selectType(t)}
							className={`py-2.5 rounded-xl text-sm font-semibold transition-all
                ${workoutType === t
									? 'bg-mint/10 border border-mint text-mint'
									: 'bg-card2 border border-white/[0.07] text-white/40'
								}`}
							style={{
								backgroundColor: workoutType === t ? 'rgba(61,219,181,0.1)' : '#1a2740',
								borderColor: workoutType === t ? '#3DDBB5' : 'rgba(255,255,255,0.07)',
								color: workoutType === t ? '#3DDBB5' : 'rgba(255,255,255,0.4)',
							}}
						>
							{WORKOUT_TYPE_LABELS[t]}
						</button>
					))}
				</div>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<div className="ml-card flex flex-col gap-3">
					<p className="ml-card-label">운동 기록 입력</p>

					<div>
						<p className="ml-card-label">METs 점수</p>
						<input
							className="ml-input"
							type="number"
							step="0.1"
							placeholder="예: 4.5"
							value={mets}
							onChange={e => setMets(e.target.value)}
							required
						/>
					</div>

					<div>
						<p className="ml-card-label">운동 시간 (분)</p>
						<input
							className="ml-input"
							type="number"
							placeholder="예: 30"
							value={duration}
							onChange={e => setDuration(e.target.value)}
							required
						/>
					</div>

					<div style={{ backgroundColor: '#1a2740', borderRadius: '0.75rem', padding: '0.75rem' }}>
						<p className="text-[10px] text-white/30 font-mono leading-relaxed">
							참고 · 스트레칭 2.5 / 걷기 3.5 / 필라테스 4.0 / 근력운동 5.0 / 달리기 8.0
						</p>
					</div>

					<div>
						<p className="ml-card-label">컨디션 메모 (선택)</p>
						<input
							className="ml-input"
							placeholder="예: 허리가 약간 뻐근했어요"
							value={conditionMemo}
							onChange={e => setConditionMemo(e.target.value)}
						/>
					</div>
				</div>

				<button
					type="submit"
					disabled={loading}
					className="btn-primary py-4 text-sm"
					style={{ opacity: loading ? 0.5 : 1 }}
				>
					{loading ? '저장 중...' : '기록 저장'}
				</button>
			</form>
		</div>
	)
}
