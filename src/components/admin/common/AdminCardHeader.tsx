// components/admin/common/AdminCardHeader.tsx
import Link from 'next/link'

interface AdminCardHeaderProps {
	title: string,
	caption?: string
	actionLabel?: string
	moreLinkUrl?: string  // actionLabel이 있을 때 필수
}

export default function AdminCardHeader({ title, caption = '', actionLabel, moreLinkUrl = '#' }: AdminCardHeaderProps) {
	return (
		<div className="px-3 flex justify-between items-center">
			<div className="flex gap-1.5 items-center">
				<span className="text-neutral-600 text-xs font-bold leading-4">{title}</span>
				{caption && <span className="text-neutral-500 text-xs font-medium ">{caption}</span>}
			</div>

			{actionLabel && (
				<Link
					href={moreLinkUrl}
					className="flex items-center gap-1 p-1 rounded-sm hover:bg-gray-50 transition-colors"
				>
					<span className="text-gray-700 text-xs leading-4">{actionLabel}</span>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M6 4l4 4-4 4" stroke="#374151" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</Link>
			)}
		</div>
	)
}
