import type { InbodyRecord } from '@/types/database'

interface Props {
	memberName: string | undefined
	latestInbody: InbodyRecord | null
	totalCount: number
	sentCount: number
	draftCount: number
	onAdd: () => void
}

export default function InbodySidebar({
	memberName,
	latestInbody,
	totalCount,
	sentCount,
	draftCount,
	onAdd,
}: Props) {
	return (
		<div style={{ width: 224, flexShrink: 0 }}>
			<div className="ml-card mb-3">
				<p className="ml-card-label">{memberName} · 최근 인바디</p>

				{latestInbody ? (
					<>
						<p className="font-mono text-[10px] mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
							{latestInbody.measured_at}
						</p>
						<div className="flex flex-col gap-1.5 text-xs">
							{([
								['체중', latestInbody.weight ? `${latestInbody.weight}kg` : '—'],
								['근육량', latestInbody.muscle_mass ? `${latestInbody.muscle_mass}kg` : '—'],
								['체지방률', latestInbody.body_fat_pct ? `${latestInbody.body_fat_pct}%` : '—'],
								['체지방량', latestInbody.body_fat_mass ? `${latestInbody.body_fat_mass}kg` : '—'],
								['BMI', latestInbody.bmi ? `${latestInbody.bmi}` : '—'],
								['내장지방', latestInbody.visceral_fat ? `${latestInbody.visceral_fat}` : '—'],
							] as [string, string][]).map(([label, val]) => (
								<div key={label} className="flex justify-between items-center">
									<span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
									<span className="font-mono text-white">{val}</span>
								</div>
							))}
						</div>
					</>
				) : (
					<p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
						인바디 기록이 없습니다.
					</p>
				)}
			</div>

			{/* 통계 요약 */}
			{totalCount > 0 && (
				<div className="mb-3 rounded-xl px-3 py-2.5"
					style={{ background: '#1a2740', border: '1px solid rgba(255,255,255,0.05)' }}>
					<div className="flex justify-between text-xs mb-1">
						<span style={{ color: 'rgba(255,255,255,0.35)' }}>전체</span>
						<span className="font-mono text-white">{totalCount}개</span>
					</div>
					<div className="flex justify-between text-xs mb-1">
						<span style={{ color: 'rgba(61,219,181,0.7)' }}>전송됨</span>
						<span className="font-mono" style={{ color: '#3DDBB5' }}>{sentCount}개</span>
					</div>
					<div className="flex justify-between text-xs">
						<span style={{ color: 'rgba(255,255,255,0.35)' }}>미전송</span>
						<span className="font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{draftCount}개</span>
					</div>
				</div>
			)}

			<button onClick={onAdd} className="btn-primary w-full text-center text-xs py-2.5">
				＋ 알림장 추가
			</button>
		</div>
	)
}
