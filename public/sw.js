// public/sw.js
// Service Worker — motion-log PWA
//
// 캐싱 전략:
//   - 정적 파일 (이미지/아이콘): Cache First
//     → 캐시에 있으면 즉시 반환, 없으면 네트워크 요청 후 캐시 저장
//   - API / 페이지 HTML: 캐싱 안 함
//     → 항상 서버에서 최신 데이터 받아옴

const CACHE_NAME = 'motion-log-v1'

// 설치 시 미리 캐싱할 정적 파일 목록
const PRECACHE_URLS = [
	'/images/workout/stretching.png',
	'/images/workout/strength.png',
	'/images/workout/cardio.png',
	'/images/workout/pilates.png',
	'/images/workout/yoga.png',
	'/images/workout/other.png',
	'/images/workout/none_workout.png',
	'/images/workout/daily_once.png',
	'/images/workout/daily_lifestyle.png',
	'/images/Bell.png',
	'/images/Party_popper.png',
	'/icons/icon-192x192.png',
	'/icons/icon-512x512.png',
]

// 캐싱할 경로 패턴 (정적 파일만)
function isStaticFile(url) {
	const { pathname } = new URL(url)
	return (
		pathname.startsWith('/images/') ||
		pathname.startsWith('/icons/') ||
		pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico|woff|woff2)$/)
	)
}

// ─── 설치 — 정적 파일 미리 캐싱 ─────────────────────────────
self.addEventListener('install', e => {
	e.waitUntil(
		caches.open(CACHE_NAME)
			.then(cache => cache.addAll(PRECACHE_URLS))
			.then(() => self.skipWaiting())
	)
})

// ─── 활성화 — 이전 버전 캐시 삭제 ───────────────────────────
self.addEventListener('activate', e => {
	e.waitUntil(
		caches.keys().then(keys =>
			Promise.all(
				keys
					.filter(key => key !== CACHE_NAME)
					.map(key => caches.delete(key))
			)
		).then(() => self.clients.claim())
	)
})

// ─── fetch — Cache First (정적 파일만) ───────────────────────
self.addEventListener('fetch', e => {
	// GET 요청만 캐싱 대상
	if (e.request.method !== 'GET') return

	// 정적 파일이 아니면 캐싱 안 함 → 항상 네트워크
	if (!isStaticFile(e.request.url)) return

	e.respondWith(
		caches.match(e.request).then(cached => {
			if (cached) return cached

			// 캐시에 없으면 네트워크 요청 후 캐시 저장
			return fetch(e.request).then(response => {
				// 정상 응답만 캐시
				if (!response || response.status !== 200) return response

				const toCache = response.clone()
				caches.open(CACHE_NAME).then(cache => cache.put(e.request, toCache))
				return response
			})
		})
	)
})

// ─── 푸시 수신 ───────────────────────────────────────────────
self.addEventListener('push', e => {
	let data = { title: 'motion-log', body: '새 알림이 있어요', url: '/' }

	if (e.data) {
		try {
			data = { ...data, ...e.data.json() }
		} catch {
			data.body = e.data.text()
		}
	}

	e.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.body,
			icon: '/icons/icon-192x192.png',
			badge: '/icons/badge-72x72.png',
			tag: 'motion-log-notification',
			renotify: true,
			data: { url: data.url },
			vibrate: [200, 100, 200],
		})
	)
})

// ─── 알림 클릭 ───────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
	e.notification.close()

	const targetUrl = e.notification.data?.url || '/'
	const fullUrl = self.location.origin + targetUrl

	e.waitUntil(
		self.clients
			.matchAll({ type: 'window', includeUncontrolled: true })
			.then(clients => {
				// 앱이 이미 열려 있으면 홈으로 이동 후 포커스
				if (clients.length > 0) {
					const client = clients[0]
					return client.navigate(fullUrl).then(c => c?.focus())
				}
				// 앱이 꺼져 있으면 새로 실행
				if (self.clients.openWindow) {
					return self.clients.openWindow(fullUrl)
				}
			})
	)
})