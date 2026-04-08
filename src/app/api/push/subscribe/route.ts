// src/app/api/push/subscribe/route.ts
// 회원앱에서 푸시 구독 정보를 서버에 저장하는 API

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

		return NextResponse.json({ ok: true })
	} catch (err) {
		console.error('[push/subscribe]', err)
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const { token, endpoint } = await req.json()

		const supabase = await createClient()
		const { data: member } = await supabase
			.from('members')
			.select('id')
			.eq('access_token', token)
			.single()

		if (!member) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}

		await supabase
			.from('push_subscriptions')
			.delete()
			.eq('member_id', member.id)
			.eq('endpoint', endpoint)

		return NextResponse.json({ ok: true })
	} catch {
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
	}
}
