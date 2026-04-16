'use client'

// components/admin/notes/NoteListSection.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'  // ← 추가
import type { InbodyRecord, Note } from '@/types/database'
import type { NoteWithTags } from './noteWorkoutTypes'
import NoteWeekList from '@/components/admin/notes/NoteWeekList'
import InbodySummary from '@/components/admin/notes/InbodySummary'
import NoteSlideModal from '@/components/admin/notes/NoteSlideModal'

// ─── 탭 정의 ─────────────────────────────────────────────────────
const TABS = [
	{ key: 'all', label: '전체' },
	{ key: 'sent', label: '보낸 알림장' },
	{ key: 'unsent', label: '안 보낸 알림장' },
] as const

type TabKey = (typeof TABS)[number]['key']

// ─── Props ───────────────────────────────────────────────────────
interface NoteListSectionProps {
	memberId: string
	memberName?: string
	notes: Note[]
	latestInbody: InbodyRecord | null
	previousInbody?: InbodyRecord | null
}

export default function NoteListSection({
	memberId,
	memberName,
	notes,
	latestInbody,
	previousInbody,
}: NoteListSectionProps) {

	const router = useRouter()  // ← 추가

	const [activeTab, setActiveTab] = useState<TabKey>('all')
	const [showModal, setShowModal] = useState(false)
	const [editTarget, setEditTarget] = useState<NoteWithTags | null>(null)

	const sentCount = notes.filter(n => n.is_sent).length
	const unsentCount = notes.filter(n => !n.is_sent).length

	function openNew() {
		setEditTarget(null)
		setShowModal(true)
	}

	function openEdit(note: NoteWithTags) {
		setEditTarget(note)
		setShowModal(true)
	}

	function handleSaved() {
		setShowModal(false)
		setEditTarget(null)
		router.refresh()  // ← onRefresh?.() 대신
	}

	return (
		<>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start py-4">

				{/* ── 왼쪽: 탭 + 알림장 목록 ─────────────────────── */}
				<div className="col-span-full  md:col-span-3 min-w-0 flex flex-col bg-white rounded-2xl overflow-hidden border border-neutral-200">

					{/* 탭 바 */}
					<div className="flex items-center gap-1 px-4 border-b border-neutral-200">
						{TABS.map(({ key, label }) => {
							const count = key === 'sent' ? sentCount : key === 'unsent' ? unsentCount : notes.length
							return (
								<button
									key={key}
									type="button"
									onClick={() => setActiveTab(key)}
									className={`h-10 px-2 flex items-center gap-1.5 text-sm font-medium leading-5 border-b-2 -mb-px transition-colors
										${activeTab === key
											? 'border-primary text-primary	'
											: 'border-transparent text-gray-600 hover:text-gray-900'
										}`}
								>
									{label}
									<span className={`text-sm font-bold ${activeTab === key ? 'text-primary' : 'text-gray-400'}`}>
										<span className={` ${key === 'unsent' && count > 0 ? 'text-red-500' : ''}`}>{count}</span>
									</span>
								</button>
							)
						})}
					</div>

					{/* 알림장 목록 */}
					<NoteWeekList
						memberId={memberId}
						notes={notes}
						filter={activeTab}
						onEdit={openEdit}
						onNew={openNew}
						onRefresh={() => router.refresh()}
					/>
				</div>

				{/* ── 오른쪽: 인바디 요약 + 새 알림장 버튼 ────────── */}
				<div className='col-span-1 hidden md:block'>
					<InbodySummary
						memberId={memberId}
						latestInbody={latestInbody}
						previousInbody={previousInbody}
						onNew={openNew}
					/>
				</div>

			</div>

			{/* 알림장 작성/수정 모달 */}
			{showModal && (
				<NoteSlideModal
					memberId={memberId}
					memberName={memberName}
					editTarget={editTarget}
					onClose={() => { setShowModal(false); setEditTarget(null) }}
					onSaved={handleSaved}
				/>
			)}
		</>
	)
}
