'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { InbodyRecord } from '@/types/database'

import NoteSlideModal from '@/components/studio/NoteSlideModal'
import NoteCard, { type NoteWithTags } from '@/components/studio/NoteCard'
import NoteDeleteConfirm from '@/components/studio/NoteDeleteConfirm'
import InbodySidebar from '@/components/studio/InbodySidebar'
import MemberNav from '@/components/studio/MemberNav'
import NoteListSection from './NoteListSection'

import { useScrollLock } from '@/hooks/useScrollLock'

interface MemberData {
	id: string
	name: string
	sessions_per_week: number
	inbody_records: InbodyRecord[]
}

interface Props {
	id: string,
	initialMember: MemberData,
	latestInbody: InbodyRecord,
	initialNotes: NoteWithTags[]
}

export default function NotesListClient({ id, initialMember, latestInbody, initialNotes }: Props) {
	// 초기값을 서버에서 받은 데이터로 설정
	const [member, setMember] = useState(initialMember)
	const [notes, setNotes] = useState(initialNotes)

	// 모달 및 삭제 상태
	const [showModal, setShowModal] = useState(false)
	const [editTarget, setEditTarget] = useState<NoteWithTags | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<NoteWithTags | null>(null)

	useScrollLock(showModal || !!deleteTarget);

	// 데이터 갱신 로직 (추가/삭제/수정 후 호출)
	const refreshData = async () => {
		const supabase = createClient()
		const { data } = await supabase.from('notes')
			.select('*, note_tags(tag), note_workouts(id, day, workout_type, intensity, duration_min, mets, sort_order)')
			.eq('member_id', id)
			.order('created_at', { ascending: false });
		setNotes(data ?? [])
	}


	async function handleSend(note: NoteWithTags) {
		const supabase = createClient()
		await supabase.from('notes').update({ is_sent: true }).eq('id', note.id)
		refreshData()
	}

	async function handleUnsend(note: NoteWithTags) {
		const supabase = createClient()
		await supabase.from('notes').update({ is_sent: false }).eq('id', note.id)
		refreshData()
	}

	async function handleDelete(note: NoteWithTags) {
		const supabase = createClient()
		await supabase.from('note_tags').delete().eq('note_id', note.id)
		await supabase.from('notes').delete().eq('id', note.id)
		setDeleteTarget(null)
		refreshData()
	}

	const sentNotes = notes.filter(n => n.is_sent)
	const draftNotes = notes.filter(n => !n.is_sent)

	// if (loading) {
	// 	return (
	// 		<div className="flex items-center justify-center h-40">
	// 			<div className="w-6 h-6 rounded-full border-2 animate-spin"
	// 				style={{ borderColor: 'rgba(61,219,181,0.3)', borderTopColor: 'transparent' }} />
	// 		</div>
	// 	)
	// }

	return (
		<div className="flex gap-5">

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
							<NoteListSection label="전송된 알림장" count={sentNotes.length} accent>
								{sentNotes.map(note => (
									<NoteCard key={note.id} note={note}
										onEdit={() => { setEditTarget(note); setShowModal(true) }}
										onDelete={() => setDeleteTarget(note)}
										onSend={() => handleSend(note)}
										onUnsend={() => handleUnsend(note)}
									/>
								))}
							</NoteListSection>
						)}

						{draftNotes.length > 0 && (
							<NoteListSection label="미전송 알림장" count={draftNotes.length}>
								{draftNotes.map(note => (
									<NoteCard key={note.id} note={note}
										onEdit={() => { setEditTarget(note); setShowModal(true) }}
										onDelete={() => setDeleteTarget(note)}
										onSend={() => handleSend(note)}
										onUnsend={() => handleUnsend(note)}
									/>
								))}
							</NoteListSection>
						)}
					</>
				)}
			</div>

			<InbodySidebar
				memberName={member?.name}
				curInbody={latestInbody}
				totalCount={notes.length}
				sentCount={sentNotes.length}
				draftCount={draftNotes.length}
				onAdd={() => { setEditTarget(null); setShowModal(true) }}
			/>


			{showModal && (
				<NoteSlideModal
					memberId={id}
					editTarget={editTarget}
					onClose={() => { setShowModal(false); setEditTarget(null) }}
					onSaved={() => { setShowModal(false); setEditTarget(null); refreshData() }}
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

