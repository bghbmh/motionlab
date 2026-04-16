// components/admin/sidebar/Sidebar.tsx

'use client'

import { useState } from 'react'
import type { Member } from '@/types/database'
import type { ActivityLevel } from '@/types/ui'
import MemberListItem from './MemberListItem'

// DB 연결 전 임시 mock — Member 타입과 1:1 대응
// weeklyDays, mets, activityLevel은 DB에 없는 계산값이므로 별도 관리
interface MemberWithStats {
	member: Member
	weeklyDays: number
	mets: number
	activityLevel: ActivityLevel
}

const MOCK_MEMBERS: MemberWithStats[] = [
	{
		member: {
			id: '1', studio_id: 's1', instructor_id: null,
			name: '강영숙', phone: null, birth_date: null,
			sessions_per_week: 3, access_token: 'token-1',
			memo: null, is_active: true,
			registered_at: '2026-01-10', created_at: '2026-01-10T00:00:00Z',
		},
		weeklyDays: 0, mets: 192, activityLevel: 'low',
	},
	{
		member: {
			id: '2', studio_id: 's1', instructor_id: null,
			name: '이지은', phone: null, birth_date: null,
			sessions_per_week: 5, access_token: 'token-2',
			memo: null, is_active: true,
			registered_at: '2026-01-15', created_at: '2026-01-15T00:00:00Z',
		},
		weeklyDays: 2, mets: 19882, activityLevel: 'high',
	},
	{
		member: {
			id: '3', studio_id: 's1', instructor_id: null,
			name: '강도윤', phone: null, birth_date: null,
			sessions_per_week: 3, access_token: 'token-3',
			memo: null, is_active: true,
			registered_at: '2026-02-29', created_at: '2026-02-29T00:00:00Z',
		},
		weeklyDays: 3, mets: 192, activityLevel: 'low',
	},
	{
		member: {
			id: '4', studio_id: 's1', instructor_id: null,
			name: '박민준', phone: null, birth_date: null,
			sessions_per_week: 2, access_token: 'token-4',
			memo: null, is_active: true,
			registered_at: '2026-03-01', created_at: '2026-03-01T00:00:00Z',
		},
		weeklyDays: 1, mets: 450, activityLevel: 'low',
	},
	{
		member: {
			id: '5', studio_id: 's1', instructor_id: null,
			name: '최서연', phone: null, birth_date: null,
			sessions_per_week: 4, access_token: 'token-5',
			memo: null, is_active: true,
			registered_at: '2026-03-05', created_at: '2026-03-05T00:00:00Z',
		},
		weeklyDays: 4, mets: 8200, activityLevel: 'high',
	},
]

interface SidebarProps {
	selectedMemberId?: string
	onSelectMember?: (id: string) => void
}

export default function Sidebar({ selectedMemberId, onSelectMember }: SidebarProps) {
	const [searchQuery, setSearchQuery] = useState('')

	const filteredMembers = MOCK_MEMBERS.filter((m) =>
		m.member.name.includes(searchQuery)
	)

	return (
		<aside className="w-64 h-[calc(100vh-68px)] py-3 bg-white flex flex-col items-center gap-3 overflow-hidden border-r border-neutral-200">
			{/* 검색 */}
			<div className="w-60 relative">
				<div className="absolute left-3 top-1/2 -translate-y-1/2">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<circle cx="7" cy="7" r="5" stroke="#94a3b8" strokeWidth="1.75" />
						<path d="M11 11L14 14" stroke="#94a3b8" strokeWidth="1.75" strokeLinecap="round" />
					</svg>
				</div>
				<input
					type="text"
					placeholder="회원 검색"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full pl-9 pr-3 py-2.5 rounded-lg outline outline-1 outline-gray-400 text-sm text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-neutral-500 focus:outline-offset-[-2px] transition-all"
				/>
			</div>

			{/* 회원 목록 */}
			<div className="w-full px-2.5 flex flex-col gap-1 overflow-y-auto">
				{filteredMembers.map(({ member, weeklyDays, mets, activityLevel }) => (
					<div key={member.id} className="relative">
						<MemberListItem
							member={member}
							weeklyDays={weeklyDays}
							mets={mets}
							activityLevel={activityLevel}
							isSelected={selectedMemberId === member.id}
							onClick={() => onSelectMember?.(member.id)}
						/>
					</div>
				))}
			</div>
		</aside>
	)
}
