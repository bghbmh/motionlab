import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NotificationsClient from '@/components/member/NotificationsClient'

export default async function NotificationsPage({
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

	if (!member) redirect('/not-found')

	const { data: notifications } = await supabase
		.from('notifications')
		.select('*')
		.eq('member_id', member.id)
		.order('created_at', { ascending: false })
		.limit(50)

	return (
		<div className="p-4 flex flex-col gap-3">
			<div className="flex items-center gap-3 pt-1">
				<Link href={`/m/${token}`} className="btn-ghost text-xs py-1.5 px-3">
					← 뒤로
				</Link>
				<h2 className="text-base font-bold text-white">알림</h2>
			</div>

			<NotificationsClient
				memberId={member.id}
				initialNotifications={notifications ?? []}
			/>
		</div>
	)
}
