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
			{/* Left: 회원 현황 */}
			<div style={{ width: 208, flexShrink: 0 }} >
				<div className="ml-card mb-3">
					<p className="ml-card-label"> 회원이름 현황</p>
					<dl className='flex items-center gap-1 justify-between text-xs '><dt className='opacity-50'>지난 주 활동일</dt><dd className='font-mono'>4 / 7일</dd></dl>
					<hr className="my-4 border-t-1 border-dotted border-gray-400  opacity-50" />
					<div className="flex flex-col gap-2 text-xs ">
						<dl className='flex items-center gap-1 justify-between'><dt className='opacity-50'>이번 주 목표 METs</dt><dd className='font-mono'>420</dd></dl>

						<dl className='flex items-center gap-1 justify-between'><dt className='opacity-50'>체중</dt><dd className='font-mono'>58.4kg</dd></dl>
						<dl className='flex items-center gap-1 justify-between'><dt className='opacity-50'>근육량</dt><dd className='font-mono'>21.2kg</dd></dl>
						<dl className='flex items-center gap-1 justify-between'><dt className='opacity-50'>체지방률</dt><dd className='font-mono'>28.1%</dd></dl>
						<dl className='flex items-center gap-1 justify-between'><dt className='opacity-50'>체지방량</dt><dd className='font-mono'>16.4kg</dd></dl>
						<dl className='flex items-center gap-1 justify-between'><dt className='opacity-50'>BMI</dt><dd className='font-mono'>22.1</dd></dl>
						<dl className='flex items-center gap-1 justify-between'><dt className='opacity-50'>내장지방레벨</dt><dd className='font-mono'>10</dd></dl>

					</div>
				</div>
				<button type="button" className="btn-primary text-center text-xs py-2.5 mt-1 w-full" >
					알림장 추가
				</button>
			</div>


			<div className='flex flex-col gap-4' style={{ flex: 1 }}>
				{/* Right: 요일 선택 */}
				<div>
					<p className="ml-card-label">요일 선택 </p>

					<div className="flex gap-2">
						{['전체', '월', '화', '수', '목', '금', '토', '일'].map(i => (
							<button
								key={i}
								type="button"
								className="btn-ghost text-xs font-semibold transition-all">
								{i}
							</button>
						))}
					</div>
				</div>

				{/* Right: 수업 강도 */}
				<div className="ml-card ">
					<p className="ml-card-label">수업 강도 처방 <span className="font-normal normal-case ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
						· 회원의 운동 강도를 선택해주세요
					</span></p>

					<div className="flex gap-2">
						{(['recovery', 'normal', 'high'] as Intensity[]).map(i => (
							<button
								key={i}
								type="button"
								onClick={() => setIntensity(i)}
								className="btn-ghost text-xs font-semibold transition-all"
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
						<div className="flex flex-wrap gap-2 mb-3" style={{
							minHeight: '2em',
							padding: '2px 4px'
						}}>
							{tags.map(t => (
								<span key={t} className="ml-tag">
									{t}
									<button type="button" onClick={() => removeTag(t)}
										style={{ color: 'rgba(61,219,181,0.4)', cursor: 'pointer' }}>×</button>
								</span>
							))}
							{tags.length === 0 && (
								<div className="text-xs" style={{
									flex: '1 1 100%',
									textAlign: 'center',
									color: 'rgba(255,255,255,0.5)',
									backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4,
									padding: '0.5em 1em', minHeight: '2em'
								}}>
									태그를 추가하면 영상 추천에 사용됩니다
								</div>
							)}
						</div>
						<div className='mb-3 '>
							<p className="ml-card-label">
								기본 추천 태그 제공
							</p>
							<div className='flex gap-2 flex-wrap'>
								<span className="ml-tag-default ">
									<button type="button" >v</button>코어강화
								</span>
								<span className="ml-tag-default ">
									<button type="button"  >v</button>스트레칭
								</span>
								<span className="ml-tag-default ">
									<button type="button"  >v</button>초보자루틴
								</span>
								<span className="ml-tag-default ">
									<button type="button"  >v</button>필라테스기초
								</span>
							</div>

						</div>
						<div className="flex gap-2">
							<input
								className="ml-input"
								placeholder="태그 입력 후 Enter"
								value={tagInput}
								onChange={e => setTagInput(e.target.value)}
								onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
							/>
							<button type="button" onClick={addTag} className="btn-ghost px-4 flex-none">추가</button>
						</div>

					</div>

					<div className="flex gap-3">
						<button type="button" onClick={() => router.back()} className="btn-ghost flex-1 py-3">
							취소
						</button>
						<button type="submit" disabled={loading} className="btn-primary py-3"
							style={{ flex: 2, opacity: loading ? 0.5 : 1 }}>
							{loading ? '저장 중...' : '저장'}
						</button>
					</div>
				</form>
			</div>


		</div>
	)
}
