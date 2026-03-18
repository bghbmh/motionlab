import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MemberRegisterForm from '@/components/studio/MemberRegisterForm'

export default async function NewMemberPage() {
	const supabase = await createClient()

	const { data: { user } } = await supabase.auth.getUser()
	if (!user) redirect('/login')

	const { data: instructor } = await supabase
		.from('instructors')
		.select('id, studio_id')
		.eq('id', user.id)
		.single()

	if (!instructor) redirect('/login')

	return (
		<div className="max-w-xl mx-auto py-8 px-4">
			<div className="flex items-center gap-3 mb-6">
				<a href="/studio"
					className="text-xs font-mono px-2.5 py-1 rounded-lg transition-all"
					style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}>
					← 뒤로
				</a>
				<h1 className="text-base font-bold text-white">신규 회원 등록</h1>
			</div>

			<MemberRegisterForm
				studioId={instructor.studio_id}
				instructorId={instructor.id}
			/>
		</div>
	)
}