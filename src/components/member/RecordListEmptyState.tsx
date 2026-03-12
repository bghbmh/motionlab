'use client'

// ─── 빈 상태 ─────────────────────────────────────────────────────
export default function RecordListEmptyState({ onAdd }: { onAdd: () => void }) {


	return (
		<>
			<div className="flex flex-col items-center justify-center pt-20 px-8 gap-5">
				<div
					className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl"
					style={{
						background: 'rgba(61,219,181,0.07)',
						border: '1px solid rgba(61,219,181,0.15)',
					}}
				>
					📋
				</div>
				<div className="text-center">
					<p className="text-white font-semibold text-sm">아직 기록된 운동이 없어요</p>
					<p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
						오른쪽 아래 버튼을 눌러<br />첫 번째 운동을 기록해보세요!
					</p>
				</div>
				<button
					onClick={onAdd}
					className="btn-primary px-6 py-3 text-sm"
				>
					첫 기록 추가하기 ✏️
				</button>
			</div>
		</>

	)
}