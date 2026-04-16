// components/admin/sidebar/MemberListSidebar.tsx
'use client'

import { useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { calcTotalMets, getActivityStatus } from '@/lib/metsUtils'
import type { Member } from '@/types/database'
import type { ActivityLevel } from '@/types/ui'
import MemberListItem from '@/components/admin/sidebar/MemberListItem'

// workout_logs는 DB join으로 가져오는 추가 필드
interface MemberWithLogs extends Member {
	workout_logs: Array<{
		logged_at: string
		mets_score: number
		duration_min: number
	}>
}

function getWeekStart() {
	const d = new Date()
	const day = d.getDay()
	d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
	return d.toISOString().split('T')[0]
}

// metsUtils의 status → ActivityLevel 변환
function toActivityLevel(status: string): ActivityLevel {
	if (status === 'high') return 'high'
	if (status === 'good') return 'normal'
	return 'low'
}

export default function MemberListSidebar({
	members,
	origin,
	className
}: {
	members: MemberWithLogs[]
	origin: string,
	className?: string
}) {
	const router = useRouter()
	const pathname = usePathname()
	const [search, setSearch] = useState('')

	const weekStart = getWeekStart()

	// 현재 URL에서 선택된 회원 ID 추출 (/studio/members/[id]/...)
	const selectedId = useMemo(() => {
		const match = pathname.match(/\/studio\/members\/([^/]+)/)
		return match ? match[1] : null
	}, [pathname])

	// 이번 주 통계 계산 + ActivityLevel 변환
	const membersWithStats = useMemo(() => {
		return members.map((m) => {
			const weekLogs = (m.workout_logs ?? []).filter(
				(l) => l.logged_at >= weekStart
			)
			const weeklyDays = new Set(weekLogs.map((l) => l.logged_at)).size
			const mets = calcTotalMets(weekLogs)
			const status = getActivityStatus(mets)
			const activityLevel = toActivityLevel(status)

			return { member: m, weeklyDays, mets, activityLevel }
		})
	}, [members, weekStart])

	const filtered = useMemo(() => {
		if (!search.trim()) return membersWithStats
		return membersWithStats.filter((m) =>
			m.member.name.includes(search.trim())
		)
	}, [membersWithStats, search])

	return (
		<aside className={`studio-members h-full ${className || ''}`}  >
			{/* 검색 */}
			<label className="flex px-3">
				<input
					className="m-input text-sm flex-1"
					placeholder="🔍  회원 검색..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</label>

			{/* 회원 목록 */}
			<div className="info-list scrollbar-thin">
				{filtered.map(({ member, weeklyDays, mets, activityLevel }) => (
					<div key={member.id} className="relative">
						<MemberListItem
							member={member}
							weeklyDays={weeklyDays}
							mets={mets}
							activityLevel={activityLevel}
							memberUrl={`${origin}/m/${member.access_token}`}
							isSelected={selectedId === member.id}
							onClick={() => router.push(`/studio/members/${member.id}`)}
						/>
					</div>
				))}

				{filtered.length === 0 && (
					<p className="text-xs text-white/30 text-center mt-8 leading-relaxed">
						{search
							? '검색 결과가 없습니다.'
							: '등록된 회원이 없습니다.\n헤더의 신규회원 추가 버튼을 눌러주세요.'}
					</p>
				)}
			</div>
		</aside>
	)
}
