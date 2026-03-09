'use client'

import { useRouter } from 'next/navigation'

interface Props {
	title: string
	backLabel?: string
}

export default function BackHeader({ title, backLabel = '← 뒤로' }: Props) {
	const router = useRouter()
	return (
		<div className="flex items-center gap-3 px-4 py-3
                    bg-card border-b border-white/[0.07]">
			<button
				onClick={() => router.back()}
				className="btn-ghost text-xs py-1.5 px-3"
			>
				{backLabel}
			</button>
			<span className="text-sm font-semibold text-white">{title}</span>
		</div>
	)
}
