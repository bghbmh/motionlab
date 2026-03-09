'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
	token: string
}

const TABS = [
	{ label: '홈', icon: '🏠', path: '' },
	{ label: '기록', icon: '✏️', path: '/record' },
	{ label: '알림장', icon: '📋', path: '/notes' },
	{ label: '추천영상', icon: '▶️', path: '/videos' },
]

export default function MemberTabBar({ token }: Props) {
	const pathname = usePathname()

	return (
		<nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto
                    bg-card border-t border-white/[0.07] flex">
			{TABS.map(tab => {
				const href = `/m/${token}${tab.path}`
				const isActive = tab.path === ''
					? pathname === `/m/${token}`
					: pathname.startsWith(href)

				return (
					<Link
						key={tab.label}
						href={href}
						className="flex-1 flex flex-col items-center gap-1 py-2.5"
					>
						<span className="text-lg">{tab.icon}</span>
						<span className={`text-[10px] font-medium
              ${isActive ? 'text-mint' : 'text-white/30'}`}>
							{tab.label}
						</span>
					</Link>
				)
			})}
		</nav>
	)
}
