// src/components/member/RecordListManager.tsx
// 기록탭 클라이언트 컴포넌트

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
import DailyActivityModal, { type DailyActivityOption } from '@/components/member/DailyActivityModal'
import DailyActivityDurationModal from '@/components/member/DailyActivityDurationModal'
import BottomSheet from '@/components/member/ui/BottomSheet'
import ModalHeader from '@/components/member/ui/ModalHeader'

interface Props {
	member: { id: string }
	initialLogs: WorkoutLog[]
	today: string
}

// ── 탭 타입 ────────────────────────────────────────────────────
type AddTab = 'workout' | 'daily'

export default function RecordListManager({ member, initialLogs, today }: Props) {
	const router = useRouter()
	const [logs, setLogs] = useState<WorkoutLog[]>(initialLogs)

	// ── 운동 추가/수정 모달 ────────────────────────────────────
	const [modalOpen, setModalOpen] = useState(false)
	const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
	const [editTarget, setEditTarget] = useState<WorkoutLog | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<WorkoutLog | null>(null)

	// ── 통합 추가 모달 상태 ────────────────────────────────────
	const [showAddModal, setShowAddModal] = useState(false)
	const [activeTab, setActiveTab] = useState<AddTab>('workout')

	// ── 일상활동 단계 상태 ─────────────────────────────────────
	const [dailyStep, setDailyStep] = useState<'select' | 'duration'>('select')
	const [selectedDailyOpt, setSelectedDailyOpt] = useState<DailyActivityOption | null>(null)
	const [dailyLoggedAt, setDailyLoggedAt] = useState(today)

	const fetchLogs = useCallback(async () => {
		const supabase = createClient()
		const { data } = await supabase
			.from('workout_logs')
			.select('*')
			.eq('member_id', member.id)
			.order('logged_at', { ascending: false })
		if (data) setLogs(data as WorkoutLog[])
	}, [member.id])

	useEffect(() => {
		fetchLogs()
	}, [fetchLogs])

	// ── 통합 모달 열기 ─────────────────────────────────────────
	function openAddModal(tab: AddTab = 'workout') {
		setActiveTab(tab)
		setDailyStep('select')
		setSelectedDailyOpt(null)
		setDailyLoggedAt(today)
		setShowAddModal(true)
	}

	function closeAddModal() {
		setShowAddModal(false)
		setDailyStep('select')
		setSelectedDailyOpt(null)
	}

	// ── 탭 전환 시 일상활동 단계 초기화 ───────────────────────
	function handleTabChange(tab: AddTab) {
		setActiveTab(tab)
		setDailyStep('select')
		setSelectedDailyOpt(null)
	}

	// ── 운동 추가/수정 저장 ────────────────────────────────────
	async function handleSave(data: {
		workout_type: WorkoutType
		intensity: string
		duration_min: number
		logged_at?: string
		condition_memo?: string
	}) {
		const supabase = createClient()
		const metsScore = WORKOUT_METS_BY_INTENSITY[data.workout_type][data.intensity as Intensity]

		if (modalMode === 'add') {
			await supabase.from('workout_logs').insert({
				member_id: member.id,
				logged_at: data.logged_at ?? today,
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
				await supabase
					.from('workout_logs')
					.update({
						duration_min: data.duration_min,
						mets_score: editTarget.mets_score,
						condition_memo: data.condition_memo ?? null,
					})
					.eq('id', editTarget.id)
			} else {
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

	// ── 일상활동 저장 ──────────────────────────────────────────
	async function handleDailySave(opt: DailyActivityOption, durationMin: number) {
		const supabase = createClient()
		await supabase.from('workout_logs').insert({
			member_id: member.id,
			logged_at: dailyLoggedAt,
			workout_type: 'other' as WorkoutType,
			duration_min: durationMin,
			mets_score: opt.mets_value,
			condition_memo: null,
			source: 'daily',
			activity_type: opt.activity_type,
			note_workout_id: null,
			is_manual_daily: true,
		})
		closeAddModal()
		await fetchLogs()
		router.refresh()
	}

	async function handleDeleted() {
		setDeleteTarget(null)
		await fetchLogs()
		router.refresh()
	}

	const grouped = logs.reduce<Record<string, Record<string, WorkoutLog[]>>>((acc, log) => {
		const month = log.logged_at.slice(0, 7)
		const date = log.logged_at
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
					<div className='flex flex-col p-2 items-center justify-center h-[70vh] bg-white'>
						<img src='/images/workout/none_workout.png' width={130} className='-mt-16' />
						<p className="text-sm text-neutral-600 pt-4">아직 운동 기록이 없어요.</p>
					</div>
				)}

				{months.map(month => {
					const [y, m] = month.split('-')
					const dateMap = grouped[month]
					const dates = Object.keys(dateMap).sort((a, b) => b.localeCompare(a))

					return (
						<MonthSection
							key={month}
							year={Number(y)}
							month={Number(m)}
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
											memberId={member.id}
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

			{/* FAB — 추가 버튼 */}
			<button
				type="button"
				onClick={() => openAddModal('workout')}
				className="fixed bottom-24 right-4 w-14 h-14 rounded-full btn-primary text-2xl shadow-lg flex items-center justify-center"
				aria-label="운동 기록 추가"
			>
				+
			</button>

			{/* ── 통합 추가 모달 (탭형) ─────────────────────────────── */}
			{showAddModal && (
				<BottomSheet onClose={closeAddModal} className="h-[80vh]">

					{/* 헤더 */}
					<ModalHeader
						title="기록 추가"
						onClose={closeAddModal}
					/>

					{/* 탭 */}
					<div className="flex gap-1 px-6 pt-4 pb-0">
						{(['workout', 'daily'] as AddTab[]).map(tab => {
							const isActive = activeTab === tab
							const label = tab === 'workout' ? '💪 운동' : '🏃 일상활동'
							return (
								<button
									key={tab}
									type="button"
									onClick={() => handleTabChange(tab)}
									className="flex-1 py-[10px] rounded-[10px] text-[14px] font-medium transition-all"
									style={{
										backgroundColor: isActive ? '#e6faf5' : '#f8fafc',
										border: `1px solid ${isActive ? 'rgba(11,180,137,0.7)' : '#e2e8f0'}`,
										color: isActive ? '#099970' : '#64748b',
									}}
								>
									{label}
								</button>
							)
						})}
					</div>

					{/* 탭 콘텐츠 */}
					<div className="flex-1 overflow-y-auto min-h-0">

						{/* 운동 탭 */}
						{activeTab === 'workout' && (
							<WorkoutRecordModal
								mode="add"
								onSave={async (data) => {
									await handleSave(data)
									closeAddModal()
								}}
								onClose={closeAddModal}
								embeddedMode
							/>
						)}

						{/* 일상활동 탭 */}
						{activeTab === 'daily' && (
							<>
								{dailyStep === 'select' && (
									<DailyActivityModal
										excludeTypes={[]}
										onAdd={(opt) => {
											setSelectedDailyOpt(opt)
											setDailyStep('duration')
										}}
										onClose={closeAddModal}
										embeddedMode
									/>
								)}
								{dailyStep === 'duration' && selectedDailyOpt && (
									<DailyActivityDurationModal
										option={selectedDailyOpt}
										onConfirm={(opt, durationMin) => handleDailySave(opt, durationMin)}
										onBack={() => setDailyStep('select')}
										onClose={closeAddModal}
									/>
								)}
							</>
						)}
					</div>

				</BottomSheet>
			)}

			{/* 운동 수정 모달 (별도 유지) */}
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
