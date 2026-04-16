// app/studio/layout.tsx
import './studio.css'

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudioHeader from '@/components/admin/layout/StudioHeader'
import StudioShell from '@/components/admin/layout/StudioShell'
import MemberListSidebarContainer from '@/components/admin/sidebar/MemberListSidebarContainer'
import SidebarLoading from '@/components/studio/SidebarLoading'

export default async function StudioLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) redirect('/login')

	const { data: instructor } = await supabase
		.from('instructors')
		.select('*, studios(name)')
		.eq('id', user.id)
		.single()

	if (!instructor) redirect('/login')


	return (
		<StudioShell
			header={<StudioHeader instructor={instructor} />}
			sidebar={
				<Suspense fallback={<SidebarLoading />}>
					<MemberListSidebarContainer studioId={instructor.studio_id} />
				</Suspense>
			}
		>
			{children}
		</StudioShell>
	)
}
