// components/admin/member/WorkoutRecordItem.tsx

import type { RecordType } from '@/types/ui'
import { RECORD_TYPE_CONFIG } from '@/types/ui'
import MemberMemo from '../ui/MemberMemo'
import { Dot, Slash } from 'lucide-react'

interface WorkoutRecordItemProps {
	type: RecordType
	name: string
	intensity: string         // INTENSITY_LABELS 통해 변환된 한글값
	duration: string          // '20분'
	originalDuration?: string // 원래 처방 시간 (수정된 경우) '40분'
	mets: number
	memo?: string             // 회원 메시지 (condition_memo)
	tags?: string[]           // 루틴 태그 (note_tags)
}

export default function WorkoutRecordItem({
	type,
	name,
	intensity,
	duration,
	originalDuration,
	mets,
	memo,
	tags,
}: WorkoutRecordItemProps) {
	const { label, subLabel, labelColor, icon } = RECORD_TYPE_CONFIG[type]

	return (
		<div className="self-stretch min-h-14 px-2 py-1 bg-white rounded-2xl flex flex-col justify-center gap-1 overflow-hidden">
			<div className="flex justify-between items-center gap-2">
				{/* 타입 뱃지 + 운동명 + 세부정보 */}
				<div className="flex items-center gap-1.5 flex-1 flex-wrap">
					{/* 타입 뱃지 */}
					<div className="flex items-center gap-0">
						{icon}
						<span className={`text-xs font-medium leading-5 pl-1  ${labelColor}`}>{label}</span>
						{subLabel && <>
							<Dot size={10} className='text-gray-800' />
							<span className="text-xs text-gray-500 leading-5">{subLabel}</span>
						</>}
					</div>

					{/* 운동명 */}
					<span className="text-gray-800 text-xs font-medium leading-4">{name}</span>

					{/* 세부 정보 */}
					<div className="flex items-center gap-1.5">
						<div className="size-[3px] bg-gray-300 rounded-full" />
						<span className="text-neutral-600 text-xs leading-5">{intensity}</span>
						<div className="size-0.5 bg-gray-300 rounded-full" />
						{/* 시간: 처방 시간과 실제 시간이 다를 경우 취소선 표시 */}
						{originalDuration ? (
							<div className="flex items-center gap-1.5">
								<span className="text-neutral-400 text-xs line-through leading-4">{originalDuration}</span>
								<div className="flex items-center gap-1">
									<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
										<rect x="2" y="2" width="8" height="8" rx="1" stroke="#737373" strokeWidth="1" />
									</svg>
									<span className="text-neutral-600 text-xs leading-4">{duration}</span>
								</div>
							</div>
						) : (
							<span className="text-neutral-600 text-xs leading-4">{duration}</span>
						)}
					</div>
				</div>

				{/* METs */}
				<div className="flex items-center gap-0.5 shrink-0">
					<span className="text-[#0bb489] text-sm font-semibold leading-5">{mets}</span>
					<span className="text-neutral-600 text-xs leading-4">METs</span>
				</div>
			</div>

			{/* 회원 메모 */}
			{memo && <MemberMemo memo={memo} />}

			{/* 루틴 태그 */}
			{tags && tags.length > 0 && (
				<div className="flex items-center gap-0.5 flex-wrap">
					{tags.map((tag) => (
						<span
							key={tag}
							className="px-2 py-[5px] rounded-3xl outline outline-1 outline-gray-300 text-neutral-600 text-xs leading-3"
						>
							{tag}
						</span>
					))}
				</div>
			)}
		</div>
	)
}
