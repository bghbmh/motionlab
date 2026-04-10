// src/app/api/push/daily-reminder/route.ts
// Vercel Cron Job — 매일 KST 08:00 (UTC 23:00) 실행
// 오늘 운동해야 하는 회원에게 개인화된 푸시 알림 발송
//
// 메시지 형식:
//   "{이름}님, 오늘은 {운동1}, {운동2}을(를) 해보는 날이에요 💪"
//
// 대상 회원 조건:
//   - 최근 발송된 알림장(is_sent=true)이 있는 회원
//   - 알림장의 days에 오늘 요일이 포함 ('전체' 또는 오늘 요일 약자)
//   - push_subscriptions가 등록된 회원

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/webpush'
import { WORKOUT_TYPE_LABELS } from '@/types/database'
import type { WorkoutType } from '@/types/database'

// KST 기준 오늘 요일 약자
function getTodayDayLabel(): string {
	const now = new Date()
	const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000)
	return ['일', '월', '화', '수', '목', '금', '토'][kstDate.getUTCDay()]
}

// 을/를 조사 처리
function getParticle(text: string): string {
	const lastChar = text[text.length - 1]
	const code = lastChar.charCodeAt(0)
	// 한글 받침 여부 확인
	if (code >= 0xAC00 && code <= 0xD7A3) {
		return (code - 0xAC00) % 28 > 0 ? '을' : '를'
	}
	return '을(를)'
}

// 운동 목록 → 한국어 레이블 나열 문자열
// ex) ['pilates', 'cardio'] → "필라테스, 유산소"
function formatWorkoutList(workoutTypes: string[]): string {
	return workoutTypes
		.map(t => WORKOUT_TYPE_LABELS[t as WorkoutType] ?? t)
		.join(', ')
}

export async function GET(request: NextRequest) {
	// Vercel Cron 인증
	const authHeader = request.headers.get('authorization')
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const supabase = await createClient()
		const todayLabel = getTodayDayLabel()

		// 1. 발송된 알림장 전체 조회 (최신순) + note_workouts join
		const { data: notes } = await supabase
			.from('notes')
			.select(`
				id,
				member_id,
				days,
				note_workouts (
					day,
					workout_type
				)
			`)
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

		// 3. 오늘 요일에 해당하는 회원 + 오늘 운동 목록 추출
		const targetMembers: { memberId: string; workoutTypes: string[] }[] = []

		for (const [memberId, note] of latestNoteByMember) {
			const days: string[] = note.days ?? []
			const isToday = days.includes('전체') || days.includes(todayLabel)
			if (!isToday) continue

			// 오늘 요일('전체' 또는 todayLabel)에 해당하는 운동 추출
			const todayWorkouts = (note.note_workouts ?? [])
				.filter((w: any) =>
					w.day === '전체' || w.day === todayLabel
				)
				.map((w: any) => w.workout_type as string)

			// 중복 제거
			const uniqueWorkouts = [...new Set(todayWorkouts)]

			targetMembers.push({ memberId, workoutTypes: uniqueWorkouts })
		}

		if (targetMembers.length === 0) {
			return NextResponse.json({ message: `오늘(${todayLabel}) 운동 대상 없음` })
		}

		// 4. 대상 회원의 이름 조회
		const targetMemberIds = targetMembers.map(m => m.memberId)
		const { data: members } = await supabase
			.from('members')
			.select('id, name, access_token')
			.in('id', targetMemberIds)

		const memberMap = new Map(
			(members ?? []).map(m => [m.id, m])
		)

		// 5. 대상 회원의 push_subscriptions 조회
		const { data: subscriptions } = await supabase
			.from('push_subscriptions')
			.select('member_id, endpoint, p256dh, auth')
			.in('member_id', targetMemberIds)

		if (!subscriptions || subscriptions.length === 0) {
			return NextResponse.json({ message: '푸시 구독 회원 없음' })
		}

		// member_id → subscriptions 매핑
		const subsByMember = new Map<string, typeof subscriptions>()
		for (const sub of subscriptions) {
			const list = subsByMember.get(sub.member_id) ?? []
			list.push(sub)
			subsByMember.set(sub.member_id, list)
		}

		// 6. 개인화 메시지로 푸시 알림 발송
		const expiredEndpoints: { member_id: string; endpoint: string }[] = []
		let succeeded = 0
		let failed = 0

		await Promise.all(
			targetMembers.map(async ({ memberId, workoutTypes }) => {
				const member = memberMap.get(memberId)
				const subs = subsByMember.get(memberId)
				if (!member || !subs || subs.length === 0) return

				// 메시지 생성
				// ex) "김민희님, 오늘은 필라테스, 유산소를 해보는 날이에요 💪"
				let body: string
				if (workoutTypes.length === 0) {
					body = `${member.name}님, 오늘 알림장을 확인해보세요 💪`
				} else {
					const workoutText = formatWorkoutList(workoutTypes)
					const particle = getParticle(workoutText)
					body = `${member.name}님, 오늘은 ${workoutText}${particle} 해보는 날이에요 💪`
				}

				await Promise.all(
					subs.map(async sub => {
						const { expired } = await sendPushNotification(
							{ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
							{
								title: 'motion-log',
								body,
								url: member.access_token
									? `/m/${member.access_token}`
									: '/',
							}
						)
						if (expired) {
							expiredEndpoints.push({ member_id: memberId, endpoint: sub.endpoint })
							failed++
						} else {
							succeeded++
						}
					})
				)
			})
		)

		// 7. 만료된 구독 삭제
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
