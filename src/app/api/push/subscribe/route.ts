// src/app/api/push/subscribe/route.ts
// 회원앱에서 푸시 구독 정보를 서버에 저장하는 API

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/webpush'

export async function POST(req: NextRequest) {
	try {
		const { token, subscription } = await req.json()

		// token으로 회원 확인
		const supabase = await createClient()
		const { data: member } = await supabase
			.from('members')
			.select('id')
			.eq('access_token', token)
			.eq('is_active', true)
			.single()

		if (!member) {
			return NextResponse.json({ error: 'Member not found' }, { status: 404 })
		}

		// 구독 정보 저장 (중복 시 업데이트)
		const { error } = await supabase
			.from('push_subscriptions')
			.upsert(
				{
					member_id: member.id,
					endpoint: subscription.endpoint,
					p256dh: subscription.keys.p256dh,
					auth: subscription.keys.auth,
				},
				{ onConflict: 'member_id,endpoint' }
			)

		if (error) {
			console.error('[push/subscribe]', error)
			return NextResponse.json({ error: 'DB error' }, { status: 500 })
		}

		// 구독 완료 즉시 웰컴 알림 발송
		await sendPushNotification(
			{
				endpoint: subscription.endpoint,
				p256dh: subscription.keys.p256dh,
				auth: subscription.keys.auth,
			},
			{
				title: 'motion-log',
				body: '모션로그와 함께해요! 알림장이 도착하면 바로 알려드릴게요 🎉',
				url: `/m/${token}`,
			}
		)

		return NextResponse.json({ ok: true })
	} catch (err) {
		console.error('[push/subscribe]', err)
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const { token, endpoint, deleteAll } = await req.json()

		const supabase = await createClient()
		const { data: member } = await supabase
			.from('members')
			.select('id')
			.eq('access_token', token)
			.single()

		if (!member) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}

		if (deleteAll) {
			// 앱 초기화 — member_id 기준 전체 삭제
			await supabase
				.from('push_subscriptions')
				.delete()
				.eq('member_id', member.id)
		} else {
			// 알림 해제 — endpoint 기준 단건 삭제
			await supabase
				.from('push_subscriptions')
				.delete()
				.eq('member_id', member.id)
				.eq('endpoint', endpoint)
		}

		return NextResponse.json({ ok: true })
	} catch {
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
	}
}
