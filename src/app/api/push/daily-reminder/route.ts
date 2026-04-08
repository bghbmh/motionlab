// src/app/api/push/daily-reminder/route.ts
// Vercel Cron Job — 매일 KST 08:00 (UTC 23:00) 실행
// 오늘 운동해야 하는 회원에게 푸시 알림 발송
//
// 대상 회원 조건:
//   - 최근 발송된 알림장(is_sent=true)이 있는 회원
//   - 알림장의 days에 오늘 요일이 포함 ('전체' 또는 오늘 요일 약자)
//   - push_subscriptions가 등록된 회원

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/webpush'

// KST 기준 오늘 요일 약자
function getTodayDayLabel(): string {
	const now = new Date()
	const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000)
	return ['일', '월', '화', '수', '목', '금', '토'][kstDate.getUTCDay()]
}

export async function GET(request: NextRequest) {
	// Vercel Cron 인증 — 외부 호출 방지
	const authHeader = request.headers.get('authorization')
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const supabase = await createClient()
		const todayLabel = getTodayDayLabel()

		// 1. 발송된 알림장 전체 조회 (최신순)
		const { data: notes } = await supabase
			.from('notes')
			.select('id, member_id, days')
			.eq('is_sent', true)
			.order('written_at', { ascending: false })

		if (!notes || notes.length === 0) {
			return NextResponse.json({ message: '알림장 없음' })
		}

		// 2. 회원별 최신 알림장만 추출
		const latestNoteByMember = new Map<string, typeof notes[0]>()
		for (const note of notes) {
			if (!latestNoteByMember.has(note.member_id)) {
				latestNoteByMember.set(note.member_id, note)
			}
		}

		// 3. 오늘 요일에 해당하는 회원 필터
		const targetMemberIds: string[] = []
		for (const [memberId, note] of latestNoteByMember) {
			const days: string[] = note.days ?? []
			if (days.includes('전체') || days.includes(todayLabel)) {
				targetMemberIds.push(memberId)
			}
		}

		if (targetMemberIds.length === 0) {
			return NextResponse.json({ message: `오늘(${todayLabel}) 운동 대상 없음` })
		}

		// 4. 대상 회원의 push_subscriptions 조회
		const { data: subscriptions } = await supabase
			.from('push_subscriptions')
			.select('member_id, endpoint, p256dh, auth')
			.in('member_id', targetMemberIds)

		if (!subscriptions || subscriptions.length === 0) {
			return NextResponse.json({ message: '푸시 구독 회원 없음' })
		}

		// 5. 푸시 알림 발송
		const expiredEndpoints: { member_id: string; endpoint: string }[] = []
		let succeeded = 0
		let failed = 0

		await Promise.all(
			subscriptions.map(async sub => {
				const { expired } = await sendPushNotification(
					{ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
					{
						title: 'motion-log',
						body: `오늘 운동하는 날이에요! 알림장을 확인해보세요 💪`,
						url: '/',
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

		// 6. 만료된 구독 삭제
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

		console.log(`[daily-reminder] ${todayLabel}요일 — 발송 ${succeeded}건, 실패 ${failed}건`)

		return NextResponse.json({
			message: '알림 발송 완료',
			day: todayLabel,
			total: subscriptions.length,
			succeeded,
			failed,
		})
	} catch (err) {
		console.error('[daily-reminder]', err)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}
