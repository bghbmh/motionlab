

// ─── 섹션 구분선 헬퍼 ────────────────────────────────────────────
export default function NoteListSection({
	label, count, accent = false, children,
}: {
	label: string
	count: number
	accent?: boolean
	children: React.ReactNode
}) {
	return (
		<>
			<div className="flex items-center gap-2 mt-1">
				<span className="text-[11px] font-mono shrink-0"
					style={{ color: accent ? '#3DDBB5' : 'rgba(255,255,255,0.3)' }}>
					{label}
				</span>
				<div className="flex-1 h-px"
					style={{ background: accent ? 'rgba(61,219,181,0.15)' : 'rgba(255,255,255,0.06)' }} />
				<span className="text-[10px] font-mono shrink-0"
					style={{ color: accent ? 'rgba(61,219,181,0.5)' : 'rgba(255,255,255,0.2)' }}>
					{count}개
				</span>
			</div>
			{children}
		</>
	)
}