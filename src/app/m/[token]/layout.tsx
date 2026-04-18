// src/app/m/[token]/layout.tsx

import './member.css'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import MemberHeader from '@/components/member/MemberHeader'
import MemberGnb from '@/components/member/MemberGnb'
import PullToRefresh from '@/components/member/PullToRefresh'
import { unstable_noStore as noStore } from 'next/cache'

const inappDenyScript = `
(function() {
	var ua = navigator.userAgent.toLowerCase();
	var url = location.href;
	var isIOS = /iphone|ipad|ipod/i.test(ua);

	if (/kakaotalk|kakao/i.test(ua)) {
		if (isIOS) {
			location.href = '/inapp?url=' + encodeURIComponent(url);
		} else {
			location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
		}
	} else if (/line/i.test(ua)) {
		location.href = url + (url.indexOf('?') !== -1 ? '&' : '?') + 'openExternalBrowser=1';
	} else if (/inapp|naver|instagram|band|twitter|FB_IAB|FB4A|FBAN|FBIOS/i.test(ua)) {
		if (isIOS) {
			location.href = '/inapp?url=' + encodeURIComponent(url);
		} else {
			location.href = 'intent://' + url.replace(/https?:\/\//i, '') + '#Intent;scheme=https;package=com.android.chrome;end';
		}
	}
})();
`

function formatToday(): string {
	const date = new Date()
	const month = date.getMonth() + 1
	const day = date.getDate()
	const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
	return `${month}월 ${day}일 (${weekday})`
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ token: string }>
}): Promise<Metadata> {
	const { token } = await params
	const supabase = await createClient()

	const { data: member } = await supabase
		.from('members')
		.select('name')
		.eq('access_token', token)
		.single()

	const name = member?.name || '회원'
	return {
		title: `${name}님 | motion-log`,
		description: `${name}의 데이터 기반 운동 루틴 매니지먼트`,
		openGraph: {
			title: `${name}님의 운동 리포트`,
			description: '모션로그와 함께 해봐요!!',
			images: [
				{
					url: 'https://motionlab-three.vercel.app/og-image.png',
					width: 1200,
					height: 630,
					alt: 'motion-log',
				}
			],
		},
		manifest: `/m/${token}/manifest.webmanifest`,
		appleWebApp: {
			capable: true,
			title: 'motion-log',
			statusBarStyle: 'default',
		},
		icons: {
			apple: '/icons/icon-192x192.png',
		},
	}
}

export async function generateViewport() {
	return { themeColor: '#f8faf8' }
}

export default async function MemberLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ token: string }>
}) {
	noStore()

	const { token } = await params
	const supabase = await createClient()

	const { data: member } = await supabase
		.from('members')
		.select('id, name')
		.eq('access_token', token)
		.eq('is_active', true)
		.single()

	if (!member) redirect('/not-found')

	const headersList = await headers()
	const userAgent = headersList.get('user-agent') ?? null

	const { data: { user } } = await supabase.auth.getUser()
	const isInstructor = !!user

	if (!isInstructor) {
		supabase
			.from('app_sessions')
			.insert({
				member_id: member.id,
				user_agent: userAgent,
			})
			.then()
	}

	const { count: unreadCount } = await supabase
		.from('notifications')
		.select('id', { count: 'exact', head: true })
		.eq('member_id', member.id)
		.eq('is_read', false)

	const today = formatToday()

	return (
		<div className="m-layout pb-5">
			<script dangerouslySetInnerHTML={{ __html: inappDenyScript }} />

			<MemberHeader
				token={token}
				today={today}
				unreadCount={unreadCount ?? 0}
			/>

			<main className="m-content">
				<PullToRefresh>
					{children}
				</PullToRefresh>
			</main>

			<MemberGnb token={token} />
		</div>
	)
}
