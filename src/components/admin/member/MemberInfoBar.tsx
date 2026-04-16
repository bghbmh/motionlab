// components/admin/member/MemberInfoBar.tsx

import type { Member } from '@/types/database'
import type { ActivityLevel } from '@/types/ui'
import ActivityBadge from '@/components/admin/common/ActivityBadge'
import CopyLinkButton from '@/components/admin/ui/CopyLinkButton'

interface MemberInfoBarProps {
	member: Member
	activityLevel: ActivityLevel
	weeklyVisits: string   // e.g. '주 3일' (클라이언트 계산값)
	memberUrl: string      // 복사할 회원앱 URL — 부모 서버 컴포넌트에서 전달
}

export default function MemberInfoBar({
	member,
	activityLevel,
	weeklyVisits,
	memberUrl,
}: MemberInfoBarProps) {
	return (
		<div className="w-full pl-6 pr-3 py-2 relative bg-neutral-500 rounded-lg flex justify-between items-center">
			{/* 왼쪽 인디케이터 바 */}
			<div className="absolute left-[9px] top-[12px] w-1 h-[calc(100%-24px)] bg-neutral-50 rounded-full" />

			{/* 회원 정보 */}
			<div className="flex items-center flex-col md:flex-row gap-y-0 py-2">
				<div className="flex items-center gap-1">
					<span className="text-neutral-50 text-lg font-medium leading-7">{member.name}</span>
					<ActivityBadge level={activityLevel} />
				</div>
				<div className="flex items-center gap-1.5">
					<div className="size-[3px] bg-neutral-400 rounded-full" />
					<div className="flex items-center gap-1">
						<span className="text-neutral-200 text-xs leading-4">등록일</span>
						<span className="text-neutral-200 text-xs leading-4">{member.registered_at}</span>
					</div>
					<div className="size-[3px] bg-neutral-400 rounded-full" />
					<span className="text-neutral-200 text-xs leading-4">{weeklyVisits}</span>
				</div>
			</div>

			{/* 회원 링크 복사 버튼 */}
			<div className='hidden sm:block'>
				<CopyLinkButton url={memberUrl} title="회원 링크 복사" className='h-full' />
			</div>
			<div className='block sm:hidden  h-10 w-10'>
				<CopyLinkButton url={memberUrl} title="" className='w-full h-full' />
			</div>
		</div>
	)
}
