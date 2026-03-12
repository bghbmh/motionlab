'use client'

import { useState } from 'react'

interface Props {
	registeredAt: string
	inbodyDates: string[]
	initialWeekStartDate?: string    // ← DB 저장값
	onBaseDateChange: (date: string) => void
}

type Mode = 'reg' | 'inbody' | 'custom'

function resolveInitialMode(
	initialDate: string | undefined,
	registeredAt: string,
	inbodyDates: string[],
): { mode: Mode; customDate: string } {
	if (!initialDate) {
		return { mode: 'reg', customDate: new Date().toISOString().split('T')[0] }
	}
	if (initialDate === registeredAt) {
		return { mode: 'reg', customDate: new Date().toISOString().split('T')[0] }
	}
	if (inbodyDates.length > 0 && initialDate === inbodyDates[0]) {
		return { mode: 'inbody', customDate: initialDate }
	}
	// 위 두 경우에 해당 안 되면 직접 지정된 날짜
	return { mode: 'custom', customDate: initialDate }
}

export default function WeeklyBaseDatePicker({
	registeredAt,
	inbodyDates,
	initialWeekStartDate,
	onBaseDateChange,
}: Props) {
	const initial = resolveInitialMode(initialWeekStartDate, registeredAt, inbodyDates)
	const [mode, setMode] = useState<Mode>(initial.mode)
	const [customDate, setCustomDate] = useState(initial.customDate)

	const handleModeChange = (newMode: Mode, date?: string) => {
		setMode(newMode)
		if (date) onBaseDateChange(date)
	}

	const baseBtnStyle = 'px-3 py-1 rounded-md text-[11px] font-medium transition-all border'
	const activeStyle = 'bg-[#3DDBB5] text-black border-[#3DDBB5] shadow-[0_0_10px_rgba(61,219,181,0.2)]'
	const inactiveStyle = 'bg-white/5 text-white/80 border-white/0 hover:bg-white/10 hover:text-white/60'

	return (
		<div className="px-3 py-1 flex flex-col sm:flex-row sm:items-center gap-3 bg-white/5 rounded-md mb-3">
			{/* 현재 모드 표시 */}
			<div className="flex min-w-[100px] text-[11px] items-center gap-1 shrink-0">
				<p className="text-[#3DDBB5] font-semibold truncate">
					{mode === 'reg' ? '가입일' : mode === 'inbody' ? '인바디 측정일' : '사용자 지정'}
				</p>
				<p className="font-bold text-white/50 uppercase tracking-tighter">기준</p>
			</div>

			<div className="flex flex-wrap items-center gap-1.5">
				{/* 가입일 버튼 */}
				<button
					onClick={() => handleModeChange('reg', registeredAt)}
					className={`${baseBtnStyle} ${mode === 'reg' ? activeStyle : inactiveStyle}`}
				>
					가입일 ({registeredAt.slice(2)})
				</button>

				{/* 최근 인바디 버튼 — 날짜가 있을 때만 */}
				{inbodyDates.length > 0 && (
					<button
						onClick={() => handleModeChange('inbody', inbodyDates[0])}
						className={`${baseBtnStyle} ${mode === 'inbody' ? activeStyle : inactiveStyle}`}
					>
						최근 인바디 ({inbodyDates[0].slice(2)})
					</button>
				)}

				{/* 직접 선택 */}
				<div className="flex items-center gap-2 pl-2 border-l border-white/10 ml-1">
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
						className={`bg-transparent text-[11px] text-white outline-none transition-opacity ${mode === 'custom' ? 'opacity-100' : 'opacity-20 cursor-not-allowed'
							}`}
						style={{ colorScheme: 'dark' }}
					/>
				</div>
			</div>
		</div>
	)
}