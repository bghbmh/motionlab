// components/admin/sidebar/MemberListItem.tsx

import { useSidebar } from '@/contexts/SidebarContext'
import type { Member } from '@/types/database'
import type { ActivityLevel } from '@/types/ui'
import ActivityBadge from '@/components/admin/common/ActivityBadge'
import CopyLinkButton from '@/components/admin/ui/CopyLinkButton'

interface MemberListItemProps {
	member: Member
	weeklyDays: number
	mets: number
	activityLevel: ActivityLevel
	memberUrl: string        // 복사할 회원앱 URL — 부모에서 조합해서 전달
	isSelected?: boolean
	onClick?: () => void
}

export default function MemberListItem({
	member,
	weeklyDays,
	mets,
	activityLevel,
	memberUrl,
	isSelected = false,
	onClick,
}: MemberListItemProps) {

	const { closeSidebar } = useSidebar()

	const handleClick = () => {
		onClick?.()
		closeSidebar()  // xl 미만일 때만 닫힘
	}

	return (
		// button 안에 button 중첩을 피하기 위해 div + onClick 사용
		<div
			role="button"
			tabIndex={0}
			onClick={handleClick}
			onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
			className={`w-full text-left px-4 py-3 rounded-lg flex flex-col items-start gap-0.5 transition-all cursor-pointer border border-neutral-300
				${isSelected
					? 'pl-6 bg-gray-50 border-2 border-neutral-500'
					: 'bg-gray-50'
				}`}
		>
			{/* 선택된 항목 왼쪽 인디케이터 */}
			{isSelected && (
				<div className="absolute left-[10px] w-[5px] h-5 bg-neutral-500 rounded-full" />
			)}

			{/* 이름 + 링크 복사 버튼 */}
			<div className="w-full flex justify-between items-center pb-1">
				<span className="text-gray-700 text-base font-medium leading-6">{member.name}</span>
				<div onClick={(e) => e.stopPropagation()}>
					<CopyLinkButton url={memberUrl} />
				</div>
			</div>

			{/* 이번 주 운동일 + METs */}
			<div className="flex items-center gap-1.5">
				<span className="text-gray-500 text-xs font-medium leading-4">이번 주 {weeklyDays}일</span>
				<div className="size-[3px] bg-gray-300 rounded-full" />
				<span className="text-gray-500 text-xs font-medium leading-4">{mets.toLocaleString()} METs</span>
			</div>

			{/* 수업 횟수 + 활동 뱃지 */}
			<div className="w-full flex justify-between items-center">
				<span className="text-gray-500 text-xs font-medium leading-4">주 {member.sessions_per_week}회 수업</span>
				<ActivityBadge level={activityLevel} />
			</div>
		</div>
	)
}
