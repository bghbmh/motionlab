'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
	WORKOUT_TYPE_LABELS,
	WORKOUT_TYPE_METS,
	type WorkoutType,
	type WorkoutLog,
} from '@/types/database'

// ─── 운동 타입 아이콘 ─────────────────────────────────────────────
const WORKOUT_ICONS: Record<WorkoutType, string> = {
	stretching: '🧘',
	strength: '💪',
	cardio: '🏃',
	pilates: '🌿',
	yoga: '☯️',
	other: '⚡',
}

const WORKOUT_COLORS: Record<WorkoutType, { bg: string; border: string; text: string }> = {
	stretching: { bg: 'rgba(255,179,71,0.08)', border: 'rgba(255,179,71,0.2)', text: '#FFB347' },
	strength: { bg: 'rgba(255,107,91,0.08)', border: 'rgba(255,107,91,0.2)', text: '#FF6B5B' },
	cardio: { bg: 'rgba(61,219,181,0.08)', border: 'rgba(61,219,181,0.2)', text: '#3DDBB5' },
	pilates: { bg: 'rgba(61,219,181,0.08)', border: 'rgba(61,219,181,0.2)', text: '#3DDBB5' },
	yoga: { bg: 'rgba(255,179,71,0.08)', border: 'rgba(255,179,71,0.2)', text: '#FFB347' },
	other: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.4)' },
}

// ─── 기본 폼 상태 ─────────────────────────────────────────────────
const DEFAULT_FORM = {
	workout_type: 'pilates' as WorkoutType,
	duration: '',
	mets: '',
	condition_memo: '',
	logged_at: new Date().toISOString().split('T')[0],
}

// ─── 로그 입력 모달 ───────────────────────────────────────────────
function RecordModal({
	editTarget,
	onClose,
	onSaved,
	memberId,
}: {
	editTarget: WorkoutLog | null
	onClose: () => void
	onSaved: () => void
	memberId: string
}) {
	const [form, setForm] = useState(() =>
		editTarget
			? {
				workout_type: editTarget.workout_type,
				duration: String(editTarget.duration_min),
				mets: String(editTarget.mets_score),
				condition_memo: editTarget.condition_memo ?? '',
				logged_at: editTarget.logged_at,
			}
			: { ...DEFAULT_FORM }
	)
	const [loading, setLoading] = useState(false)

	function selectType(t: WorkoutType) {
		setForm(prev => ({
			...prev,
			workout_type: t,
			mets: prev.mets || String(WORKOUT_TYPE_METS[t]),
		}))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!form.duration || !form.mets) return
		setLoading(true)

		const supabase = createClient()

		if (editTarget) {
			// 수정
			await supabase
				.from('workout_logs')
				.update({
					workout_type: form.workout_type,
					duration_min: Number(form.duration),
					mets_score: WORKOUT_TYPE_METS[form.workout_type],
					condition_memo: form.condition_memo || null,
					logged_at: form.logged_at,
				})
				.eq('id', editTarget.id)
		} else {
			// 신규
			await supabase.from('workout_logs').upsert(
				{
					member_id: memberId,
					logged_at: form.logged_at,
					workout_type: form.workout_type,
					duration_min: Number(form.duration),
					mets_score: Number(form.mets),
					condition_memo: form.condition_memo || null,
				},
				{ onConflict: 'member_id,logged_at' }
			)
		}

		setLoading(false)
		onSaved()
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center"
			style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
			onClick={onClose}
		>
			<div
				className="w-full max-w-md rounded-t-3xl flex flex-col"
				style={{
					background: '#141e2e',
					border: '1px solid rgba(255,255,255,0.08)',
					borderBottom: 'none',
					maxHeight: '90vh',
					overflowY: 'auto',
				}}
				onClick={e => e.stopPropagation()}
			>
				{/* 핸들 */}
				<div className="flex justify-center pt-3 pb-1">
					<div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
				</div>

				<div className="px-5 pb-8 flex flex-col gap-5">
					{/* 헤더 */}
					<div className="flex justify-between items-center pt-2">
						<p className="font-mono text-sm font-medium" style={{ color: '#3DDBB5' }}>
							{editTarget ? '기록 수정' : '새 운동 기록'}
						</p>
						<button
							onClick={onClose}
							className="btn-ghost text-xs py-1 px-2.5"
						>
							✕
						</button>
					</div>

					{/* 운동 종류 */}
					<div>
						<p className="ml-card-label">운동 종류</p>
						<div className="grid grid-cols-3 gap-2">
							{(Object.keys(WORKOUT_TYPE_LABELS) as WorkoutType[]).map(t => {
								const colors = WORKOUT_COLORS[t]
								const isSelected = form.workout_type === t
								return (
									<button
										key={t}
										type="button"
										onClick={() => selectType(t)}
										className="py-2.5 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-1"
										style={{
											background: isSelected ? colors.bg : '#1a2740',
											border: `1px solid ${isSelected ? colors.border : 'rgba(255,255,255,0.07)'}`,
											color: isSelected ? colors.text : 'rgba(255,255,255,0.35)',
										}}
									>
										<span className="text-base">{WORKOUT_ICONS[t]}</span>
										<span className="text-[11px]">{WORKOUT_TYPE_LABELS[t]}</span>
									</button>
								)
							})}
						</div>
					</div>

					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						{/* 날짜 */}
						<div>
							<p className="ml-card-label">날짜</p>
							<input
								className="ml-input"
								type="date"
								value={form.logged_at}
								onChange={e => setForm(p => ({ ...p, logged_at: e.target.value }))}
								required
							/>
						</div>

						{/* METs + 시간 가로 배치 */}
						<div className="grid grid-cols-3 gap-3">
							<div className='col-span-2'>
								<p className="ml-card-label">운동 시간 (분)</p>
								<input
									className="ml-input"
									type="number"
									placeholder="예: 30"
									value={form.duration}
									onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
									required
								/>
							</div>
							<div>
								<p className="ml-card-label">METs 점수</p>
								{/* <input
									className="ml-input"
									type="number"
									step="0.1"
									placeholder="예: 4.5"
									value={form.mets}
									onChange={e => setForm(p => ({ ...p, mets: e.target.value }))}
									required
								/> */}
								<div className="ml-input border-transparent">
									{WORKOUT_TYPE_METS[form.workout_type].toFixed(1)}
								</div>
							</div>
						</div>

						{/* 참고 METs */}
						<div
							className="rounded-xl px-3 py-2"
							style={{ background: '#1a2740', border: '1px solid rgba(255,255,255,0.05)' }}
						>
							<p className="text-[10px] font-mono leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>
								참고 · 스트레칭 2.5 / 걷기 3.5 / 필라테스 4.0 / 근력운동 5.0 / 달리기 8.0
							</p>
						</div>

						{/* 컨디션 메모 */}
						<div>
							<p className="ml-card-label">컨디션 메모 (선택)</p>
							<input
								className="ml-input"
								placeholder="예: 허리가 약간 뻐근했어요"
								value={form.condition_memo}
								onChange={e => setForm(p => ({ ...p, condition_memo: e.target.value }))}
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="btn-primary py-3.5 text-sm mt-1"
							style={{ opacity: loading ? 0.5 : 1 }}
						>
							{loading ? '저장 중...' : editTarget ? '수정 완료' : '기록 저장'}
						</button>
					</form>
				</div>
			</div>
		</div>
	)
}

// ─── 삭제 확인 모달 ───────────────────────────────────────────────
function DeleteConfirmModal({
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

// ─── 기록 카드 ────────────────────────────────────────────────────
function LogCard({
	log,
	onEdit,
	onDelete,
}: {
	log: WorkoutLog
	onEdit: (log: WorkoutLog) => void
	onDelete: (log: WorkoutLog) => void
}) {
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
					<p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
						{log.duration_min}분 운동
					</p>
				</div>

				{/* METs 점수 */}
				<div className="text-right shrink-0">
					<p className="font-mono text-xl font-medium" style={{ color: metsColor }}>
						{log.mets_score.toFixed(1)}
					</p>
					<p className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
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

// ─── 빈 상태 ─────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center pt-20 px-8 gap-5">
			<div
				className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl"
				style={{
					background: 'rgba(61,219,181,0.07)',
					border: '1px solid rgba(61,219,181,0.15)',
				}}
			>
				📋
			</div>
			<div className="text-center">
				<p className="text-white font-semibold text-sm">아직 기록된 운동이 없어요</p>
				<p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
					오른쪽 아래 버튼을 눌러<br />첫 번째 운동을 기록해보세요!
				</p>
			</div>
			<button
				onClick={onAdd}
				className="btn-primary px-6 py-3 text-sm"
			>
				첫 기록 추가하기 ✏️
			</button>
		</div>
	)
}

// ─── 메인 페이지 ──────────────────────────────────────────────────
export default function RecordPage() {
	const { token } = useParams<{ token: string }>()

	const [logs, setLogs] = useState<WorkoutLog[]>([])
	const [memberId, setMemberId] = useState<string>('')
	const [loading, setLoading] = useState(true)

	// 모달 상태
	const [showModal, setShowModal] = useState(false)
	const [editTarget, setEditTarget] = useState<WorkoutLog | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<WorkoutLog | null>(null)

	const fetchLogs = useCallback(async () => {
		const supabase = createClient()

		const { data: member } = await supabase
			.from('members')
			.select('id')
			.eq('access_token', token)
			.single()

		if (!member) { setLoading(false); return }

		setMemberId(member.id)

		const { data } = await supabase
			.from('workout_logs')
			.select('*')
			.eq('member_id', member.id)
			.order('logged_at', { ascending: false })

		setLogs((data ?? []) as WorkoutLog[])
		setLoading(false)
	}, [token])

	useEffect(() => { fetchLogs() }, [fetchLogs])

	function openNew() {
		setEditTarget(null)
		setShowModal(true)
	}

	function openEdit(log: WorkoutLog) {
		setEditTarget(log)
		setShowModal(true)
	}

	function handleSaved() {
		setShowModal(false)
		setEditTarget(null)
		fetchLogs()
	}

	function handleDeleted() {
		setDeleteTarget(null)
		fetchLogs()
	}

	// 날짜별 그룹
	const grouped = logs.reduce<Record<string, WorkoutLog[]>>((acc, log) => {
		const month = log.logged_at.slice(0, 7) // "YYYY-MM"
		if (!acc[month]) acc[month] = []
		acc[month].push(log)
		return acc
	}, {})

	const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

	function formatMonth(ym: string) {
		const [y, m] = ym.split('-')
		return `${y}년 ${Number(m)}월`
	}

	return (
		<div className="p-4 flex flex-col gap-4 pb-24">
			{/* 헤더 */}
			<div className="flex justify-between items-center pt-1">
				<h2 className="text-base font-bold text-white">내 운동 기록</h2>
				{!loading && logs.length > 0 && (
					<span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
						총 {logs.length}회
					</span>
				)}
			</div>

			{/* 로딩 */}
			{loading && (
				<div className="flex justify-center pt-12">
					<div
						className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
						style={{ borderColor: 'rgba(61,219,181,0.3)', borderTopColor: 'transparent' }}
					/>
				</div>
			)}

			{/* 빈 상태 */}
			{!loading && logs.length === 0 && (
				<EmptyState onAdd={openNew} />
			)}

			{/* 기록 목록 (월별 그룹) */}
			{!loading && logs.length > 0 && months.map(month => (
				<div key={month} className="flex flex-col gap-2">
					{/* 월 구분선 */}
					<div className="flex items-center gap-2 mt-1">
						<span
							className="font-mono text-[11px] font-medium shrink-0"
							style={{ color: 'rgba(255,255,255,0.3)' }}
						>
							{formatMonth(month)}
						</span>
						<div
							className="flex-1 h-px"
							style={{ background: 'rgba(255,255,255,0.06)' }}
						/>
						<span
							className="font-mono text-[10px] shrink-0"
							style={{ color: 'rgba(255,255,255,0.2)' }}
						>
							{grouped[month].length}회
						</span>
					</div>

					{grouped[month].map(log => (
						<LogCard
							key={log.id}
							log={log}
							onEdit={openEdit}
							onDelete={setDeleteTarget}
						/>
					))}
				</div>
			))}

			{/* 플로팅 추가 버튼 */}
			<button
				onClick={openNew}
				className="fixed bottom-20 right-4 z-40 flex items-center justify-center
                   shadow-2xl transition-all active:scale-95"
				style={{
					width: 56,
					height: 56,
					borderRadius: '1.25rem',
					background: '#3DDBB5',
					boxShadow: '0 8px 32px rgba(61,219,181,0.35)',
					color: '#0d1421',
					fontSize: '1.5rem',
					fontWeight: 700,
				}}
				aria-label="새 기록 추가"
			>
				＋
			</button>

			{/* 기록 입력 모달 */}
			{showModal && (
				<RecordModal
					editTarget={editTarget}
					onClose={() => { setShowModal(false); setEditTarget(null) }}
					onSaved={handleSaved}
					memberId={memberId}
				/>
			)}

			{/* 삭제 확인 모달 */}
			{deleteTarget && (
				<DeleteConfirmModal
					log={deleteTarget}
					onClose={() => setDeleteTarget(null)}
					onDeleted={handleDeleted}
				/>
			)}
		</div>
	)
}
