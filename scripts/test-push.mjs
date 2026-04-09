// scripts/test-push.mjs
// 이지은 회원에게 테스트 푸시 알림을 보내는 스크립트
// 실행: node scripts/test-push.mjs
// 실행 전: .env.local에 환경변수가 세팅되어 있어야 해

import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ─── .env.local 로드 ──────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')

const env = {}
try {
	const content = readFileSync(envPath, 'utf-8')
	content.split('\n').forEach(line => {
		const [key, ...rest] = line.split('=')
		if (key && rest.length) env[key.trim()] = rest.join('=').trim()
	})
} catch {
	console.error('❌ .env.local 파일을 찾을 수 없어')
	process.exit(1)
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SUPABASE_KEY = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
const VAPID_PUBLIC  = env['NEXT_PUBLIC_VAPID_PUBLIC_KEY']
const VAPID_PRIVATE = env['VAPID_PRIVATE_KEY']
const VAPID_SUBJECT = env['VAPID_SUBJECT']

if (!SUPABASE_URL || !SUPABASE_KEY) {
	console.error('❌ Supabase 환경변수 없음')
	process.exit(1)
}
if (!VAPID_PUBLIC || !VAPID_PRIVATE || !VAPID_SUBJECT) {
	console.error('❌ VAPID 환경변수 없음')
	process.exit(1)
}

// ─── 초기화 ───────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

// ─── 실행 ─────────────────────────────────────────────────────
async function run() {
	console.log('🔍 이지은 회원 조회 중...\n')

	// 1. 회원 조회
	const { data: members, error } = await supabase
		.from('members')
		.select('id, name, access_token, is_active')

	if (error) {
		console.error('❌ DB 오류:', error.message)
		process.exit(1)
	}

	console.log('📋 전체 회원 목록:')
	members.forEach(m => console.log(`  - ${m.name} (active: ${m.is_active})`))

	const jieun = members.find(m => m.name.includes('이지은'))
	if (!jieun) {
		console.error('\n❌ 이지은 회원을 찾을 수 없어')
		process.exit(1)
	}

	console.log(`\n✅ 이지은 찾음`)
	console.log(`  id: ${jieun.id}`)
	console.log(`  access_token: ${jieun.access_token}`)
	console.log(`  is_active: ${jieun.is_active}`)

	// 2. 푸시 구독 확인
	const { data: subs } = await supabase
		.from('push_subscriptions')
		.select('endpoint, p256dh, auth, created_at')
		.eq('member_id', jieun.id)

	console.log('\n🔔 푸시 구독 상태:')
	if (!subs || subs.length === 0) {
		console.log('  ❌ 등록된 구독 없음')
		console.log('  → 이지은 회원이 앱에서 알림 허용을 해야 해')
		console.log(`  → 링크: https://[배포URL]/m/${jieun.access_token}`)
		process.exit(0)
	}

	console.log(`  ✅ 구독 ${subs.length}개 등록됨`)
	subs.forEach((s, i) => {
		const shortEndpoint = s.endpoint.length > 70
			? s.endpoint.slice(0, 70) + '...'
			: s.endpoint
		console.log(`  [${i+1}] ${shortEndpoint}`)
		console.log(`      등록일: ${s.created_at}`)
	})

	// 3. 최근 알림장 확인
	const { data: notes } = await supabase
		.from('notes')
		.select('id, written_at, is_sent, days')
		.eq('member_id', jieun.id)
		.order('written_at', { ascending: false })
		.limit(3)

	console.log('\n📄 최근 알림장:')
	if (!notes || notes.length === 0) {
		console.log('  알림장 없음')
	} else {
		notes.forEach(n => {
			console.log(`  - written_at: ${n.written_at} | is_sent: ${n.is_sent} | days: ${JSON.stringify(n.days)}`)
		})
	}

	// 4. 테스트 푸시 발송
	console.log('\n📤 테스트 알림 발송 중...')

	let succeeded = 0
	let failed = 0

	for (const sub of subs) {
		const subscription = {
			endpoint: sub.endpoint,
			keys: { p256dh: sub.p256dh, auth: sub.auth }
		}
		const payload = JSON.stringify({
			title: 'motion-log',
			body: '🧪 테스트 알림입니다! 잘 도착했나요? 💪',
			url: `/m/${jieun.access_token}/notifications`,
		})

		try {
			await webpush.sendNotification(subscription, payload, { TTL: 60 })
			console.log(`  ✅ 발송 성공 (구독 ${subs.indexOf(sub)+1})`)
			succeeded++
		} catch (err) {
			if (err.statusCode === 410 || err.statusCode === 404) {
				console.log(`  ⚠️  구독 만료됨 (410/404) — 앱에서 다시 알림 허용 필요`)
			} else {
				console.log(`  ❌ 발송 실패: ${err.message}`)
			}
			failed++
		}
	}

	console.log(`\n🎉 결과: 성공 ${succeeded}개 / 실패 ${failed}개`)

	if (succeeded > 0) {
		console.log('\n📱 이지은 핸드폰에서 알림이 왔는지 확인해봐!')
	} else {
		console.log('\n⚠️  모두 실패했어. 구독이 만료됐을 가능성이 높아.')
		console.log('   → 이지은 회원이 앱을 다시 열고 알림 허용을 다시 해줘야 해')
	}
}

run().catch(err => {
	console.error('예상치 못한 오류:', err)
	process.exit(1)
})
