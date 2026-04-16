// components/admin/member/MemberTabNav.tsx
// useState 제거 → Link 기반 + usePathname으로 activeTab 자동 감지

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type TabKey = 'home' | 'weekly' | 'notes' | 'inbody' | 'personaldata'

const TABS: { key: TabKey; label: string }[] = [
	{ key: 'home', label: '회원 홈' },
	{ key: 'weekly', label: '주간 홈트' },
	{ key: 'notes', label: '알림장' },
	{ key: 'inbody', label: '인바디 기록' },
	{ key: 'personaldata', label: '회원정보보기' },
]

function getTabHref(memberId: string, key: TabKey): string {
	if (key === 'home') return `/studio/members/${memberId}`
	if (key === 'weekly') return `/studio/members/${memberId}/weekly`
	if (key === 'notes') return `/studio/members/${memberId}/notes`
	if (key === 'inbody') return `/studio/members/${memberId}/inbody`
	if (key === 'personaldata') return `/studio/members/${memberId}/personaldata`
	return `/studio/members/${memberId}?tab=${key}`
}

// pathname으로 현재 탭 판별
function getActiveTab(pathname: string): TabKey {
	if (pathname.endsWith('/weekly')) return 'weekly'
	if (pathname.endsWith('/notes')) return 'notes'
	if (pathname.endsWith('/inbody')) return 'inbody'
	if (pathname.endsWith('/personaldata')) return 'personaldata'
	return 'home'
}

interface MemberTabNavProps {
	memberId: string
}

export default function MemberTabNav({ memberId }: MemberTabNavProps) {
	const pathname = usePathname()
	const activeTab = getActiveTab(pathname)

	return (
		<div className="px-5 sm:px-8 flex items-center gap-2">
			{TABS.map(({ key, label }) => {
				const isActive = activeTab === key
				const href = getTabHref(memberId, key)

				return (
					<Link
						key={key}
						href={href}
						className={`h-9 px-2 flex items-center gap-1.5 whitespace-nowrap text-sm font-medium leading-5 transition-colors border-b-2
							${isActive
								? 'border-primary text-primary'
								: 'border-transparent text-gray-700 hover:text-gray-900'
							}`}
					>
						{label}
					</Link>
				)
			})}
		</div>
	)
}

