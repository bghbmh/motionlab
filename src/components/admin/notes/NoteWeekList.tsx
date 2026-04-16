'use client'

// components/admin/notes/NoteWeekList.tsx

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Note } from '@/types/database'
import type { NoteWithTags } from './noteWorkoutTypes'
import { formatDate, getWeekEnd, resolveDatesForWeek } from '@/lib/weekUtils'
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import SendStatus from '@/components/admin/ui/SendStatus'
import NoteCardView from '@/components/admin/ui/NoteCardView'
import { DescriptionList } from '@/components/admin/ui/NoteCard'

type FilterKey = 'all' | 'sent' | 'unsent'

interface NoteWeekListProps {
	memberId: string
	notes: Note[]
	filter: FilterKey
	onEdit: (note: NoteWithTags) => void
	onNew: () => void
	onRefresh: () => void
}

// ─── 삭제 확인 인라인 ────────────────────────────────────────────
function DeleteConfirm({ onConfirm, onCancel, loading }: {
	onConfirm: () => void
	onCancel: () => void
	loading: boolean
}) {
	return (
		<div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-t border-red-100">
			<span className="text-xs text-red-600 flex-1">삭제 후 복구할 수 없어요. 정말 삭제할까요?</span>
			<button
				type="button"
				onClick={onCancel}
				className="px-3 py-1 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors"
			>
				취소
			</button>
			<button
				type="button"
				onClick={onConfirm}
				disabled={loading}
				className="px-3 py-1 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
			>
				{loading ? '삭제 중...' : '삭제 확인'}
			</button>
		</div>
	)
}

// ─── 주차별 아코디언 행 ───────────────────────────────────────────
function NoteRow({ note, defaultOpen, onEdit, onRefresh }: {
	note: NoteWithTags
	defaultOpen: boolean
	onEdit: (note: NoteWithTags) => void
	onRefresh: () => void
}) {
	const [isOpen, setIsOpen] = useState(defaultOpen)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [deleteLoading, setDeleteLoading] = useState(false)
	const [sendLoading, setSendLoading] = useState(false)

	const weekStart = note.written_at
	// note.days가 날짜 형식('YYYY-MM-DD')인지 요일 형식('월')인지 판별
	const isDateFormat = (note.days ?? []).some(d => d.includes('-'))

	const resolvedDates = isDateFormat
		? (note.days ?? []).sort()                              // 날짜 그대로 사용
		: resolveDatesForWeek(weekStart, note.days ?? ['전체']) // 요일 → 날짜 계산

	const periodLabel = resolvedDates.length > 0
		? `${formatDate(resolvedDates[0])} ~ ${formatDate(resolvedDates[resolvedDates.length - 1])}`
		: `${formatDate(weekStart)} ~ ${formatDate(getWeekEnd(weekStart))}`
	const completedIds = new Set<string>()



	async function handleSend() {
		setSendLoading(true)
		const supabase = createClient()
		const today = new Date().toLocaleDateString('en-CA')  // 로컬 기준 날짜
		await supabase
			.from('notes')
			.update({
				is_sent: true,
				sent_at: today,  // ← 추가
			})
			.eq('id', note.id)
		setSendLoading(false)
		onRefresh()
	}

	async function handleUnsend() {
		setSendLoading(true)
		const supabase = createClient()
		await supabase
			.from('notes')
			.update({
				is_sent: false,
				sent_at: null,  // ← 추가
			})
			.eq('id', note.id)
		setSendLoading(false)
		onRefresh()
	}

	async function handleDelete() {
		setDeleteLoading(true)
		const supabase = createClient()
		await supabase.from('note_tags').delete().eq('note_id', note.id)
		await supabase.from('note_workouts').delete().eq('note_id', note.id)
		await supabase.from('note_videos').delete().eq('note_id', note.id)
		await supabase.from('notes').delete().eq('id', note.id)
		setDeleteLoading(false)
		setShowDeleteConfirm(false)
		onRefresh()
	}

	return (
		<div className="border-b border-neutral-200 border-dashed last:border-b-0">
			{/* 헤더 행 */}
			<div className={`flex  items-center justify-between px-4 py-1.5 ${isOpen ? 'bg-neutral-200' : ''}`}>
				<div className="flex items-center gap-3">
					<span className="text-sm font-semibold text-neutral-800">{periodLabel}</span>
					<div className="flex items-center gap-1">
						<SendStatus done={note.is_sent} />
					</div>
				</div>

				{/* 펼치기 */}
				<button
					type="button"
					onClick={() => setIsOpen(p => !p)}
					className="px-2.5 py-2.5 rounded-md text-neutral-400 bg-white hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
				>
					{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
				</button>
			</div>

			{/* 삭제 확인 */}
			{showDeleteConfirm && (
				<DeleteConfirm
					onConfirm={handleDelete}
					onCancel={() => setShowDeleteConfirm(false)}
					loading={deleteLoading}
				/>
			)}

			{/* 펼쳐진 상세 */}
			{isOpen && (
				<>
					<div className="flex items-center justify-between gap-2 px-4 py-2">

						<span className="text-xs text-neutral-500">{formatDate(note.written_at)} 전송</span>

						<div className='flex items-center gap-2'>
							{/* 수정 */}
							<button
								type="button"
								onClick={() => onEdit(note)}
								className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
								title="수정"
							>
								<Pencil size={14} />
							</button>

							{/* 전송 / 전송 취소 */}
							{note.is_sent ? (
								<button
									type="button"
									onClick={handleUnsend}
									disabled={sendLoading}
									className="px-2 py-1 rounded-lg text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
								>
									{sendLoading ? '처리 중...' : '전송 취소'}
								</button>
							) : (
								<button
									type="button"
									onClick={handleSend}
									disabled={sendLoading}
									className="px-2 py-1 rounded-lg text-xs font-medium text-[#0bb489] border border-[#0bb489] hover:bg-teal-50 transition-colors disabled:opacity-50"
								>
									{sendLoading ? '전송 중...' : '전송'}
								</button>
							)}

							{/* 삭제 */}
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(p => !p)}
								className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors
							${showDeleteConfirm
										? 'text-red-600 bg-red-50 border-red-300'
										: 'text-red-500 border-red-200 hover:bg-red-50'
									}`}
							>
								삭제
							</button>


						</div>


					</div>
					<div className="px-4 pb-4 flex flex-col gap-3">
						<div className="px-3 py-2 border-l-[3px] border-neutral-300 bg-neutral-50 rounded-r-lg flex flex-col gap-1">
							<p className="text-sm text-neutral-700 leading-relaxed">{note.content}</p>
							<DescriptionList items={[
								{ label: '목표 -', value: `${note.recommended_mets} METs` },
								{ label: '기간 -', value: periodLabel },
							]} />
						</div>

						<div className="flex flex-col gap-2">
							{resolvedDates.map((dateStr) => (
								<NoteCardView
									key={dateStr}
									dateStr={dateStr}
									workouts={note.note_workouts ?? []}
									completedIds={completedIds}
									tags={(note.note_tags ?? []).map((t, i) => ({
										id: `tag-${i}`,
										note_id: note.id,
										tag: t.tag,
									}))}
									useCompletedStatus={false} // 알림장 상세에서는 완료 상태 표시 안 함
								/>
							))}
						</div>
					</div>

				</>

			)}
		</div>
	)
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────
export default function NoteWeekList({ notes, filter, onEdit, onNew, onRefresh }: NoteWeekListProps) {

	const filtered = (notes as NoteWithTags[]).filter((note) => {
		if (filter === 'sent') return note.is_sent === true
		if (filter === 'unsent') return !note.is_sent
		return true
	})

	if (filtered.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 py-16">
				<span className="text-neutral-400 text-sm">
					{filter === 'sent' ? '보낸 알림장이 없습니다' :
						filter === 'unsent' ? '안 보낸 알림장이 없습니다' :
							'등록된 알림장이 없습니다'}
				</span>
				<button
					type="button"
					onClick={onNew}
					className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0bb489] text-white text-sm font-medium rounded-full hover:bg-[#09a07a] transition-colors"
				>
					<span className="text-base leading-none">+</span>
					새 알림장 작성
				</button>
			</div>
		)
	}

	return (
		<>
			<div className="flex flex-col">
				{filtered.map((note, idx) => (
					<NoteRow
						key={note.id}
						note={note}
						defaultOpen={idx === 0}
						onEdit={onEdit}
						onRefresh={onRefresh}
					/>
				))}
			</div>

			<div className="flex justify-end px-4 py-4 border-t border-neutral-100">
				<button
					type="button"
					onClick={onNew}
					className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0bb489] text-white text-sm font-medium rounded-full hover:bg-[#09a07a] transition-colors"
				>
					<span className="text-base leading-none">+</span>
					새 알림장 작성
				</button>
			</div>
		</>
	)
}
