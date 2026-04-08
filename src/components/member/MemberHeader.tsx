// src/components/member/MemberHeader.tsx
// Figma: common-header
// 로고 · 날짜 · 알림 벨

import Link from 'next/link'

interface Props {
	token: string
	today: string        // 포맷된 날짜 문자열 (예: '4월 2일 (목)')
	unreadCount?: number
}

export default function MemberHeader({ token, today, unreadCount = 0 }: Props) {
	return (
		<header className="m-header">

			{/* 로고 */}
			<Link
				href={`/m/${token}`}
				style={{
					fontFamily: "'DM Mono', monospace",
					fontSize: 18,
					fontWeight: 500,
					letterSpacing: '0.8px',
					color: 'var(--color-primary)',
					textDecoration: 'none',
					whiteSpace: 'nowrap',
				}}
			>
				motion-log
			</Link>

			{/* 우측 영역 */}
			<div className="flex items-center gap-[17px]">

				{/* 날짜 */}
				<span style={{ fontSize: 12, color: 'var(--m-azure)', whiteSpace: 'nowrap' }}>
					{today}
				</span>

				{/* 알림 벨 + 미읽음 dot___. inline-grid */}
				<Link
					href={`/m/${token}/notifications`}
					className="relative  place-items-start hidden"
					style={{ textDecoration: 'none', lineHeight: 0 }}
					aria-label="알림"
				>
					{/* 벨 버튼 */}
					<div
						className="col-start-1 row-start-1 flex items-center justify-center"
						style={{
							width: 36,
							height: 36,
							borderRadius: 10,
							backgroundColor: '#fafafa',
						}}
					>
						<BellIcon />
					</div>

					{/* 미읽음 dot */}
					{unreadCount > 0 && (
						<div
							className="col-start-1 row-start-1"
							style={{
								width: 11,
								height: 11,
								borderRadius: '50%',
								backgroundColor: 'var(--color-primary)',
								marginLeft: 25,
								marginTop: 0,
							}}
						/>
					)}
				</Link>
			</div>
		</header>
	)
}

// Figma: ringing-bell-notification 아이콘 (14×14)
function BellIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
			<path
				d="M5.25 12.25H7.25"
				stroke="#434D4A"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M10.25 4.75C10.25 3.68913 9.8286 2.67172 9.07843 1.92157C8.32828 1.17143 7.31087 0.75 6.25 0.75C5.18913 0.75 4.17172 1.17143 3.42157 1.92157C2.67143 2.67172 2.25 3.68913 2.25 4.75V8.25C2.25 8.64782 2.09196 9.0294 1.81066 9.3107C1.52936 9.592 1.14782 9.75 0.75 9.75H11.75C11.3522 9.75 10.9706 9.592 10.6893 9.3107C10.408 9.0294 10.25 8.64782 10.25 8.25V4.75Z"
				stroke="#434D4A"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}
