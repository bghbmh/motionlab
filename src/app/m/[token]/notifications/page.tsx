// src/app/m/[token]/notifications/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NotificationsClient from '@/app/m/[token]/notifications/NotificationsClient'

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
		<div className="flex flex-col gap-3 px-2 pt-2 pb-8">
			{/* 페이지 헤더 */}
			<div className="flex items-center justify-between px-1 pt-1 pb-1">
				<h1 className="text-[18px] font-bold text-gray-700">알림</h1>
				<span className="text-xs text-gray-400">
					총 {notifications?.length ?? 0}개
				</span>
			</div>

			<NotificationsClient
				memberId={member.id}
				initialNotifications={notifications ?? []}
			/>
		</div>
	)
}
