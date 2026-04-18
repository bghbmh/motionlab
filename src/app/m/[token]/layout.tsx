// src/app/m/[token]/layout.tsx
//
// [수정 내용]
//   - app_sessions에 user_agent 컬럼 추가 저장
//   - 접속 기기(iOS/Android/기타) 파악 가능
//   - 카카오톡 등 인앱 브라우저에서 외부 브라우저로 강제 전환

import './member.css'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Script from 'next/script'
import MemberHeader from '@/components/member/MemberHeader'
import MemberGnb from '@/components/member/MemberGnb'
import PullToRefresh from '@/components/member/PullToRefresh'
import { unstable_noStore as noStore } from 'next/cache'

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

	// user-agent 읽기 (서버 컴포넌트에서 request headers 직접 접근)
	const headersList = await headers()
	const userAgent = headersList.get('user-agent') ?? null

	// 관리자/강사 여부 확인
	const { data: { user } } = await supabase.auth.getUser()
	const isInstructor = !!user  // 로그인된 사용자 = 강사

	// 앱 실행 로그 — fire and forget
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

			{/* 인앱 브라우저 외부 전환 스크립트 */}
			<Script id="inapp-deny" strategy="beforeInteractive">{`
				(function() {
					function copyToClipboard(val) {
						var t = document.createElement("textarea");
						document.body.appendChild(t);
						t.value = val;
						t.select();
						document.execCommand('copy');
						document.body.removeChild(t);
					}

					function openSafariGuide() {
						copyToClipboard(window.location.href);
						alert('URL이 복사되었습니다.\\n\\nSafari가 열리면 주소창을 길게 터치한 뒤,\\n"붙여넣기 및 이동"을 눌러주세요.');
						location.href = 'x-web-search://?';
					}

					var ua = navigator.userAgent.toLowerCase();
					var url = location.href;

					if (ua.match(/kakaotalk/i)) {
						// 카카오톡 → 외부 브라우저로 바로 전환
						location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);

					} else if (ua.match(/line/i)) {
						// 라인 → openExternalBrowser 파라미터 추가
						location.href = url + (url.indexOf('?') !== -1 ? '&' : '?') + 'openExternalBrowser=1';

					} else if (ua.match(/inapp|naver|instagram|band|twitter|FB_IAB|FB4A|FBAN|FBIOS/i)) {
						if (ua.match(/iphone|ipad|ipod/i)) {
							// iOS 인앱 → 사파리 안내 화면
							document.addEventListener('DOMContentLoaded', function() {
								document.body.innerHTML = [
									'<div style="font-family:-apple-system,sans-serif;padding:40px 24px;text-align:center;">',
									'<p style="font-size:18px;font-weight:700;margin-bottom:8px;">외부 브라우저에서 열어주세요</p>',
									'<p style="font-size:14px;color:#666;line-height:1.6;margin-bottom:32px;">',
									'아래 버튼을 눌러 Safari를 실행하세요.<br>',
									'Safari 주소창을 길게 터치 후<br>"붙여넣기 및 이동"을 눌러주세요.',
									'</p>',
									'<button onclick="(function(){',
									'var t=document.createElement(\'textarea\');document.body.appendChild(t);',
									't.value=window.location.href;t.select();document.execCommand(\'copy\');',
									'document.body.removeChild(t);',
									'alert(\'URL이 복사되었습니다.\\nSafari 주소창에 붙여넣기 해주세요.\');',
									'location.href=\'x-web-search://?\';',
									'})()" style="background:#0bb489;color:#fff;border:none;border-radius:12px;padding:14px 32px;font-size:16px;font-weight:600;">',
									'Safari로 열기',
									'</button>',
									'</div>',
								].join('');
							});
						} else {
							// 안드로이드 인앱 → 크롬으로 강제 전환
							location.href = 'intent://' + url.replace(/https?:\\/\\//i, '') + '#Intent;scheme=https;package=com.android.chrome;end';
						}
					}
				})();
			`}</Script>

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
