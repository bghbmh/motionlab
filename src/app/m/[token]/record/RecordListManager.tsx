// src/components/member/RecordListManager.tsx
// 기록탭 클라이언트 컴포넌트
// page.tsx(서버)에서 받은 initialLogs를 상태로 관리
// 추가/수정/삭제 후 DB 반영 + 화면 갱신

'use client'

import { Fragment, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { WorkoutLog, WorkoutType, Intensity } from '@/types/database'
import { WORKOUT_METS_BY_INTENSITY } from '@/types/database'

import { PageHeader } from '@/components/member/PageHeader'
import { MonthSection } from '@/components/member/MonthSection'
import { DaySection } from '@/components/member/DaySection'
import WorkoutRecordModal from '@/components/member/WorkoutRecordModal'
import DeleteConfirmModal from '@/components/member/DeleteConfirmModal'

interface Props {
	member: { id: string }
	initialLogs: WorkoutLog[]
}

export default function RecordListManager({ member, initialLogs }: Props) {
	const router = useRouter()
	const [logs, setLogs] = useState<WorkoutLog[]>(initialLogs)
	const [modalOpen, setModalOpen] = useState(false)
	const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
	const [editTarget, setEditTarget] = useState<WorkoutLog | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<WorkoutLog | null>(null)

	// ── 최신 목록 재조회 ───────────────────────────────────────
	const fetchLogs = useCallback(async () => {
		const supabase = createClient()
		const { data } = await supabase
			.from('workout_logs')
			.select('*')
			.eq('member_id', member.id)
			.order('logged_at', { ascending: false })
		if (data) setLogs(data as WorkoutLog[])
	}, [member.id])

	// 탭 이동 시 최신 데이터 반영
	// 알림장탭/홈탭에서 운동 체크 후 기록탭으로 오면 자동 갱신
	useEffect(() => {
		fetchLogs()
	}, [fetchLogs])

	// ── 추가/수정 저장 ─────────────────────────────────────────
	async function handleSave(data: {
		workout_type: WorkoutType
		intensity: string
		duration_min: number
		condition_memo?: string
	}) {
		const supabase = createClient()
		const metsScore = WORKOUT_METS_BY_INTENSITY[data.workout_type][data.intensity as Intensity]

		if (modalMode === 'add') {
			await supabase.from('workout_logs').insert({
				member_id: member.id,
				logged_at: new Date().toISOString().split('T')[0],
				workout_type: data.workout_type,
				intensity: data.intensity,
				duration_min: data.duration_min,
				mets_score: metsScore,
				condition_memo: data.condition_memo ?? null,
				source: 'manual',
			})
		} else if (editTarget) {
			const isRoutine = editTarget.source === 'routine'

			if (isRoutine) {
				// 알림장 운동 수정 — duration_min(실제 시간)만 변경
				// prescribed_duration_min(처방 시간)은 유지
				// workout_type, intensity는 알림장 원본 기준이므로 변경 안 함
				const routineMets = editTarget.mets_score // 알림장 원본 mets 유지
				await supabase
					.from('workout_logs')
					.update({
						duration_min: data.duration_min,
						mets_score: routineMets,
						condition_memo: data.condition_memo ?? null,
					})
					.eq('id', editTarget.id)
			} else {
				// 직접 기록 수정 — 전체 변경 가능
				await supabase
					.from('workout_logs')
					.update({
						workout_type: data.workout_type,
						intensity: data.intensity,
						duration_min: data.duration_min,
						mets_score: metsScore,
						condition_memo: data.condition_memo ?? null,
					})
					.eq('id', editTarget.id)
			}
		}

		setModalOpen(false)
		setEditTarget(null)
		await fetchLogs()
		router.refresh()
	}

	// ── 삭제 완료 후 처리 ──────────────────────────────────────
	async function handleDeleted() {
		setDeleteTarget(null)
		await fetchLogs()
		router.refresh()
	}

	// ── 월별 → 날짜별 그룹핑 ───────────────────────────────────
	const grouped = logs.reduce<Record<string, Record<string, WorkoutLog[]>>>((acc, log) => {
		const month = log.logged_at.slice(0, 7)  // 'YYYY-MM'
		const date = log.logged_at               // 'YYYY-MM-DD'
		if (!acc[month]) acc[month] = {}
		if (!acc[month][date]) acc[month][date] = []
		acc[month][date].push(log)
		return acc
	}, {})

	const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
	const totalDays = new Set(logs.map(l => l.logged_at)).size

	return (
		<>
			<div className="px-2">
				<PageHeader title="내 운동 기록" count={totalDays} unit="일" />

				{logs.length === 0 && (
					<p className="text-sm text-[#7f847d] pt-4">아직 운동 기록이 없어요.</p>
				)}

				{months.map(month => {
					const [y, m] = month.split('-')
					const year = Number(y)
					const monthNum = Number(m)
					const dateMap = grouped[month]
					const dates = Object.keys(dateMap).sort((a, b) => b.localeCompare(a))

					return (
						<MonthSection
							key={month}
							year={year}
							month={monthNum}
							totalDays={dates.length}
						>
							{dates.map((date, idx) => {
								const dayLogs = dateMap[date]
								const totalDuration = dayLogs.reduce((s, l) => s + l.duration_min, 0)
								const totalMets = Math.round(
									dayLogs.reduce((s, l) => s + l.mets_score * l.duration_min, 0)
								)

								return (
									<Fragment key={date}>
										<DaySection
											date={date}
											totalDurationMin={totalDuration}
											totalMets={totalMets}
											logs={dayLogs}
											onEdit={(log) => {
												setEditTarget(log)
												setModalMode('edit')
												setModalOpen(true)
											}}
											onDelete={setDeleteTarget}
										/>
										{idx < dates.length - 1 && (
											<hr className="border-neutral-200 mt-5 mb-5" />
										)}
									</Fragment>
								)
							})}
						</MonthSection>
					)
				})}
			</div>

			{/* FAB: 운동 추가 버튼 */}
			<button
				type="button"
				onClick={() => {
					setEditTarget(null)
					setModalMode('add')
					setModalOpen(true)
				}}
				className="fixed bottom-24 right-4 w-14 h-14 rounded-full btn-primary text-2xl shadow-lg flex items-center justify-center"
				aria-label="운동 기록 추가"
			>
				+
			</button>

			{/* 운동 추가/수정 모달 */}
			{modalOpen && (
				<WorkoutRecordModal
					mode={modalMode}
					isRoutine={editTarget?.source === 'routine'}
					initialData={
						editTarget
							? {
								workout_type: editTarget.workout_type as WorkoutType,
								intensity: editTarget.intensity ?? 'normal',
								logged_at: editTarget.logged_at,
								duration_min: editTarget.duration_min,
								prescribed_duration_min: editTarget.prescribed_duration_min ?? undefined,
								condition_memo: editTarget.condition_memo,
							}
							: undefined
					}
					onSave={handleSave}
					onClose={() => {
						setModalOpen(false)
						setEditTarget(null)
					}}
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
		</>
	)
}
