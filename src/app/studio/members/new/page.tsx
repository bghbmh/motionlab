// app/studio/members/new/page.tsx
// 신규회원 등록 페이지

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemberRegisterForm from '@/components/admin/member/MemberRegisterForm'

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
		<div className=" py-6 ">
			<div className="mb-6">
				<h1 className="text-lg font-bold ">신규회원 등록</h1>
				<p className="text-sm  mt-1">기본 정보와 생활 패턴을 입력해주세요</p>
			</div>
			<MemberRegisterForm
				studioId={instructor.studio_id}
				instructorId={instructor.id}
			/>
		</div>
	)
}
