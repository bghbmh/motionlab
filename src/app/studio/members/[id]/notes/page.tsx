'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { InbodyRecord } from '@/types/database'

import NoteSlideModal from '@/components/studio/NoteSlideModal'
import NoteCard, { type NoteWithTags } from '@/components/studio/NoteCard'
import NoteDeleteConfirm from '@/components/studio/NoteDeleteConfirm'
import InbodySidebar from '@/components/studio/InbodySidebar'

interface MemberData {
	id: string
	name: string
	sessions_per_week: number
	inbody_records: InbodyRecord[]
}

export default function NotesListPage() {
	const { id } = useParams<{ id: string }>()

	const [member, setMember] = useState<MemberData | null>(null)
	const [notes, setNotes] = useState<NoteWithTags[]>([])
	const [loading, setLoading] = useState(true)

	const [showModal, setShowModal] = useState(false)
	const [editTarget, setEditTarget] = useState<NoteWithTags | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<NoteWithTags | null>(null)

	const fetchData = useCallback(async () => {
		const supabase = createClient()

		const { data: memberData } = await supabase
			.from('members')
			.select(`
				id, name, sessions_per_week,
				inbody_records (
					id, weight, muscle_mass, body_fat_pct, body_fat_mass, bmi, visceral_fat, measured_at
				)
			`)
			.eq('id', id)
			.single()

		const { data: notesData } = await supabase
			.from('notes')
			.select('*, note_tags(tag)')
			.eq('member_id', id)
			.order('created_at', { ascending: false })

		setMember(memberData as MemberData)
		setNotes((notesData ?? []) as NoteWithTags[])
		setLoading(false)
	}, [id])

	useEffect(() => { fetchData() }, [fetchData])

	async function handleSend(note: NoteWithTags) {
		const supabase = createClient()
		await supabase.from('notes').update({ is_sent: true }).eq('id', note.id)
		fetchData()
	}

	async function handleUnsend(note: NoteWithTags) {
		const supabase = createClient()
		await supabase.from('notes').update({ is_sent: false }).eq('id', note.id)
		fetchData()
	}

	async function handleDelete(note: NoteWithTags) {
		const supabase = createClient()
		await supabase.from('note_tags').delete().eq('note_id', note.id)
		await supabase.from('notes').delete().eq('id', note.id)
		setDeleteTarget(null)
		fetchData()
	}

	const latestInbody = member?.inbody_records
		?.slice()
		.sort((a, b) => b.measured_at.localeCompare(a.measured_at))[0] ?? null

	const sentNotes = notes.filter(n => n.is_sent)
	const draftNotes = notes.filter(n => !n.is_sent)

	if (loading) {
		return (
			<div className="flex items-center justify-center h-40">
				<div className="w-6 h-6 rounded-full border-2 animate-spin"
					style={{ borderColor: 'rgba(61,219,181,0.3)', borderTopColor: 'transparent' }} />
			</div>
		)
	}

	return (
		<div className="flex gap-5">
			<InbodySidebar
				memberName={member?.name}
				latestInbody={latestInbody}
				totalCount={notes.length}
				sentCount={sentNotes.length}
				draftCount={draftNotes.length}
				onAdd={() => { setEditTarget(null); setShowModal(true) }}
			/>

			<div className="flex-1 flex flex-col gap-3 min-w-0">
				<div className="flex justify-between items-center">
					<h2 className="text-base font-bold text-white">알림장 목록</h2>
					<span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
						총 {notes.length}개
					</span>
				</div>

				{notes.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-24">
						<p className="text-4xl mb-3">📋</p>
						<p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
							아직 작성된 알림장이 없습니다.
						</p>
						<p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>
							왼쪽 버튼으로 첫 알림장을 작성해보세요.
						</p>
						<button
							onClick={() => { setEditTarget(null); setShowModal(true) }}
							className="btn-primary text-xs px-5 py-2.5"
						>
							＋ 첫 알림장 작성
						</button>
					</div>
				) : (
					<>
						{sentNotes.length > 0 && (
							<NoteSection label="전송된 알림장" count={sentNotes.length} accent>
								{sentNotes.map(note => (
									<NoteCard key={note.id} note={note}
										onEdit={() => { setEditTarget(note); setShowModal(true) }}
										onDelete={() => setDeleteTarget(note)}
										onSend={() => handleSend(note)}
										onUnsend={() => handleUnsend(note)}
									/>
								))}
							</NoteSection>
						)}

						{draftNotes.length > 0 && (
							<NoteSection label="미전송 알림장" count={draftNotes.length}>
								{draftNotes.map(note => (
									<NoteCard key={note.id} note={note}
										onEdit={() => { setEditTarget(note); setShowModal(true) }}
										onDelete={() => setDeleteTarget(note)}
										onSend={() => handleSend(note)}
										onUnsend={() => handleUnsend(note)}
									/>
								))}
							</NoteSection>
						)}
					</>
				)}
			</div>

			{showModal && (
				<NoteSlideModal
					memberId={id}
					editTarget={editTarget}
					onClose={() => { setShowModal(false); setEditTarget(null) }}
					onSaved={() => { setShowModal(false); setEditTarget(null); fetchData() }}
				/>
			)}

			{deleteTarget && (
				<NoteDeleteConfirm
					note={deleteTarget}
					onCancel={() => setDeleteTarget(null)}
					onConfirm={() => handleDelete(deleteTarget)}
				/>
			)}
		</div>
	)
}

// ─── 섹션 구분선 헬퍼 ────────────────────────────────────────────
function NoteSection({
	label, count, accent = false, children,
}: {
	label: string
	count: number
	accent?: boolean
	children: React.ReactNode
}) {
	return (
		<>
			<div className="flex items-center gap-2 mt-1">
				<span className="text-[11px] font-mono shrink-0"
					style={{ color: accent ? '#3DDBB5' : 'rgba(255,255,255,0.3)' }}>
					{label}
				</span>
				<div className="flex-1 h-px"
					style={{ background: accent ? 'rgba(61,219,181,0.15)' : 'rgba(255,255,255,0.06)' }} />
				<span className="text-[10px] font-mono shrink-0"
					style={{ color: accent ? 'rgba(61,219,181,0.5)' : 'rgba(255,255,255,0.2)' }}>
					{count}개
				</span>
			</div>
			{children}
		</>
	)
}
