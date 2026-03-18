import { createClient } from '@/lib/supabase/server'
import MemberNoteCard from '@/components/member/NoteCard'

export default async function NotesPage({
	params,
}: {
	params: Promise<{ token: string }>
}) {
	const { token } = await params
	const supabase = await createClient()

	const { data: member } = await supabase
		.from('members')
		.select('id')
		.eq('access_token', token)
		.single()

	if (!member) return null

	const { data: notes } = await supabase
		.from('notes')
		.select(`
      id, written_at, intensity, content, recommended_mets, days,
      note_tags ( tag ),
      note_workouts ( id, day, workout_type, intensity, duration_min, mets, sort_order )
    `)
		.eq('member_id', member.id)
		.eq('is_sent', true)
		.order('written_at', { ascending: false })

	return (
		<div className="p-4 flex flex-col gap-4">
			<h2 className="text-base font-bold text-white pt-1">알림장</h2>

			{notes && notes.length > 0 ? (
				notes.map((note, idx) => (
					<MemberNoteCard
						key={note.id}
						note={note as any}
						token={token}
						defaultExpanded={idx === 0}
					/>
				))
			) : (
				<div className="text-center py-20 flex flex-col items-center gap-3">
					<p className="text-3xl">📋</p>
					<p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
						아직 받은 알림장이 없습니다.
					</p>
				</div>
			)}
		</div>
	)
}