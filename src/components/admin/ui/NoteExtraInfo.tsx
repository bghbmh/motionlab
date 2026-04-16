// components/admin/ui/NoteExtraInfo.tsx

'use client'

interface Props {
	className?: string
	children: React.ReactNode
}

export default function NoteExtraInfo({ className = '', children }: Props) {


	return (
		<span className={`text-neutral-600 text-xs leading-5 ${className}`}>
			{children}
		</span>
	)
}
