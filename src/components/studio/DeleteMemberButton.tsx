'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
	memberId: string
	memberName: string
}

export default function DeleteMemberButton({ memberId, memberName }: Props) {
	const router = useRouter()
	const [showConfirm, setShowConfirm] = useState(false)
	const [loading, setLoading] = useState(false)

	async function handleDelete() {
		setLoading(true)
		const supabase = createClient()
		await supabase.from('members').update({ is_active: false }).eq('id', memberId)
		router.push('/studio')
		router.refresh()
	}

	return (
		<>
			<button
				type="button"
				onClick={() => setShowConfirm(true)}
				className="btn-ghost text-xs py-0.5 px-1.5"
				style={{ color: 'rgba(255,107,91,0.8)', background: 'rgba(255,107,91,0.15)', borderColor: 'transparent' }}
			>
				회원 삭제
			</button>

			{showConfirm && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center px-5"
					style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
					onClick={() => setShowConfirm(false)}
				>
					<div
						className="w-full max-w-xs rounded-2xl p-6 flex flex-col gap-4"
						style={{ background: '#141e2e', border: '1px solid rgba(255,107,91,0.25)' }}
						onClick={e => e.stopPropagation()}
					>
						<div className="text-center">
							<p className="text-2xl mb-2">⚠️</p>
							<p className="text-sm font-semibold text-white">회원을 삭제할까요?</p>
							<p className="text-xs mt-1.5 font-mono" style={{ color: '#3DDBB5' }}>
								{memberName}
							</p>
							<p className="text-xs mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
								운동 기록·인바디·알림장은 보존되며
								<br />회원 목록에서만 숨겨집니다.
							</p>
						</div>
						<div className="flex gap-2">
							<button
								onClick={() => setShowConfirm(false)}
								className="btn-ghost flex-1 py-2.5 text-sm"
							>
								취소
							</button>
							<button
								onClick={handleDelete}
								disabled={loading}
								className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
								style={{
									background: 'rgba(255,107,91,0.15)',
									border: '1px solid rgba(255,107,91,0.4)',
									color: '#FF6B5B',
									opacity: loading ? 0.5 : 1,
								}}
							>
								{loading ? '처리 중...' : '삭제'}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
