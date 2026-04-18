// src/app/m/[token]/layout.tsx

import './member.css'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import MemberHeader from '@/components/member/MemberHeader'
import MemberGnb from '@/components/member/MemberGnb'
import PullToRefresh from '@/components/member/PullToRefresh'
import { unstable_noStore as noStore } from 'next/cache'

const inappDenyScript = `
(function() {
	var ua = navigator.userAgent.toLowerCase();
	var url = location.href;
	var isIOS = ua.match(/iphone|ipad|ipod/i);

	function showSafariGuide() {
		var copied = false;
		try {
			var t = document.createElement('textarea');
			document.body.appendChild(t);
			t.value = url;
			t.select();
			document.execCommand('copy');
			document.body.removeChild(t);
			copied = true;
		} catch(e) {}

		document.open();
		document.write(
			'<!DOCTYPE html><html><head>' +
			'<meta charset="UTF-8">' +
			'<meta name="viewport" content="width=device-width,initial-scale=1">' +
			'<style>' +
			'*{box-sizing:border-box;margin:0;padding:0;}' +
			'body{font-family:-apple-system,sans-serif;background:#f8faf8;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}' +
			'.card{background:#fff;border-radius:20px;padding:40px 28px;text-align:center;max-width:360px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.08);}' +
			'.emoji{font-size:56px;margin-bottom:20px;}' +
			'.title{font-size:18px;font-weight:700;color:#1a1a1a;margin-bottom:12px;line-height:1.4;}' +
			'.desc{font-size:14px;color:#666;line-height:1.7;margin-bottom:28px;}' +
			'.btn{display:block;width:100%;background:#0bb489;color:#fff;border:none;border-radius:12px;padding:16px;font-size:16px;font-weight:600;cursor:pointer;margin-bottom:12px;}' +
			'.url-box{background:#f1f5f9;border-radius:10px;padding:12px 16px;font-size:12px;color:#64748b;word-break:break-all;text-align:left;}' +
			'.step{background:#f8faf8;border-radius:12px;padding:16px;margin-top:20px;text-align:left;}' +
			'.step-title{font-size:13px;font-weight:600;color:#444;margin-bottom:8px;}' +
			'.step-item{font-size:13px;color:#666;line-height:1.8;padding-left:4px;}' +
			'</style>' +
			'</head><body>' +
			'<div class="card">' +
			'<div class="emoji">🌐</div>' +
			'<p class="title">Safari에서 열어주세요</p>' +
			'<p class="desc">카카오톡 내부 브라우저에서는<br>일부 기능이 제한될 수 있어요.</p>' +
			'<button class="btn" onclick="location.href=\'x-web-search://?\'">' +
			'Safari로 열기' +
			'</button>' +
			'<div class="url-box">' + url + '</div>' +
			'<div class="step">' +
			'<p class="step-title">📋 Safari에서 여는 방법</p>' +
			'<p class="step-item">1. 위 버튼을 탭해 Safari를 열어요</p>' +
			'<p class="step-item">2. 주소창을 길게 터치해요</p>' +
			'<p class="step-item">3. "붙여넣기 및 이동"을 탭해요</p>' +
			'</div>' +
			'</div>' +
			'</body></html>'
		);
		document.close();
	}

	// 카카오톡 (iOS/Android 모두)
	if (ua.match(/kakaotalk|kakao/i)) {
		if (isIOS) {
			showSafariGuide();
		} else {
			location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
		}

	// 라인
	} else if (ua.match(/line/i)) {
		location.href = url + (url.indexOf('?') !== -1 ? '&' : '?') + 'openExternalBrowser=1';

	// 그외 인앱
	} else if (ua.match(/inapp|naver|instagram|band|twitter|FB_IAB|FB4A|FBAN|FBIOS/i)) {
		if (isIOS) {
			showSafariGuide();
		} else {
			location.href = 'intent://' + url.replace(/https?:\/\//i, '') + '#Intent;scheme=https;package=com.android.chrome;end';
		}
	}
})();
`

function formatToday(): string {
	const date = new Date()
	const month = date.getMonth() + 1
	const day = date.getDate()
	const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
	return `${month}월 ${day}일 (${weekday})`
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ token: string }>
}): Promise<Metadata> {
	const { token } = await params
	const supabase = await createClient()

	const { data: member } = await supabase
		.from('members')
		.select('name')
		.eq('access_token', token)
		.single()

	const name = member?.name || '회원'
	return {
		title: `${name}님 | motion-log`,
		description: `${name}의 데이터 기반 운동 루틴 매니지먼트`,
		openGraph: {
			title: `${name}님의 운동 리포트`,
			description: '운동 기록과 일상생활활동을 확인하세요.',
		},
		manifest: `/m/${token}/manifest.webmanifest`,
		appleWebApp: {
			capable: true,
			title: 'motion-log',
			statusBarStyle: 'default',
		},
		icons: {
			apple: '/icons/icon-192x192.png',
		},
	}
}

export async function generateViewport() {
	return { themeColor: '#f8faf8' }
}

export default async function MemberLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ token: string }>
}) {
	noStore()

	const { token } = await params
	const supabase = await createClient()

	const { data: member } = await supabase
		.from('members')
		.select('id, name')
		.eq('access_token', token)
		.eq('is_active', true)
		.single()

	if (!member) redirect('/not-found')

	const headersList = await headers()
	const userAgent = headersList.get('user-agent') ?? null

	const { data: { user } } = await supabase.auth.getUser()
	const isInstructor = !!user

	if (!isInstructor) {
		supabase
			.from('app_sessions')
			.insert({
				member_id: member.id,
				user_agent: userAgent,
			})
			.then()
	}

	const { count: unreadCount } = await supabase
		.from('notifications')
		.select('id', { count: 'exact', head: true })
		.eq('member_id', member.id)
		.eq('is_read', false)

	const today = formatToday()

	return (
		<div className="m-layout pb-5">
			<script dangerouslySetInnerHTML={{ __html: inappDenyScript }} />

			<MemberHeader
				token={token}
				today={today}
				unreadCount={unreadCount ?? 0}
			/>

			<main className="m-content">
				<PullToRefresh>
					{children}
				</PullToRefresh>
			</main>

			<MemberGnb token={token} />
		</div>
	)
}
