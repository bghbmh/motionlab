// src/lib/webpush.ts
// 서버 전용 Web Push 발송 유틸
// web-push 패키지 필요: npm install web-push
// 타입: npm install -D @types/web-push

import webpush from 'web-push'

// VAPID 설정 (환경변수로 관리)
// .env.local에 아래 3개 추가:
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
//   VAPID_PRIVATE_KEY=...
//   VAPID_SUBJECT=mailto:your@email.com
webpush.setVapidDetails(
	process.env.VAPID_SUBJECT!,
	process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
	process.env.VAPID_PRIVATE_KEY!
)

export interface PushSubscriptionData {
	endpoint: string
	p256dh: string
	auth: string
}

export interface PushPayload {
	title: string
	body: string
	url: string
}

/**
 * 단일 구독에 푸시 알림 발송
 * 구독이 만료된 경우 (410) true를 반환 → DB에서 삭제 처리
 */
export async function sendPushNotification(
	subscription: PushSubscriptionData,
	payload: PushPayload
): Promise<{ expired: boolean }> {
	const pushSubscription = {
		endpoint: subscription.endpoint,
		keys: {
			p256dh: subscription.p256dh,
			auth: subscription.auth,
		},
	}

	try {
		await webpush.sendNotification(
			pushSubscription,
			JSON.stringify(payload),
			{ TTL: 86400 }  // 24시간 TTL
		)
		return { expired: false }
	} catch (err: any) {
		// 410 Gone = 구독 만료, 404 = 엔드포인트 없음 → DB에서 삭제 필요
		if (err.statusCode === 410 || err.statusCode === 404) {
			return { expired: true }
		}
		console.error('[webpush] 발송 오류:', err.message)
		return { expired: false }
	}
}
