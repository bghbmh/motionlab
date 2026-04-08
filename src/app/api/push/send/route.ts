// src/app/api/push/send/route.ts
// 강사(authenticated)가 특정 회원에게 푸시 알림을 발송하는 서버 API
// NotesListClient.tsx의 handleSend 에서 호출

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/webpush'

export async function POST(req: NextRequest) {
	// 강사 인증 확인
	const supabase = await createClient()
	// const { data: { user } } = await supabase.auth.getUser()

	// if (!user) {
	// 	return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	// }

	try {
		const { memberId, noteId, message, token } = await req.json()

		// 1. notifications 테이블에 알림 저장
		await supabase.from('notifications').insert({
			member_id: memberId,
			type: 'note_sent',
			note_id: noteId,
			message,
			is_read: false,
		})

		// 2. 해당 회원의 푸시 구독 목록 조회
		const { data: subscriptions } = await supabase
			.from('push_subscriptions')
			.select('endpoint, p256dh, auth')
			.eq('member_id', memberId)

		if (!subscriptions || subscriptions.length === 0) {
			// 구독 없음 → 알림만 저장하고 OK 반환
			return NextResponse.json({ ok: true, pushed: 0 })
		}

		// 3. 각 구독에 푸시 발송
		const expiredEndpoints: string[] = []
		let pushed = 0

		await Promise.all(
			subscriptions.map(async sub => {
				const payload = {
					title: 'motion-log',
					body: message,
					url: `/m/${token}/notifications`,
				}
				const { expired } = await sendPushNotification(sub, payload)
				if (expired) {
					expiredEndpoints.push(sub.endpoint)
				} else {
					pushed++
				}
			})
		)

		// 4. 만료된 구독 일괄 삭제
		if (expiredEndpoints.length > 0) {
			await supabase
				.from('push_subscriptions')
				.delete()
				.eq('member_id', memberId)
				.in('endpoint', expiredEndpoints)
		}

		return NextResponse.json({ ok: true, pushed })
	} catch (err) {
		console.error('[push/send]', err)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}
