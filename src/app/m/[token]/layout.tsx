// src/app/m/[token]/layout.tsx
// PullToRefresh 포함 버전 (BottomSheet data-no-pull로 모달 충돌 해결)
import './member.css'                      // ← 회원앱 전용 라이트모드 CSS

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import MemberHeader from '@/components/member/MemberHeader'
import MemberGnb from '@/components/member/MemberGnb'
import PullToRefresh from '@/components/member/PullToRefresh'

import { unstable_noStore as noStore } from 'next/cache'

// ─── 날짜 포맷 ─────────────────────────────────────────────────
function formatToday(): string {
	const date = new Date()
	const month = date.getMonth() + 1
	const day = date.getDate()
	const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
	return `${month}월 ${day}일 (${weekday})`
}

// ─── Metadata ──────────────────────────────────────────────────
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
			description: '운동 기록과 일상생활활동을 확인하세요.',
		},
		// ← 토큰별 동적 manifest 링크 추가
		manifest: `/m/${token}/manifest.webmanifest`,
		// ← iOS Safari는 manifest를 무시하므로 별도 설정 필요
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

// themeColor — 라이트모드에 맞게 변경
export async function generateViewport() {
	return { themeColor: '#f8faf8' }
}

// ─── 레이아웃 ──────────────────────────────────────────────────
export default async function MemberLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ token: string }>
}) {

	noStore()  // ← 추가

	const { token } = await params
	const supabase = await createClient()

	// 회원 인증 — is_active 체크 포함
	const { data: member } = await supabase
		.from('members')
		.select('id, name')
		.eq('access_token', token)
		.eq('is_active', true)
		.single()

	if (!member) redirect('/not-found')

	// 읽지 않은 알림 개수
	const { count: unreadCount } = await supabase
		.from('notifications')
		.select('id', { count: 'exact', head: true })
		.eq('member_id', member.id)
		.eq('is_read', false)

	const today = formatToday();

	console.log("unreadCount - ", unreadCount)

	return (
		<div className="m-layout pb-5">

			{/* 공통 헤더 */}
			<MemberHeader
				token={token}
				today={today}
				unreadCount={unreadCount ?? 0}
			/>

			{/* 페이지 콘텐츠 — PullToRefresh로 감싸서 당겨서 새로고침 지원 */}
			<main className="m-content">
				<PullToRefresh>
					{children}
				</PullToRefresh>
			</main>

			{/* 하단 탭바 */}
			<MemberGnb token={token} />

		</div>
	)
}
