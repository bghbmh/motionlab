'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Intensity, NoteVideo } from '@/types/database'
import { WORKOUT_TYPE_LABELS } from '@/types/database'
import { getThumbnailUrl } from '@/lib/youtubeUtils'
import {
	type NoteWithTags, type WorkoutItem,
	ALL_DAYS, WEEKDAYS, DEFAULT_TAGS,
	calcMets, newItem, uid,
} from './noteWorkoutTypes'
import DaySection from './DaySection'
import NoteVideoSelector from './NoteVideoSelector'

export interface VideoItem {
	videoId: string
	title: string
	thumbnailUrl: string
	youtubeUrl: string
	source: 'manual' | 'search'
}

interface Props {
	memberId: string
	editTarget: NoteWithTags | null
	onClose: () => void
	onSaved: () => void
}

export default function NoteSlideModal({ memberId, editTarget, onClose, onSaved }: Props) {
	const [visible, setVisible] = useState(false)
	const [content, setContent] = useState(editTarget?.content ?? '')
	const [selectedDays, setSelectedDays] = useState<string[]>(editTarget?.days ?? ['전체'])
	const [tags, setTags] = useState<string[]>(editTarget?.note_tags?.map(t => t.tag) ?? [])
	const [tagInput, setTagInput] = useState('')
	const [loading, setLoading] = useState(false)
	const [videos, setVideos] = useState<VideoItem[]>(() => {
		if (!editTarget?.note_videos?.length) return []
		return editTarget.note_videos
			.sort((a, b) => a.sort_order - b.sort_order)
			.map(v => ({
				videoId: v.video_id,
				title: v.title ?? '',
				thumbnailUrl: v.thumbnail_url ?? getThumbnailUrl(v.video_id),
				youtubeUrl: v.youtube_url,
				source: (v.source ?? 'manual') as 'manual' | 'search',
			}))
	})


	// 요일별 운동 목록
	const [dayWorkouts, setDayWorkouts] = useState<Record<string, WorkoutItem[]>>(() => {
		if (!editTarget?.note_workouts?.length) {
			const firstDay = editTarget?.days?.[0] ?? '전체'
			return { [firstDay]: [newItem()] }
		}
		const map: Record<string, WorkoutItem[]> = {};


		for (const w of editTarget.note_workouts.sort((a, b) => a.sort_order - b.sort_order)) {
			const d = w.day ?? '전체'
			if (!map[d]) map[d] = [];

			map[d].push({
				localId: uid(),
				dbId: w.id,
				workout_type: w.workout_type,
				intensity: w.intensity,
				duration_min: w.duration_min != null ? String(w.duration_min) : '',
				coach_memo: w.coach_memo ?? '',
			})
		}
		return map
	})

	// 총 METs
	const totalMets = Object.values(dayWorkouts)
		.flat()
		.filter(Boolean)
		.reduce<number>((s, w) => s + (calcMets(w) ?? 0), 0)
	const totalMetsDisplay = totalMets > 0 ? Math.round(totalMets * 100) / 100 : null


	// 기본 검색어 — 태그 우선, 없으면 운동종류
	const defaultVideoQuery = tags.length > 0
		? tags.join(' ')
		: Object.values(dayWorkouts)
			.flat()
			.filter(w => w?.workout_type)
			.map(w => WORKOUT_TYPE_LABELS[w.workout_type!])
			.filter((v, i, a) => a.indexOf(v) === i)
			.join(' ')

	useEffect(() => {
		const t = requestAnimationFrame(() => setVisible(true))
		return () => cancelAnimationFrame(t)
	}, [])

	function handleClose() {
		setVisible(false)
		setTimeout(onClose, 300)
	}

	function toggleDay(day: string) {
		if (day === '전체') {
			setSelectedDays(['전체'])
			setDayWorkouts({ '전체': [newItem()] })
			return
		}
		setSelectedDays(prev => {
			const without = prev.filter(d => d !== '전체')
			if (without.includes(day)) {
				const next = without.filter(d => d !== day)
				setDayWorkouts(dw => {
					const updated = { ...dw }
					delete updated[day]
					return next.length === 0 ? { '전체': [newItem()] } : updated
				})
				return next.length === 0 ? ['전체'] : next
			} else {
				// ← null 대신 빈 배열로 초기화
				setDayWorkouts(dw => ({ ...dw, [day]: [] }))
				return [...without, day].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b))
			}
		})
	}

	function getPreviousItems(day: string): WorkoutItem[] {
		if (day === '전체') return []
		const idx = WEEKDAYS.indexOf(day)
		for (let i = idx - 1; i >= 0; i--) {
			const d = WEEKDAYS[i]
			if (dayWorkouts[d]?.length) return dayWorkouts[d]
		}
		return []
	}

	function addTag() {
		const t = tagInput.trim()
		if (t && !tags.includes(t)) setTags(p => [...p, t])
		setTagInput('')
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!content.trim()) return
		setLoading(true)

		const supabase = createClient()
		const { data: { user } } = await supabase.auth.getUser()

		const notePayload = {
			content: content.trim(),
			intensity: 'normal' as Intensity,
			days: selectedDays,
			recommended_mets: totalMetsDisplay,
		}

		let noteId: string

		try {
			if (editTarget) {
				const { error } = await supabase.from('notes').update(notePayload).eq('id', editTarget.id)
				if (error) { console.error('notes update error:', error); setLoading(false); return }
				noteId = editTarget.id
				await supabase.from('note_tags').delete().eq('note_id', noteId)
				await supabase.from('note_workouts').delete().eq('note_id', noteId)
				await supabase.from('note_videos').delete().eq('note_id', noteId)
			} else {
				const { data: note, error } = await supabase
					.from('notes')
					.insert({
						member_id: memberId,
						instructor_id: user!.id,
						is_sent: false,
						written_at: new Date().toISOString().split('T')[0],
						...notePayload,
					})
					.select().single()
				if (error || !note) { console.error('notes insert error:', error); setLoading(false); return }
				noteId = note.id
			}

			if (tags.length > 0) {
				const { error } = await supabase.from('note_tags').insert(tags.map(tag => ({ note_id: noteId, tag })))
				if (error) console.error('note_tags error:', error)
			}

			if (videos.length > 0) {
				const { error } = await supabase.from('note_videos').insert(
					videos.map((v, idx) => ({
						note_id: noteId,
						video_id: v.videoId,
						youtube_url: v.youtubeUrl,
						title: v.title || null,
						thumbnail_url: v.thumbnailUrl || null,
						source: v.source,
						sort_order: idx,
					}))
				)
				if (error) console.error('note_videos error:', error)
			}

			const workoutRows = Object.entries(dayWorkouts).flatMap(([day, items]) =>
				(items ?? [])
					.filter(w => w.workout_type)
					.map((w, idx) => ({
						note_id: noteId,
						day,
						workout_type: w.workout_type!,
						intensity: w.intensity,
						duration_min: w.duration_min ? Number(w.duration_min) : null,
						mets: calcMets(w),
						sort_order: idx,
					}))
			)
			if (workoutRows.length > 0) {
				const { error } = await supabase.from('note_workouts').insert(workoutRows)
				if (error) console.error('note_workouts error:', error)
			}

			setLoading(false)
			onSaved()

		} catch (err) {
			console.error('handleSubmit caught error:', err)
			setLoading(false)
		}
	}

	const activeDays = selectedDays.includes('전체') ? ['전체'] : selectedDays

	return (
		<>
			{/* 배경 */}
			<div className="fixed inset-0 z-40"
				style={{
					background: visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
					backdropFilter: visible ? 'blur(3px)' : 'none',
					transition: 'background 0.3s ease, backdrop-filter 0.3s ease',
				}}
				onClick={handleClose}
			/>

			{/* 패널 */}
			<div className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
				style={{
					width: 'min(540px, 92vw)',
					background: '#141e2e',
					borderLeft: '1px solid rgba(255,255,255,0.08)',
					boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
					transform: visible ? 'translateX(0)' : 'translateX(100%)',
					transition: 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
					overflowY: 'auto',
				}}
				onClick={e => e.stopPropagation()}>

				{/* 헤더 */}
				<div className="flex justify-between items-center px-6 py-4 sticky top-0 z-10"
					style={{ background: '#141e2e', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
					<p className="font-mono text-sm font-medium" style={{ color: '#3DDBB5' }}>
						{editTarget ? '알림장 수정' : '새 알림장 작성'}
					</p>
					<div className="flex items-center gap-3">
						{totalMetsDisplay && (
							<div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
								style={{ background: 'rgba(61,219,181,0.08)', border: '1px solid rgba(61,219,181,0.2)' }}>
								<span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>총 METs</span>
								<span className="font-mono text-sm font-bold" style={{ color: '#3DDBB5' }}>{totalMetsDisplay}</span>
							</div>
						)}
						<button type="button" onClick={handleClose} className="btn-ghost text-xs py-1 px-2.5">✕</button>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="flex flex-col gap-7 p-6 flex-1">

					{/* ① 운동 방향 메모 */}
					<div>
						<p className="ml-card-label">
							운동 방향 메모
							<span className="font-normal normal-case ml-1" style={{ color: '#3DDBB5' }}>
								— 회원에게 전달됩니다
							</span>
						</p>
						<textarea className="ml-input" rows={3} style={{ resize: 'none' }}
							placeholder="이번 주 운동 방향을 작성해주세요..."
							value={content} onChange={e => setContent(e.target.value)} required />
					</div>

					{/* ② 요일 선택 */}
					<div>
						<p className="ml-card-label">
							요일 선택
							<span className="font-normal normal-case ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
								· 중복 선택 가능
							</span>
						</p>
						<div className="flex gap-2 flex-wrap">
							{ALL_DAYS.map(day => {
								const isSelected = selectedDays.includes(day)
								return (
									<button key={day} type="button" onClick={() => toggleDay(day)}
										className="text-xs font-semibold rounded-lg px-3 py-2 transition-all"
										style={{
											background: isSelected ? 'rgba(61,219,181,0.12)' : '#1a2740',
											border: `1px solid ${isSelected ? 'rgba(61,219,181,0.45)' : 'rgba(255,255,255,0.07)'}`,
											color: isSelected ? '#3DDBB5' : 'rgba(255,255,255,0.35)',
										}}>
										{day}
									</button>
								)
							})}
						</div>
					</div>

					{/* ③ 요일별 추천 운동 */}
					<div className="flex flex-col gap-3">
						<p className="ml-card-label m-0">요일별 추천 운동</p>
						{activeDays.map(day => (
							<DaySection
								key={day}
								day={day}
								items={dayWorkouts[day] ?? null}
								previousItems={getPreviousItems(day)}
								onUpdate={items => setDayWorkouts(dw => ({ ...dw, [day]: items }))}
								onAddWorkout={() =>
									setDayWorkouts(dw => ({ ...dw, [day]: [...(dw[day] ?? []), newItem()] }))
								}
								onRemoveWorkout={localId =>
									setDayWorkouts(dw => ({
										...dw,
										[day]: (dw[day] ?? []).filter(w => w.localId !== localId),
									}))
								}
							/>
						))}
					</div>

					{/* ④ 추천 운동 태그 */}
					<div>
						<p className="ml-card-label">
							추천 운동 태그
							<span className="font-normal normal-case ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
								· 영상 추천 키워드
							</span>
						</p>
						{tags.length > 0 ? (
							<div className="flex flex-wrap gap-1.5 mb-3">
								{tags.map(t => (
									<span key={t} className="ml-tag">
										{t}
										<button type="button" onClick={() => setTags(p => p.filter(x => x !== t))}
											style={{ color: 'rgba(61,219,181,0.4)', cursor: 'pointer', marginLeft: 2 }}>×</button>
									</span>
								))}
							</div>
						) : (
							<div className="text-xs mb-3 text-center rounded py-2"
								style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)' }}>
								태그를 추가하면 영상 추천에 사용됩니다
							</div>
						)}
						<p className="ml-card-label mb-2">기본 추천 태그</p>
						<div className="flex flex-wrap gap-1.5 mb-3">
							{DEFAULT_TAGS.map(t => {
								const isSel = tags.includes(t)
								return (
									<button key={t} type="button"
										onClick={() => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])}
										className="text-[11px] rounded-full px-3 py-1 transition-all"
										style={{
											background: isSel ? 'rgba(61,219,181,0.12)' : '#1a2740',
											border: `1px solid ${isSel ? 'rgba(61,219,181,0.4)' : 'rgba(255,255,255,0.07)'}`,
											color: isSel ? '#3DDBB5' : 'rgba(255,255,255,0.4)',
										}}>
										{isSel ? '✓ ' : '+ '}{t}
									</button>
								)
							})}
						</div>
						<div className="flex gap-2">
							<input className="ml-input" placeholder="태그 직접 입력 후 Enter"
								value={tagInput} onChange={e => setTagInput(e.target.value)}
								onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
							/>
							<button type="button" onClick={addTag} className="btn-ghost px-4 flex-none text-xs">추가</button>
						</div>
					</div>

					<div>
						<p className="ml-card-label">
							추천 영상
							<span className="font-normal normal-case ml-1"
								style={{ color: 'rgba(255,255,255,0.3)' }}>
								· 최대 5개 · 회원 추천영상 탭에 표시됩니다
							</span>
						</p>
						<NoteVideoSelector
							videos={videos}
							onChange={setVideos}
							defaultQuery={defaultVideoQuery}
							suggestedWorkouts={
								Object.values(dayWorkouts)
									.flat()
									.filter(w => w?.workout_type)
									.map(w => WORKOUT_TYPE_LABELS[w.workout_type!])
									.filter((v, i, a) => a.indexOf(v) === i)   // 중복 제거
							}
							suggestedTags={tags}
						/>
					</div>

					{/* 저장 */}
					<button type="submit" disabled={loading} className="btn-primary py-3.5 text-sm"
						style={{ opacity: loading ? 0.5 : 1 }}>
						{loading ? '저장 중...' : editTarget ? '수정 완료' : '알림장 저장'}
					</button>
				</form>
			</div>
		</>
	)
}
