'use client'

import '../studio/studio.css'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	async function handleLogin(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		setError('')

		const supabase = createClient()
		const { error } = await supabase.auth.signInWithPassword({ email, password })

		if (error) {
			setError('이메일 또는 비밀번호를 확인해주세요.')
			setLoading(false)
			return
		}

		router.push('/studio')
		router.refresh()
	}

	return (
		<div className="min-h-screen bg-navy flex items-center justify-center px-4">
			<div className="w-full max-w-sm">
				{/* 로고 */}
				<div className="text-center mb-10">
					<p className="font-mono text-2xl text-mint tracking-widest font-medium">
						motion-log
					</p>
					<p className="text-xs text-white/30 mt-2">Studio</p>
				</div>

				{/* 폼 */}
				<form onSubmit={handleLogin} className="flex flex-col gap-4 px-10 py-8 border border-gray-600 rounded-2xl">
					<div>
						<p className="text-sm text-gray-400 mb-2">이메일</p>
						<input
							className="px-2 py-3 w-full border-b text-lg text-white bg-transparent"
							style={{ borderColor: 'hsl(0 100% 100% / .7)' }}
							type="email"
							placeholder="instructor@motion-log.com"
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className='mt-3'>
						<p className="text-sm text-gray-400 mb-2">비밀번호</p>
						<input
							className="px-2 py-3 w-full border-b text-lg text-white bg-transparent"
							style={{ borderColor: 'hsl(0 100% 100% / .7)' }}
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
						/>
					</div>

					{error && (
						<p className="text-coral text-xs text-center">{error}</p>
					)}

					<button
						type="submit"
						disabled={loading}
						className="btn-primary w-full mt-2 py-4 disabled:opacity-50"
					>
						{loading ? '로그인 중...' : '로그인'}
					</button>
				</form>
			</div>
		</div>
	)
}
