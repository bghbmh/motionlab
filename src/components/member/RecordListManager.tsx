'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
	type WorkoutLog,
} from '@/types/database'

import RecordListEmptyState from './RecordListEmptyState';
import WorkoutLogCard from './WorkoutLogCard';
import RecordModal from './RecordModal';
import DeleteConfirmModal from './DeleteConfirmModal';

interface Props {
	member: any,
	hasLogs: WorkoutLog[]
}

export default function RecordListManager({ member, hasLogs }: Props) {

	const [logs, setLogs] = useState<WorkoutLog[]>(hasLogs)
	const [memberId, setMemberId] = useState<string>(member.id)
	const [loading, setLoading] = useState(false)


	// 모달 상태
	const [showModal, setShowModal] = useState(false)
	const [editTarget, setEditTarget] = useState<WorkoutLog | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<WorkoutLog | null>(null)

	const fetchLogs = useCallback(async () => {
		setLoading(true)
		const supabase = createClient()

		const { data, error } = await supabase
			.from('workout_logs')
			.select('*')
			.eq('member_id', member.id)
			.order('logged_at', { ascending: false })

		if (!error && data) {
			setLogs(data as WorkoutLog[])
		}
		setLoading(false)
	}, [memberId])

	useEffect(() => { fetchLogs() }, [fetchLogs])


	//console.log("RecordListManager - ", member, hasLogs)

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

	// 월별 그룹 → 그 안에 날짜별 그룹
	const grouped = logs.reduce<Record<string, Record<string, WorkoutLog[]>>>((acc, log) => {
		const month = log.logged_at.slice(0, 7)   // "YYYY-MM"
		const date = log.logged_at               // "YYYY-MM-DD"
		if (!acc[month]) acc[month] = {}
		if (!acc[month][date]) acc[month][date] = []
		acc[month][date].push(log)
		return acc
	}, {})

	const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

	function formatMonth(ym: string) {
		const [y, m] = ym.split('-')
		return `${y}년 ${Number(m)}월`
	}

	return (
		<>
			{/* 빈 상태 */}
			{logs.length === 0 && (
				<RecordListEmptyState onAdd={openNew} />
			)}

			{/* 기록 목록 (월별 그룹, 일별 그룹) */}
			{logs.length > 0 && months.map(month => {
				const dateMap = grouped[month]
				const dates = Object.keys(dateMap).sort((a, b) => b.localeCompare(a))
				const uniqueDayCount = dates.length  // 날짜 수로 월별 횟수 계산

				return (
					<div key={month} className="flex flex-col gap-2">
						{/* 월 구분선 */}
						<div className="flex items-center gap-2 mt-1">
							<span className="font-mono text-[11px] font-medium shrink-0"
								style={{ color: 'rgba(255,255,255,0.3)' }}>
								{formatMonth(month)}
							</span>
							<div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
							<span className="font-mono text-[10px] shrink-0"
								style={{ color: 'rgba(255,255,255,0.2)' }}>
								{uniqueDayCount}회  {/* ← 날짜 수 */}
							</span>
						</div>

						{/* 날짜별 그룹 */}
						{dates.map(date => {
							const dayLogs = dateMap[date]
							const totalDuration = dayLogs.reduce((sum, l) => sum + l.duration_min, 0)
							const totalMets = dayLogs.reduce((sum, l) => sum + l.mets_score * l.duration_min, 0)

							return (
								<div key={date} className="flex flex-col gap-2">
									{/* 날짜 헤더 */}
									<div className="flex items-center justify-between px-1 mt-1">
										<span className="font-mono text-[11px]"
											style={{ color: 'rgba(255,255,255,0.7)' }}>
											{date}
										</span>
										<div className="flex gap-3">
											<span className="font-mono text-[11px]"
												style={{ color: 'rgba(255,255,255,0.7)' }}>
												⏱ {totalDuration}분
											</span>
											<span className="font-mono text-[11px]"
												style={{ color: 'rgba(61,219,181,0.7)' }}>
												{totalMets} METs{/*  {Math.round(totalMets)} */}
											</span>
										</div>
									</div>

									{/* 해당 날짜의 운동 카드들 */}
									{dayLogs.map(log => (
										<WorkoutLogCard
											key={log.id}
											log={log}
											onEdit={openEdit}
											onDelete={setDeleteTarget}
										/>
									))}
								</div>
							)
						})}
					</div>
				)
			})}

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
		</>

	);


}