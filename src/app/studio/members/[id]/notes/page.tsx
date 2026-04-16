// app/studio/members/[id]/notes/page.tsx

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
	getMember,
	getLatestInbodyRecords,
	getNotes,
} from '@/lib/queries/member.queries'

import NoteListSection from '@/components/admin/notes/NoteListSection'

interface PageProps {
	params: Promise<{ id: string }>
}

export default async function NotesListPage({ params }: PageProps) {
	const { id } = await params
	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) redirect('/login')

	const member = await getMember(id)
	if (!member) notFound()


	const [{ latest: latestInbody, previous: previousInbody }, notes] =
		await Promise.all([
			getLatestInbodyRecords(id),
			getNotes(id),
		])

	return (
		<NoteListSection
			memberId={id}
			memberName={member.name}
			notes={notes}
			latestInbody={latestInbody}
			previousInbody={previousInbody}
		/>
	)
}
