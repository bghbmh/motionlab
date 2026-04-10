// src/app/api/push/morning-brand/route.ts
// Vercel Cron Job — 매일 KST 08:00 (UTC 23:00) 실행
// 전체 회원에게 요일별 브랜딩 메시지 발송
// 알림장/운동 처방 여부 관계없이 push_subscriptions 등록된 모든 회원 대상

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/webpush'

// KST 기준 오늘 요일 인덱스 (0=일 ~ 6=토)
function getTodayDayIndex(): number {
	const now = new Date()
	const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000)
	return kstDate.getUTCDay()
}

// 요일별 브랜딩 메시지
const BRAND_MESSAGES: Record<number, string> = {
	0: 'motion-log가 함께할게요 🌿', // 일
	1: '새로운 한 주가 시작됐어요. motion-log와 함께 활기차게 출발해봐요 🌱',
	2: '어제 잘 시작했죠? 오늘도 몸을 움직여볼까요 🔥',
	3: '한 주의 중간, 지금이 딱 좋은 타이밍이에요 💪',
	4: '주말이 코앞이에요. 오늘 한 번만 더 해봐요 ⚡',
	5: '이번 주 마무리를 멋지게 해봐요. 오늘도 응원해요 🎯',
	6: '여유로운 토요일, 가볍게 몸 풀어보는 건 어때요 😊',
}

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get('authorization')
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const supabase = await createClient()
		const dayIndex = getTodayDayIndex()
		const message = BRAND_MESSAGES[dayIndex]

		// push_subscriptions 있는 모든 회원 조회
		// member의 access_token도 함께 조회 (알림 클릭 시 홈으로 이동)
		const { data: subscriptions } = await supabase
			.from('push_subscriptions')
			.select('member_id, endpoint, p256dh, auth, members(access_token)')

		if (!subscriptions || subscriptions.length === 0) {
			return NextResponse.json({ message: '구독 회원 없음' })
		}

		const expiredEndpoints: { member_id: string; endpoint: string }[] = []
		let succeeded = 0
		let failed = 0

		await Promise.all(
			subscriptions.map(async sub => {
				const token = (sub.members as any)?.access_token ?? null

				const { expired } = await sendPushNotification(
					{ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
					{
						title: 'motion-log',
						body: message,
						url: token ? `/m/${token}` : '/',
					}
				)

				if (expired) {
					expiredEndpoints.push({ member_id: sub.member_id, endpoint: sub.endpoint })
					failed++
				} else {
					succeeded++
				}
			})
		)

		// 만료된 구독 삭제
		if (expiredEndpoints.length > 0) {
			await Promise.all(
				expiredEndpoints.map(({ member_id, endpoint }) =>
					supabase
						.from('push_subscriptions')
						.delete()
						.eq('member_id', member_id)
						.eq('endpoint', endpoint)
				)
			)
		}

		const DAY_KR = ['일', '월', '화', '수', '목', '금', '토']
		console.log(`[morning-brand] ${DAY_KR[dayIndex]}요일 — 발송 ${succeeded}건, 실패 ${failed}건`)

		return NextResponse.json({
			message: '브랜딩 알림 발송 완료',
			day: DAY_KR[dayIndex],
			total: subscriptions.length,
			succeeded,
			failed,
		})
	} catch (err) {
		console.error('[morning-brand]', err)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}
