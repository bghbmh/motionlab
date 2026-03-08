import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemberTabBar from '@/components/member/MemberTabBar'

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
