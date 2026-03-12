'use client'

import { useState } from 'react'

interface Props {
	registeredAt: string
	inbodyDates: string[]
	onBaseDateChange: (date: string) => void
}

export default function WeeklyBaseDatePicker({ registeredAt, inbodyDates, onBaseDateChange }: Props) {
	const [mode, setMode] = useState<'reg' | 'inbody' | 'custom'>('reg')
	const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0])

	const handleModeChange = (newMode: 'reg' | 'inbody' | 'custom', date?: string) => {
		setMode(newMode)
		if (date) onBaseDateChange(date)
	}

	const baseBtnStyle = "px-3 py-1 rounded-md text-[11px] font-medium transition-all border";
	const activeStyle = "bg-[#3DDBB5] text-black border-[#3DDBB5] shadow-[0_0_10px_rgba(61,219,181,0.2)]";
	const inactiveStyle = "bg-white/5 text-white/80 border-white/0 hover:bg-white/10 hover:text-white/60";

	return (
		<div className=" px-3 py-1 flex flex-col sm:flex-row sm:items-center gap-3 bg-white/5 rounded-md mb-3">
			{/* 제목 및 현재 상태 (좌측 고정) ㅅ */}
			<div className="flex min-w-[100px] text-[11px] items-center gap-1 shrink-0">
				<p className="text-[#3DDBB5] font-semibold truncate">
					{mode === 'reg' ? '가입일' : mode === 'inbody' ? '인바디 측정일' : '사용자 지정'}
				</p>
				<p className=" font-bold text-white/50 uppercase tracking-tighter">기준 </p>
			</div>

			{/* 버튼 그룹 (가로 배치) */}
			<div className="flex flex-wrap items-center gap-1.5">
				<button
					onClick={() => handleModeChange('reg', registeredAt)}
					className={`${baseBtnStyle} ${mode === 'reg' ? activeStyle : inactiveStyle}`}
				>
					가입일 ({registeredAt.slice(2)}) {/* 2026-03-02 -> 26-03-02로 축약 */}
				</button>

				{inbodyDates.length > 0 && (
					<button
						onClick={() => handleModeChange('inbody', inbodyDates[0])}
						className={`${baseBtnStyle} ${mode === 'inbody' ? activeStyle : inactiveStyle}`}
					>
						최근 인바디 ({inbodyDates[0].slice(2)})
					</button>
				)}

				{/* 직접 선택 그룹 */}
				<div className={`flex items-center gap-3 pl-2 border-l border-white/10 ml-1`}>
					<button
						onClick={() => handleModeChange('custom', customDate)}
						className={`${baseBtnStyle} ${mode === 'custom' ? activeStyle : inactiveStyle}`}
					>
						직접 선택
					</button>
					<input
						type="date"
						value={customDate}
						disabled={mode !== 'custom'}
						onChange={(e) => {
							setCustomDate(e.target.value)
							onBaseDateChange(e.target.value)
						}}
						className={`bg-transparent text-[11px] text-white outline-none  transition-opacity ${mode === 'custom' ? 'opacity-100' : 'opacity-20 cursor-not-allowed'
							}`}
						style={{ colorScheme: 'dark' }} // 브라우저 달력 아이콘 다크모드 대응
					/>
				</div>
			</div>
		</div>
	)
}