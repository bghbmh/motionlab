'use client'
// src/components/member/NotificationsClient.tsx
// 알림 목록 페이지 — 회원앱 라이트모드 스타일

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Notification {
	id: string
	member_id: string
	type: string
	note_id: string | null
	message: string
	is_read: boolean
	created_at: string
}

interface Props {
	memberId: string
	token: string  // ← 추가
	initialNotifications: Notification[]
}

function formatRelativeTime(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime()
	const m = Math.floor(diff / 60000)
	const h = Math.floor(m / 60)
	const d = Math.floor(h / 24)
	if (d > 0) return `${d}일 전`
	if (h > 0) return `${h}시간 전`
	if (m > 0) return `${m}분 전`
	return '방금'
}

export default function NotificationsClient({
	memberId,
	token,
	initialNotifications,
}: Props) {

	const router = useRouter()
	const [notifications, setNotifications] = useState(initialNotifications)


	// 마운트 시 모든 알림 읽음 처리
	useEffect(() => {
		const unreadIds = notifications
			.filter(n => !n.is_read)
			.map(n => n.id)

		if (unreadIds.length === 0) return

		fetch('/api/notifications/read-all', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ memberId }),
		}).then(async (res) => {
			const data = await res.json()
			console.log('[읽음처리] API 응답:', res.status, data)
			if (res.ok) {
				setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
				// 딜레이 줘서 DB 반영 후 refresh
				setTimeout(() => router.refresh(), 300)
			}
		})
	}, [])

	console.log('[읽음처리 2 notifications:', notifications)

	function handleNotificationClick(n: Notification) {
		if (n.type === 'app_install') {
			router.push(`/m/${token}?install=true`)
		} else if (n.type === 'note_sent' && n.note_id) {
			router.push(`/m/${token}/notes`)
		}
	}

	if (notifications.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center pt-20 gap-4">
				<div
					className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl"
					style={{
						background: 'var(--color-primary-50)',
						border: '1px solid rgba(11,180,137,0.15)',
					}}
				>
					🔔
				</div>
				<div className="text-center">
					<p className="text-sm font-semibold text-gray-800">알림이 없습니다</p>
					<p className="text-xs mt-1.5 leading-relaxed text-gray-400">
						강사님이 알림장을 보내면<br />여기에 표시됩니다
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-2 px-1">
			{notifications.map(n => (
				<div
					key={n.id}
					onClick={() => handleNotificationClick(n)}
					className="bg-white rounded-[16px] flex items-start gap-3 px-4 py-4"
					style={{
						border: n.is_read
							? '1px solid #f0f0f0'
							: '1px solid rgba(11,180,137,0.3)',
						background: n.is_read ? '#ffffff' : 'rgba(11,180,137,0.04)',
					}}
				>
					{/* 아이콘 */}
					<div
						className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
						style={{
							background: n.is_read
								? '#f5f5f5'
								: 'var(--color-primary-50)',
						}}
					>
						📋
					</div>

					{/* 내용 */}
					<div className="flex-1 min-w-0">
						<p
							className="text-sm leading-relaxed"
							style={{
								color: n.is_read ? '#525252' : '#1d211c',
								fontWeight: n.is_read ? 400 : 500,
							}}
						>
							{n.message}
						</p>
						<p className="text-xs mt-1 font-mono text-gray-400">
							{formatRelativeTime(n.created_at)}
						</p>
					</div>

					{/* 읽지 않음 dot */}
					{!n.is_read && (
						<div
							className="w-2 h-2 rounded-full shrink-0 mt-1.5"
							style={{ background: 'var(--color-primary)' }}
						/>
					)}
				</div>
			))}
		</div>
	)
}
