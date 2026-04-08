'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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
  initialNotifications,
}: Props) {
  const [notifications, setNotifications] = useState(initialNotifications)

  // 마운트 시 모든 알림 읽음 처리
  useEffect(() => {
    const unreadIds = notifications
      .filter(n => !n.is_read)
      .map(n => n.id)

    if (unreadIds.length === 0) return

    const supabase = createClient()
    supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)
      .then(() => {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true }))
        )
      })
  }, [])

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 gap-4">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl"
          style={{
            background: 'rgba(61,219,181,0.07)',
            border: '1px solid rgba(61,219,181,0.15)',
          }}
        >
          🔔
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-sm">알림이 없습니다</p>
          <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            강사님이 알림장을 보내면<br />여기에 표시됩니다
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {notifications.map(n => (
        <div
          key={n.id}
          className="ml-card flex items-start gap-3"
          style={{
            borderColor: n.is_read
              ? 'rgba(255,255,255,0.07)'
              : 'rgba(61,219,181,0.3)',
            background: n.is_read ? '#141e2e' : 'rgba(61,219,181,0.04)',
          }}
        >
          {/* 아이콘 */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{
              background: n.is_read
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(61,219,181,0.1)',
            }}
          >
            📋
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm leading-relaxed"
              style={{ color: n.is_read ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.85)' }}
            >
              {n.message}
            </p>
            <p className="text-xs mt-1 font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {formatRelativeTime(n.created_at)}
            </p>
          </div>

          {/* 읽지 않음 표시 */}
          {!n.is_read && (
            <div
              className="w-2 h-2 rounded-full shrink-0 mt-1.5"
              style={{ background: '#3DDBB5' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
