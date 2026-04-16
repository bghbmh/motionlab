// app/studio/members/[id]/inbody/page.tsx

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMember, getInbodyRecords } from '@/lib/queries/member.queries'
import InbodySection from '@/components/admin/inbody/InbodySection'

interface PageProps {
	params: Promise<{ id: string }>
}

export default async function InbodyPage({ params }: PageProps) {
	const { id } = await params
	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) redirect('/login')

	const member = await getMember(id)
	if (!member) notFound()

	const records = await getInbodyRecords(id)

	return (
		<InbodySection
			memberId={id}
			records={records}
		/>
	)
}
