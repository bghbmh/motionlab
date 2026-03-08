'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Intensity } from '@/types/database'
import { INTENSITY_LABELS } from '@/types/database'

const INTENSITY_STYLE: Record<Intensity, React.CSSProperties> = {
	recovery: { borderColor: '#FFB347', color: '#FFB347', backgroundColor: 'rgba(255,179,71,0.1)' },
	normal: { borderColor: '#3DDBB5', color: '#3DDBB5', backgroundColor: 'rgba(61,219,181,0.1)' },
	high: { borderColor: '#FF6B5B', color: '#FF6B5B', backgroundColor: 'rgba(255,107,91,0.1)' },
}

export default function NewNotePage() {
	const router = useRouter()
	const { id } = useParams<{ id: string }>()   // ← useParams 사용

	const [content, setContent] = useState('')
	const [intensity, setIntensity] = useState<Intensity>('normal')
	const [tags, setTags] = useState<string[]>([])
	const [tagInput, setTagInput] = useState('')
	const [loading, setLoading] = useState(false)

	function addTag() {
		const t = tagInput.trim()
		if (t && !tags.includes(t)) setTags(prev => [...prev, t])
		setTagInput('')
	}

	function removeTag(tag: string) {
		setTags(prev => prev.filter(t => t !== tag))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!content.trim()) return
		setLoading(true)

		const supabase = createClient()
		const { data: { user } } = await supabase.auth.getUser()

		const { data: note, error } = await supabase
			.from('notes')
			.insert({
				member_id: id,
				instructor_id: user!.id,
				content: content.trim(),
				intensity,
				written_at: new Date().toISOString().split('T')[0],
			})
			.select()
			.single()

		if (error || !note) { setLoading(false); return }

		if (tags.length > 0) {
			await supabase.from('note_tags').insert(
				tags.map(tag => ({ note_id: note.id, tag }))
			)
		}

		router.push(`/studio/members/${id}`)
		router.refresh()
	}

	return (
		<div className="flex gap-5">
			{/* Left: 수업 강도 */}
			<div style={{ width: 208, flexShrink: 0 }} className="flex flex-col gap-4">
				<div className="ml-card">
					<p className="ml-card-label">수업 강도 처방</p>
					<div className="flex flex-col gap-2">
						{(['recovery', 'normal', 'high'] as Intensity[]).map(i => (
							<button
								key={i}
								type="button"
								onClick={() => setIntensity(i)}
								className="py-2 rounded-xl text-sm font-semibold transition-all"
								style={{
									border: '1px solid',
									...(intensity === i
										? INTENSITY_STYLE[i]
										: { borderColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)', backgroundColor: '#1a2740' }
									)
								}}
							>
								{INTENSITY_LABELS[i]}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Right: 알림장 작성 */}
			<form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
				<div className="ml-card flex-1">
					<p className="ml-card-label">
						운동 방향 메모
						<span className="font-normal normal-case ml-1" style={{ color: '#3DDBB5' }}>
							— 회원에게 전달됩니다
						</span>
					</p>
					<textarea
						className="ml-input"
						rows={6}
						style={{ resize: 'none' }}
						placeholder="이번 주 운동 방향을 작성해주세요..."
						value={content}
						onChange={e => setContent(e.target.value)}
						required
					/>
				</div>

				<div className="ml-card">
					<p className="ml-card-label">
						추천 운동 태그
						<span className="font-normal normal-case ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
							· 영상 추천 키워드로 사용됩니다
						</span>
					</p>
					<div className="flex gap-2 mb-3">
						<input
							className="ml-input"
							placeholder="태그 입력 후 Enter"
							value={tagInput}
							onChange={e => setTagInput(e.target.value)}
							onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
						/>
						<button type="button" onClick={addTag} className="btn-ghost px-4">추가</button>
					</div>
					<div className="flex flex-wrap gap-2">
						{tags.map(t => (
							<span key={t} className="ml-tag">
								{t}
								<button type="button" onClick={() => removeTag(t)}
									style={{ color: 'rgba(61,219,181,0.4)', cursor: 'pointer' }}>×</button>
							</span>
						))}
						{tags.length === 0 && (
							<span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
								태그를 추가하면 영상 추천에 사용됩니다
							</span>
						)}
					</div>
				</div>

				<div className="flex gap-3">
					<button type="button" onClick={() => router.back()} className="btn-ghost flex-1 py-3">
						취소
					</button>
					<button type="submit" disabled={loading} className="btn-primary py-3"
						style={{ flex: 2, opacity: loading ? 0.5 : 1 }}>
						{loading ? '저장 중...' : '알림장 저장 및 전송'}
					</button>
				</div>
			</form>
		</div>
	)
}
