// src/components/member/ui/CoachMemo.tsx
// Figma: 컴포넌트 섹션 > coach_memo

interface Props {
	label: string
	value: number | null
	gap?: string
	unit: string
	status: boolean
	className?: string
}

export function InbodyCardItem({ label, value, gap, unit, status, className = '' }: Props) {
	return (
		<div className={`flex items-center justify-between px-2 py-1 bg-neutral-100 rounded-lg  ${className}`}>
			<span className="text-xs text-neutral-500">{label}</span>
			<div className="flex items-center gap-1.5">
				<span className="text-xs font-semibold text-neutral-800 font-mono whitespace-nowrap">
					{value}{unit ? ` ${unit}` : ''}
				</span>
				{gap && (
					<span className={`text-xs font-semibold whitespace-nowrap ${status ? 'text-[#0bb489]' : 'text-red-500'}`}>
						{gap}{unit ? ` ${unit}` : ''}
					</span>
				)}
			</div>
		</div>
	)
}
