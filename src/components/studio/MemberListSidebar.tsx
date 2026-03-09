'use client'

import { useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getActivityStatus, ACTIVITY_STATUS_LABELS } from '@/types/database'

interface MemberSummary {
	id: string
	name: string
	sessions_per_week: number
	access_token: string
	workout_logs: Array<{ logged_at: string; mets_score: number }>
}

function getWeekStart() {
	const d = new Date()
	const day = d.getDay()
	const diff = d.getDate() - day + (day === 0 ? -6 : 1)
	d.setDate(diff)
	return d.toISOString().split('T')[0]
}

export default function MemberListSidebar({ members }: { members: MemberSummary[] }) {
	const router = useRouter()
	const pathname = usePathname()
	const [search, setSearch] = useState('')

	const weekStart = getWeekStart()

	// 현재 URL에서 선택된 회원 ID 추출 (/studio/members/[id]/...)
	const selectedId = useMemo(() => {
		const match = pathname.match(/\/studio\/members\/([^/]+)/)
		return match ? match[1] : null
	}, [pathname])

	const filtered = useMemo(() => {
		if (!search.trim()) return members
		return members.filter(m => m.name.includes(search.trim()))
	}, [members, search])

	return (
		<aside className="w-64 shrink-0 flex flex-col gap-3 border-r border-white/[0.07] p-4 overflow-hidden">
			{/* 검색 */}
			<input
				className="ml-input"
				placeholder="🔍  회원 검색..."
				value={search}
				onChange={e => setSearch(e.target.value)}
			/>

			{/* 회원 목록 */}
			<div className="flex flex-col gap-2 overflow-y-auto flex-1">
				{filtered.map(m => {
					const weekLogs = (m.workout_logs ?? []).filter(l => l.logged_at >= weekStart)
					const avgMets = weekLogs.length
						? weekLogs.reduce((s, l) => s + l.mets_score, 0) / weekLogs.length
						: 0
					const status = getActivityStatus(avgMets)
					const badgeClass = {
						low: 'badge-low',
						good: 'badge-good',
						high: 'badge-high',
					}[status]
					const isSelected = selectedId === m.id

					return (
						<button
							key={m.id}
							onClick={() => router.push(`/studio/members/${m.id}`)}
							className={`bg-card2 border rounded-xl p-3 text-left transition-all ${isSelected
								? 'border-mint/60'
								: 'border-white/[0.07] hover:border-mint/40'
								}`}
						>
							<div className="flex justify-between items-center">
								<span className="font-semibold text-sm text-white truncate mr-2">{m.name}</span>
								<span className={`text-xs px-2 py-1 rounded-full shrink-0 ${badgeClass}`}>
									{ACTIVITY_STATUS_LABELS[status]}
								</span>
							</div>
							<p className="text-xs text-white/30 font-mono mt-1">
								이번 주 {weekLogs.length}일 · METs {avgMets.toFixed(1)}
							</p>
							<p className="text-xs text-white/20 font-mono mt-0.5">
								주 {m.sessions_per_week}회 수업
							</p>
						</button>
					)
				})}

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
