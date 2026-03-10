'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Intensity, Note } from '@/types/database'
import { INTENSITY_LABELS } from '@/types/database'

// ─── 상수 ────────────────────────────────────────────────────────
const ALL_DAYS = ['전체', '월', '화', '수', '목', '금', '토', '일']

const DEFAULT_TAGS = ['코어강화', '스트레칭', '초보자루틴', '필라테스기초']

const INTENSITY_STYLE: Record<Intensity, React.CSSProperties> = {
	recovery: { borderColor: '#FFB347', color: '#FFB347', backgroundColor: 'rgba(255,179,71,0.1)' },
	normal: { borderColor: '#3DDBB5', color: '#3DDBB5', backgroundColor: 'rgba(61,219,181,0.1)' },
	high: { borderColor: '#FF6B5B', color: '#FF6B5B', backgroundColor: 'rgba(255,107,91,0.1)' },
}

// ─── Props ────────────────────────────────────────────────────────
type NoteWithTags = Omit<Note, 'note_tags'> & {
	note_tags: { tag: string }[]
}

interface Props {
	memberId: string
	editTarget: NoteWithTags | null
	onClose: () => void
	onSaved: () => void
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────
export default function NoteSlideModal({ memberId, editTarget, onClose, onSaved }: Props) {
	// 슬라이드 애니메이션
	const [visible, setVisible] = useState(false)

	// 폼 상태
	const [intensity, setIntensity] = useState<Intensity>(editTarget?.intensity ?? 'normal')
	const [days, setDays] = useState<string[]>(editTarget?.days ?? ['전체'])
	const [content, setContent] = useState(editTarget?.content ?? '')
	const [tags, setTags] = useState<string[]>(
		editTarget?.note_tags?.map(t => t.tag) ?? []
	)
	const [tagInput, setTagInput] = useState('')
	const [loading, setLoading] = useState(false)

	// 마운트 후 슬라이드-인
	useEffect(() => {
		const t = requestAnimationFrame(() => setVisible(true))
		return () => cancelAnimationFrame(t)
	}, [])

	// 닫기 (슬라이드-아웃 후 onClose)
	function handleClose() {
		setVisible(false)
		setTimeout(onClose, 300)
	}

	// 요일 토글
	function toggleDay(day: string) {
		if (day === '전체') {
			setDays(['전체'])
			return
		}
		setDays(prev => {
			const without전체 = prev.filter(d => d !== '전체')
			const next = without전체.includes(day)
				? without전체.filter(d => d !== day)
				: [...without전체, day]
			return next.length === 0 ? ['전체'] : next
		})
	}

	// 기본 태그 토글
	function toggleDefaultTag(tag: string) {
		setTags(prev =>
			prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
		)
	}

	// 직접 태그 추가
	function addTag() {
		const t = tagInput.trim()
		if (t && !tags.includes(t)) setTags(prev => [...prev, t])
		setTagInput('')
	}

	// 저장
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!content.trim()) return
		setLoading(true)

		const supabase = createClient()
		const { data: { user } } = await supabase.auth.getUser()

		if (editTarget) {
			// ── 수정 ──
			await supabase.from('notes').update({
				content: content.trim(),
				intensity,
				days,
			}).eq('id', editTarget.id)

			// 태그 교체
			await supabase.from('note_tags').delete().eq('note_id', editTarget.id)
			if (tags.length > 0) {
				await supabase.from('note_tags').insert(
					tags.map(tag => ({ note_id: editTarget.id, tag }))
				)
			}
		} else {
			// ── 신규 ──
			const { data: note, error } = await supabase
				.from('notes')
				.insert({
					member_id: memberId,
					instructor_id: user!.id,
					content: content.trim(),
					intensity,
					days,
					is_sent: false,
					written_at: new Date().toISOString().split('T')[0],
				})
				.select()
				.single()

			if (!error && note && tags.length > 0) {
				await supabase.from('note_tags').insert(
					tags.map(tag => ({ note_id: note.id, tag }))
				)
			}
		}

		setLoading(false)
		onSaved()
	}

	return (
		<>
			{/* ── 배경 오버레이 ── */}
			<div
				className="fixed inset-0 z-40"
				style={{
					background: visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
					backdropFilter: visible ? 'blur(3px)' : 'none',
					transition: 'background 0.3s ease, backdrop-filter 0.3s ease',
				}}
				onClick={handleClose}
			/>

			{/* ── 슬라이드 패널 (오른쪽에서 왼쪽으로) ── */}
			<div
				className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
				style={{
					width: 'min(520px, 90vw)',
					background: '#141e2e',
					borderLeft: '1px solid rgba(255,255,255,0.08)',
					boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
					transform: visible ? 'translateX(0)' : 'translateX(100%)',
					transition: 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
					overflowY: 'auto',
				}}
				onClick={e => e.stopPropagation()}
			>
				{/* ── 헤더 ── */}
				<div
					className="flex justify-between items-center px-6 py-4 sticky top-0 z-10"
					style={{
						background: '#141e2e',
						borderBottom: '1px solid rgba(255,255,255,0.07)',
					}}
				>
					<p className="font-mono text-sm font-medium" style={{ color: '#3DDBB5' }}>
						{editTarget ? '알림장 수정' : '새 알림장 작성'}
					</p>
					<button
						type="button"
						onClick={handleClose}
						className="btn-ghost text-xs py-1 px-2.5"
					>
						✕
					</button>
				</div>

				{/* ── 폼 ── */}
				<form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 flex-1">

					{/* 요일 선택 */}
					<div>
						<p className="ml-card-label">
							요일 선택
							<span className="font-normal normal-case ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
								· 중복 선택 가능
							</span>
						</p>
						<div className="flex gap-2 flex-wrap">
							{ALL_DAYS.map(day => {
								const isSelected = days.includes(day)
								return (
									<button
										key={day}
										type="button"
										onClick={() => toggleDay(day)}
										className="text-xs font-semibold rounded-lg px-3 py-2 transition-all"
										style={{
											background: isSelected ? 'rgba(61,219,181,0.12)' : '#1a2740',
											border: `1px solid ${isSelected ? 'rgba(61,219,181,0.45)' : 'rgba(255,255,255,0.07)'}`,
											color: isSelected ? '#3DDBB5' : 'rgba(255,255,255,0.35)',
										}}
									>
										{day}
									</button>
								)
							})}
						</div>
					</div>

					{/* 수업 강도 */}
					<div>
						<p className="ml-card-label">
							수업 강도
							<span className="font-normal normal-case ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
								· 회원의 운동 강도를 선택해주세요
							</span>
						</p>
						<div className="flex gap-2">
							{(['recovery', 'normal', 'high'] as Intensity[]).map(i => (
								<button
									key={i}
									type="button"
									onClick={() => setIntensity(i)}
									className="flex-1 text-xs font-semibold rounded-xl py-2.5 transition-all"
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

					{/* 운동 방향 메모 */}
					<div>
						<p className="ml-card-label">
							운동 방향 메모
							<span className="font-normal normal-case ml-1" style={{ color: '#3DDBB5' }}>
								— 회원에게 전달됩니다
							</span>
						</p>
						<textarea
							className="ml-input"
							rows={7}
							style={{ resize: 'none' }}
							placeholder="이번 주 운동 방향을 작성해주세요..."
							value={content}
							onChange={e => setContent(e.target.value)}
							required
						/>
					</div>

					{/* 추천 운동 태그 */}
					<div>
						<p className="ml-card-label">
							추천 운동 태그
							<span className="font-normal normal-case ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
								· 영상 추천 키워드로 사용됩니다
							</span>
						</p>

						{/* 선택된 태그 목록 */}
						{tags.length > 0 ? (
							<div className="flex flex-wrap gap-1.5 mb-3">
								{tags.map(t => (
									<span key={t} className="ml-tag">
										{t}
										<button
											type="button"
											onClick={() => setTags(prev => prev.filter(x => x !== t))}
											style={{ color: 'rgba(61,219,181,0.4)', cursor: 'pointer', marginLeft: 2 }}
										>
											×
										</button>
									</span>
								))}
							</div>
						) : (
							<div className="text-xs mb-3" style={{
								flex: '1 1 100%',
								textAlign: 'center',
								color: 'rgba(255,255,255,0.5)',
								backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4,
								padding: '0.5em 1em', minHeight: '2em'
							}}>
								태그를 추가하면 영상 추천에 사용됩니다
							</div>
						)}

						{/* 기본 추천 태그 */}
						<p className="ml-card-label mb-2">기본 추천 태그</p>
						<div className="flex flex-wrap gap-1.5 mb-3">
							{DEFAULT_TAGS.map(t => {
								const isSelected = tags.includes(t)
								return (
									<button
										key={t}
										type="button"
										onClick={() => toggleDefaultTag(t)}
										className="text-[11px] rounded-full px-3 py-1 transition-all"
										style={{
											background: isSelected ? 'rgba(61,219,181,0.12)' : '#1a2740',
											border: `1px solid ${isSelected ? 'rgba(61,219,181,0.4)' : 'rgba(255,255,255,0.07)'}`,
											color: isSelected ? '#3DDBB5' : 'rgba(255,255,255,0.4)',
										}}
									>
										{isSelected ? '✓ ' : '+ '}{t}
									</button>
								)
							})}
						</div>

						{/* 직접 입력 */}
						<div className="flex gap-2">
							<input
								className="ml-input"
								placeholder="태그 직접 입력 후 Enter"
								value={tagInput}
								onChange={e => setTagInput(e.target.value)}
								onKeyDown={e => {
									if (e.key === 'Enter') { e.preventDefault(); addTag() }
								}}
							/>
							<button
								type="button"
								onClick={addTag}
								className="btn-ghost px-4 flex-none text-xs"
							>
								추가
							</button>
						</div>
					</div>

					{/* 저장 버튼 */}
					<button
						type="submit"
						disabled={loading}
						className="btn-primary py-3.5 text-sm"
						style={{ opacity: loading ? 0.5 : 1 }}
					>
						{loading ? '저장 중...' : editTarget ? '수정 완료' : '알림장 저장'}
					</button>
				</form>
			</div>
		</>
	)
}
