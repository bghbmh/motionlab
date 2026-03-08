'use client'

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
				<form onSubmit={handleLogin} className="ml-card flex flex-col gap-4">
					<div>
						<p className="ml-card-label">이메일</p>
						<input
							className="ml-input"
							type="email"
							placeholder="instructor@motion-log.com"
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
						/>
					</div>
					<div>
						<p className="ml-card-label">비밀번호</p>
						<input
							className="ml-input"
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
						className="btn-primary w-full mt-2 disabled:opacity-50"
					>
						{loading ? '로그인 중...' : '로그인'}
					</button>
				</form>
			</div>
		</div>
	)
}
