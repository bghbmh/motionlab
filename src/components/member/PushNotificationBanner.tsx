'use client'

// src/components/member/PushNotificationBanner.tsx
// 홈 화면 상단에 한 번만 표시되는 푸시 알림 허용 유도 배너

import { useState, useEffect } from 'react'
import { usePushNotification } from '@/hooks/usePushNotification'

interface Props {
  token: string
}

const DISMISSED_KEY = 'push_banner_dismissed'

export default function PushNotificationBanner({ token }: Props) {
  const { permission, isSubscribed, isLoading, isSupported, subscribe } =
    usePushNotification({ token })
  const [dismissed, setDismissed] = useState(true)  // 기본 숨김 (hydration 안전)

  useEffect(() => {
    // 클라이언트에서만 localStorage 접근
    const isDismissed = localStorage.getItem(DISMISSED_KEY) === 'true'
    setDismissed(isDismissed)
  }, [])

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
  }

  // 표시 조건: 지원 O, 아직 허용 안 함, 이미 구독 아님, 닫지 않음
  if (
    !isSupported ||
    permission === 'granted' ||
    isSubscribed ||
    dismissed
  ) {
    return null
  }

  return (
    <div
      className="mx-4 mt-3 rounded-2xl p-4 flex items-start gap-3"
      style={{
        background: 'rgba(61,219,181,0.07)',
        border: '1px solid rgba(61,219,181,0.2)',
      }}
    >
      <span className="text-2xl shrink-0">🔔</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">
          강사님 알림장 알림 받기
        </p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
          새 알림장이 도착하면 바로 알려드려요
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={subscribe}
            disabled={isLoading}
            className="btn-primary text-xs py-2 px-4"
            style={{ opacity: isLoading ? 0.6 : 1 }}
          >
            {isLoading ? '설정 중...' : '알림 허용'}
          </button>
          <button
            onClick={handleDismiss}
            className="btn-ghost text-xs py-2 px-3"
          >
            나중에
          </button>
        </div>
      </div>

      <button
        onClick={handleDismiss}
        className="shrink-0 text-white/30 hover:text-white/50 transition-colors"
        style={{ fontSize: 18, lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  )
}
