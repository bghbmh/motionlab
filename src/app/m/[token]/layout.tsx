import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import MemberTabBar from '@/components/member/MemberTabBar'

// 1. 동적 메타데이터 생성 함수 추가 (Next.js 15)
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

	// 도메인 주소 (배포 환경에 맞게 설정 필요)
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'
	const ogImageUrl = `${baseUrl}/api/og?name=${encodeURIComponent(name)}`

	return {
		title: `${name}님 | motion-log`,
		description: `${name}의 데이터 기반 운동 루틴 매니지먼트`,
		openGraph: {
			title: `${name}님의 운동 리포트`,
			description: '인바디와 운동 기록을 확인하세요.',
		}
	}
}

// images: [
// 				{
// 					url: ogImageUrl,
// 					width: 1200,
// 					height: 630,
// 					alt: `${name}님의 운동 리포트`,
// 				},
// 			],

export async function generateViewport() {
	return {
		themeColor: '#0d1421',
	}
}

export default async function MemberLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ token: string }>   // ← Next.js 15: Promise 타입
}) {
	const { token } = await params       // ← await 필수

	const supabase = await createClient()

	const { data: member } = await supabase
		.from('members')
		.select('id, name')
		.eq('access_token', token)
		.eq('is_active', true)
		.single()

	if (!member) redirect('/not-found')

	const today = new Date().toLocaleDateString('ko-KR', {
		month: 'long', day: 'numeric', weekday: 'short',
	})

	return (
		<div className="min-h-screen bg-navy flex flex-col max-w-md mx-auto">
			<div className="bg-card border-b border-white/[0.07] px-5 py-3
                      flex justify-between items-center">
				<span className="font-mono text-sm text-mint tracking-wider">motion-log</span>
				<span className="font-mono text-xs text-white/30">{today}</span>
			</div>

			<main className="flex-1 overflow-y-auto pb-20">
				{children}
			</main>

			<MemberTabBar token={token} />
		</div>
	)
}
