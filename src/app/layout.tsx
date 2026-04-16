// src/app/layout.tsx
//
// [수정 내용]
//   - 스플래시를 React 트리가 아닌 <head> 인라인 스크립트로 처리
//   - 스크립트가 DOM에 스플래시 div를 직접 생성/제거
//   - Hydration 불일치 없음 — React는 스플래시 div를 모름

import type { Viewport, Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const viewport: Viewport = {
	themeColor: '#0d1421',
	width: 'device-width',
	initialScale: 1,
}

export const metadata: Metadata = {
	title: 'motion-log studio',
	description: '데이터 기반 온-오프라인 연동 운동 루틴 매니지먼트',
	manifest: '/manifest.json',
}

// ─── 스플래시 생성 + 제거 스크립트 ───────────────────────────
// 1. /m/ 경로에서만 스플래시 div를 body에 직접 삽입
// 2. DOMContentLoaded 시 페이드아웃 후 제거
// React 트리와 완전히 분리되므로 Hydration 에러 없음
const splashScript = `(function(){
  if(!window.location.pathname.startsWith('/m/')) return;

  var style = document.createElement('style');
  style.textContent = [
    '@keyframes ml-draw{to{stroke-dashoffset:0}}',
    '@keyframes ml-bar{0%{width:0%;margin-left:0%}50%{width:60%;margin-left:20%}100%{width:0%;margin-left:100%}}',
    '#ml-splash .sp{stroke-dasharray:1;stroke-dashoffset:1;animation:ml-draw 1.0s cubic-bezier(0.4,0,0.2,1) forwards}',
    '#ml-splash .p1{animation-delay:0s}',
    '#ml-splash .p2{animation-delay:0.18s}',
    '#ml-splash .p3{animation-delay:0.26s}',
    '#ml-splash .p4{animation-delay:0.34s}',
    '#ml-splash .p5{animation-delay:0.42s}',
    '#ml-splash .p6{animation-delay:0.50s}',
    '#ml-splash .p7{animation-delay:0.58s}',
    '#ml-splash .p8{animation-delay:0.66s}',
    '#ml-splash .p9{animation-delay:0.74s}',
    '#ml-splash .p10{animation-delay:0.82s}',
    '#ml-splash .p11{animation-delay:0.90s}',
    '#ml-splash .p12{animation-delay:0.98s}',
    '#ml-splash .p13{animation-delay:1.06s}',
    '#ml-splash .p14{animation-delay:1.14s}',
  ].join('');
  document.head.appendChild(style);

  var el = document.createElement('div');
  el.id = 'ml-splash';
  el.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#f8faf8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:32px';
  el.innerHTML = [
    '<div style="width:96px;height:92px">',
    '<svg viewBox="0 0 129 124" fill="none" xmlns="http://www.w3.org/2000/svg">',
    '<path class="sp p1"  pathLength="1" d="M102.588 111.059V58.3529C102.588 55.2341 100.06 52.7058 96.9411 52.7058H77.1764" stroke="#FEBC12" stroke-width="7.52941"/>',
    '<path class="sp p2"  pathLength="1" d="M64 54.5882L81.4842 38.7432C97.9229 23.8456 124.235 35.51 124.235 57.6948C124.235 58.1078 124.036 58.4954 123.7 58.7355L117.647 63.0588V111.059" stroke="#001769" stroke-width="7.52941"/>',
    '<path class="sp p3"  pathLength="1" d="M71.5293 58.353L86.0824 44.6909C98.0471 33.4587 117.647 41.9421 117.647 58.353V66.8235L123.248 71.7244C124.473 72.7967 125.176 74.3458 125.176 75.9742V111.059" stroke="#06EDC4" stroke-width="7.52941"/>',
    '<path class="sp p4"  pathLength="1" d="M74.3529 111.059V64.9413L88.4706 50.8236L88.9152 50.3209C96.3104 41.9612 110.118 47.1918 110.118 58.353V111.059C110.118 115.737 113.91 119.529 118.588 119.529H121.412" stroke="#FF4B40" stroke-width="7.52941"/>',
    '<path class="sp p5"  pathLength="1" d="M20.7058 58.353L35.2589 44.6909C47.2236 33.4587 66.8235 41.9421 66.8235 58.353V66.8235V73.4118V111.059" stroke="#001769" stroke-width="7.52941"/>',
    '<path class="sp p6"  pathLength="1" d="M45.1764 77.1765L58.3529 96.9412" stroke="#FEBC12" stroke-width="7.52941" stroke-linecap="round"/>',
    '<path class="sp p7"  pathLength="1" d="M20.7058 69.6471L38.0022 50.2414C45.4555 41.8791 59.294 47.1512 59.294 58.353V111.059" stroke="#06EDC4" stroke-width="7.52941"/>',
    '<path class="sp p8"  pathLength="1" d="M18.8235 33.8823V53.8334C18.8235 56.1385 19.6694 58.3634 21.2008 60.0862L23.9756 63.2078C25.507 64.9307 26.3529 69.4607V111.059" stroke="#FEBC12" stroke-width="7.52941"/>',
    '<path class="sp p9"  pathLength="1" d="M13.1764 54.5882L30.6606 38.7432C47.0993 23.8456 73.4117 35.51 73.4117 57.6948C73.4117 58.1078 73.2122 58.4954 72.8762 58.7355L66.8235 63.0588" stroke="#FEBC12" stroke-width="7.52941" stroke-linecap="round"/>',
    '<path class="sp p10" pathLength="1" d="M26.3529 33.8823V48.9411C26.3529 51.0203 28.0384 52.7059 30.1176 52.7059H46.1176C49.2364 52.7059 51.7647 55.2341 51.7647 58.3529V111.059" stroke="#FF4B40" stroke-width="7.52941"/>',
    '<path class="sp p11" pathLength="1" d="M3.76465 33.8823V52.7059V60.2353V111.059" stroke="#FEBC12" stroke-width="7.52941"/>',
    '<path class="sp p12" pathLength="1" d="M47.0587 76.2353L66.8234 63.0588" stroke="#FEBC12" stroke-width="7.52941" stroke-linecap="round"/>',
    '<path class="sp p13" pathLength="1" d="M11.2941 33.8823V72.4706V111.059" stroke="#001769" stroke-width="7.52941"/>',
    '<path class="sp p14" pathLength="1" d="M3.76465 33.8823V46.304C3.76465 48.6091 4.61056 50.834 6.14197 52.5568L16.4461 64.149C17.9776 65.8718 18.8235 68.0968 18.8235 70.4018V111.059" stroke="#06EDC4" stroke-width="7.52941"/>',
    '</svg></div>',
    '<div style="width:120px;height:3px;background:rgba(11,180,137,0.15);border-radius:999px;overflow:hidden">',
    '<div style="height:100%;background:#0bb489;border-radius:999px;animation:ml-bar 1.8s ease-in-out infinite"></div>',
    '</div>',
  ].join('');
  document.body.appendChild(el);

  function remove(){
    var s = document.getElementById('ml-splash');
    if(!s) return;
    s.style.transition = 'opacity 0.3s ease';
    s.style.opacity = '0';
    setTimeout(function(){ if(s.parentNode) s.parentNode.removeChild(s); }, 300);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', remove);
  } else {
    remove();
  }
})();`

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="ko">
			<head>
				{/* beforeInteractive: HTML 파싱 즉시 실행 — 스플래시를 가장 빨리 표시 */}
				<Script
					id="ml-splash-script"
					strategy="beforeInteractive"
					dangerouslySetInnerHTML={{ __html: splashScript }}
				/>
			</head>
			<body className=" font-sans antialiased" style={{ backgroundColor: '#f8faf8' }}>
				{children}
			</body>
		</html>
	)
}
