'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
	memberId: string
}

export default function MemberNav({ memberId }: Props) {
	const pathname = usePathname()

	const tabs = [
		{ label: '대시보드', href: `/studio/members/${memberId}` },
		{ label: '알림장', href: `/studio/members/${memberId}/notes` },
		{ label: '인바디 기록', href: `/studio/members/${memberId}/inbody/new` },
	]

	return (
		<nav className="flex gap-1 mb-5">
			{tabs.map(tab => {
				const isActive = tab.href === `/studio/members/${memberId}`
					? pathname === tab.href
					: pathname.startsWith(tab.href)

				return (
					<Link
						key={tab.href}
						href={tab.href}
						className="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
						style={{
							color: isActive ? '#3DDBB5' : 'rgba(255,255,255,0.4)',
							background: isActive ? 'rgba(61,219,181,0.1)' : 'transparent',
							border: isActive ? '1px solid rgba(61,219,181,0.2)' : '1px solid transparent',
						}}
					>
						{tab.label}
					</Link>
				)
			})}
		</nav>
	)
}
