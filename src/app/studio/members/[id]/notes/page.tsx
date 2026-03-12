

import { createClient } from '@/lib/supabase/server'
import type { InbodyRecord } from '@/types/database'


import MemberNav from '@/components/studio/MemberNav'

import NotesListClient from '@/components/studio/NotesListClient'

// 서버 컴포넌트는 params를 props로 받습니다 (비동기 처리 권장)
interface PageProps {
	params: Promise<{ id: string }>
}
interface MemberData {
	id: string
	name: string
	sessions_per_week: number
	inbody_records: InbodyRecord[]
}
export default async function NotesListPage({ params }: PageProps) {
	// 1. params 추출
	const { id } = await params;
	const supabase = await createClient();

	// 2. 데이터 병렬 페칭 (성능 최적화)
	const [memberRes, notesRes] = await Promise.all([
		supabase
			.from('members')
			.select(`
                id, name, sessions_per_week,
                inbody_records (
                    id, weight, muscle_mass, body_fat_pct, body_fat_mass, bmi, visceral_fat, measured_at
                )
            `)
			.eq('id', id)
			.single(),
		supabase
			.from('notes')
			.select('*, note_tags(tag), note_workouts(id, day, workout_type, intensity, duration_min, mets, sort_order)')
			.eq('member_id', id)
			.order('created_at', { ascending: false })
	]);

	const memberData = memberRes.data as MemberData | null;
	const notesData = notesRes.data ?? [];

	// 데이터가 없는 경우를 위한 가드 로직
	if (!memberData) {
		return (
			<div className="p-10 text-white text-center">
				<p>존재하지 않는 회원입니다.</p>
			</div>
		)
	}


	const latestInbody = memberData?.inbody_records
		?.slice()
		.sort((a, b) => b.measured_at.localeCompare(a.measured_at))[0] ?? null

	return (
		<div>
			<MemberNav memberId={id} />
			<NotesListClient
				id={id}
				initialMember={memberData}
				latestInbody={latestInbody}
				initialNotes={notesData}
			/>
		</div>
	)
}
