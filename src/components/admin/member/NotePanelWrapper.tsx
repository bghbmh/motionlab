'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Note, NoteWorkoutCompletion } from '@/types/database'
import NotePanel from '@/components/admin/weekly/NotePanel'
import NoteSlideModal from '@/components/admin/notes/NoteSlideModal'

interface Props {
	memberId: string
	memberName?: string
	note: Note | null
	completions: NoteWorkoutCompletion[]
	moreLinkUrl?: string
	hasUnsentNote?: boolean
}

export default function NotePanelWrapper({
	memberId,
	memberName,
	note,
	completions,
	moreLinkUrl,
	hasUnsentNote = false
}: Props) {
	const router = useRouter()
	const [showModal, setShowModal] = useState(false)

	return (
		<>
			<NotePanel
				memberId={memberId}
				note={note}
				completions={completions}
				moreLinkUrl={moreLinkUrl}
				onNew={() => setShowModal(true)}
				hasUnsentNote={hasUnsentNote}
			/>

			{showModal && (
				<NoteSlideModal
					memberId={memberId}
					memberName={memberName}
					editTarget={null}
					onClose={() => setShowModal(false)}
					onSaved={() => {
						setShowModal(false)
						router.refresh()
					}}
				/>
			)}
		</>
	)
}