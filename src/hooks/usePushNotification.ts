// src/hooks/usePushNotification.ts
// 회원앱에서 Web Push 구독을 관리하는 훅

'use client'

import { useState, useEffect, useCallback } from 'react'

interface UsePushNotificationOptions {
	token: string          // 회원 access_token
}

export function usePushNotification({ token }: UsePushNotificationOptions) {
	const [permission, setPermission] = useState<NotificationPermission>('default')
	const [isSubscribed, setIsSubscribed] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [debugMessage, setDebugMessage] = useState<string>('')

	const debug = (msg: string) => {
		setDebugMessage(msg)
		console.log('[Push]', msg)
	}

	// 현재 구독 상태 확인
	useEffect(() => {
		if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

		setPermission(Notification.permission)

		navigator.serviceWorker.ready.then(reg => {
			reg.pushManager.getSubscription().then(sub => {
				setIsSubscribed(!!sub)
			})
		})
	}, [])

	// Service Worker 등록
	const registerSW = useCallback(async () => {
		if (!('serviceWorker' in navigator)) return null

		try {
			const reg = await navigator.serviceWorker.register('/sw.js', {
				scope: '/',
			})
			return reg
		} catch (err) {
			console.error('[SW] 등록 실패:', err)
			return null
		}
	}, [])

	// 푸시 구독 요청 — 성공 시 true, 실패 시 false 반환
	const subscribe = useCallback(async (): Promise<boolean> => {
		if (!('PushManager' in window)) {
			alert('이 브라우저는 푸시 알림을 지원하지 않습니다.')
			return false
		}

		setIsLoading(true)

		try {
			// 1. 알림 권한 요청
			debug('1. 권한 요청 중...')
			const result = await Notification.requestPermission()
			setPermission(result)
			debug(`1. 권한 결과: ${result}`)

			if (result !== 'granted') {
				return false
			}

			// 2. SW 준비 확인
			debug('2. SW 확인 중...')
			let activeReg = await Promise.race([
				navigator.serviceWorker.ready,
				new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error('SW 타임아웃')), 3000)
				)
			]).catch(async () => {
				// ready 실패 시 직접 등록 시도
				debug('2. SW 직접 등록 시도...')
				return await registerSW()
			})

			if (!activeReg) {
				debug('2. SW 준비 실패')
				return false
			}
			debug('2. SW 준비 완료')

			// SW active 상태 확인
			if (!activeReg.active) {
				debug('2. SW active 아님 — 대기 중...')
				await new Promise<void>((resolve, reject) => {
					const sw = activeReg.installing ?? activeReg.waiting
					if (!sw) return reject(new Error('SW를 찾을 수 없음'))
					sw.addEventListener('statechange', (e) => {
						if ((e.target as ServiceWorker).state === 'activated') resolve()
					})
					setTimeout(() => reject(new Error('SW activate 타임아웃')), 5000)
				})
			}
			debug('2. SW active 확인 완료')

			// 3. 푸시 구독 생성
			debug('3. 푸시 구독 생성 중...')
			const keyArray = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
			const subscription = await activeReg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: keyArray.buffer as ArrayBuffer,
			})
			debug('3. 구독 생성 완료')

			// 4. 서버에 구독 정보 저장
			debug(`4. 서버 저장 중... token: ${token?.slice(0, 8)}`)
			const res = await fetch('/api/push/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, subscription }),
			})

			if (!res.ok) {
				debug(`4. 서버 저장 실패: ${res.status}`)
				return false
			}

			debug('4. 완료! ✅')
			setIsSubscribed(true)
			return true

		} catch (err: any) {
			debug(`❌ 오류: ${err?.message ?? String(err)}`)
			console.error('[Push] 구독 실패:', err)
			return false
		} finally {
			setIsLoading(false)
		}
	}, [token, registerSW])

	// 푸시 구독 해제
	const unsubscribe = useCallback(async () => {
		setIsLoading(true)
		try {
			const reg = await navigator.serviceWorker.ready
			const sub = await reg.pushManager.getSubscription()

			if (sub) {
				await sub.unsubscribe()
				await fetch('/api/push/subscribe', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token, endpoint: sub.endpoint }),
				})
			}

			setIsSubscribed(false)
		} catch (err) {
			console.error('[Push] 해제 실패:', err)
		} finally {
			setIsLoading(false)
		}
	}, [token])

	const isSupported =
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'PushManager' in window

	return {
		permission,
		isSubscribed,
		isLoading,
		isSupported,
		subscribe,
		unsubscribe,
		debugMessage,
	}
}

// Base64 → Uint8Array 변환 (VAPID 공개키용)
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
	const rawData = atob(base64)
	const buffer = new ArrayBuffer(rawData.length)
	const view = new Uint8Array(buffer)
	for (let i = 0; i < rawData.length; i++) {
		view[i] = rawData.charCodeAt(i)
	}
	return view
}
