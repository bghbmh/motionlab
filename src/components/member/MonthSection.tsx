// src/components/member/MonthSection.tsx

interface MonthSectionProps {
	year: number
	month: number
	totalDays: number
	children: React.ReactNode
}

export function MonthSection({ year, month, totalDays, children }: MonthSectionProps) {
	return (
		<section>
			{/* "2026년 4월 ——— 1일" */}
			<div className="flex items-center gap-3 px-1 py-4">
				<span className="text-xs font-semibold text-neutral-700 whitespace-nowrap">
					{year}년 {month}월
				</span>
				<div className="flex-1 h-px bg-[#e2e8f0]" />
				<span className="m-sublabel whitespace-nowrap">
					{totalDays}일
				</span>
			</div>

			{children}
		</section>
	)
}
