// public/sw.js
// Service Worker — motion-log PWA 푸시 알림 수신 처리

const CACHE_NAME = 'motion-log-v1'

// ─── 설치 / 활성화 ────────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

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
				// 앱이 이미 열려 있으면 → 홈으로 이동 후 포커스
				if (clients.length > 0) {
					const client = clients[0]
					return client.navigate(fullUrl).then(c => c?.focus())
				}
				// 앱이 꺼져 있으면 → 새로 실행
				if (self.clients.openWindow) {
					return self.clients.openWindow(fullUrl)
				}
			})
	)
})