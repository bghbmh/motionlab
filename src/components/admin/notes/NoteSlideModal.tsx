'use client'

// src/components/admin/notes/NoteSlideModal.tsx
// 알림장 작성 / 수정 모달
// 디자인: 알림장-입력-수정-모달.png
// 아래에서 위로 슬라이드업 / 라이트 테마 / 2컬럼 레이아웃

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Intensity } from '@/types/database'
import { WORKOUT_TYPE_LABELS } from '@/types/database'
import { getThumbnailUrl } from '@/lib/youtubeUtils'
import {
	type NoteWithTags, type WorkoutItem,
	DEFAULT_TAGS,
	calcMets, newItem, uid,
} from './noteWorkoutTypes'
import DaySection from './DaySection'
import NoteVideoSelector from './NoteVideoSelector'

import { Calendar, X, Plus, Check } from 'lucide-react'
import { toLocalISO, parseLocalDate, formatDisplayDate, getDayKoShort } from '@/lib/weekUtils'


// formatDisplayDate 함수 삭제

export interface VideoItem {
	videoId: string
	title: string
	thumbnailUrl: string
	youtubeUrl: string
	source: 'manual' | 'search'
}

interface Props {
	memberId: string
	memberName?: string
	editTarget: NoteWithTags | null
	onClose: () => void
	onSaved: () => void
}

// ─── 날짜 유틸 ───────────────────────────────────────────────────
function addDays(dateStr: string, n: number): string {
	const d = parseLocalDate(dateStr)  // ← 로컬 기준 파싱
	d.setDate(d.getDate() + n)
	return toLocalISO(d)
}


const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']

// "2/29 금" 형태 칩 레이블
function formatChipLabel(dateStr: string): string {
	const [, m, d] = dateStr.split('-')
	const dayOfWeek = getDayKoShort(dateStr)  // ← getDayKo 대신
	return `${Number(m)}/${Number(d)} ${dayOfWeek}`
}

// DB 요일값 → 날짜 범위에서 해당 요일 날짜 찾기
function findDatesByDayNames(dayNames: string[], dateRange: string[]): string[] {
	return dateRange.filter(date => dayNames.includes(getDayKoShort(date)))
}

// 시작일부터 종료일까지 날짜 배열 생성
function getDateRange(startDate: string, endDate: string): string[] {
	const result: string[] = []
	let cur = startDate
	while (cur <= endDate) {
		result.push(cur)
		cur = addDays(cur, 1)
	}
	return result
}

const WEEKDAY_NAMES = ['월', '화', '수', '목', '금', '토', '일']
const isDateFormat = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v)

// ─── 달력 아이콘 ─────────────────────────────────────────────────
function CalendarIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 text-gray-400">
			<rect x="1.5" y="3" width="15" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M1.5 7.5H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
			<path d="M6 1.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
			<path d="M12 1.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	)
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────
export default function NoteSlideModal({ memberId, memberName, editTarget, onClose, onSaved }: Props) {
	const [visible, setVisible] = useState(false)

	// ── 날짜 상태 ────────────────────────────────────────────────
	const today = toLocalISO(new Date())
	const [startDate, setStartDate] = useState(editTarget?.written_at ?? today)
	const [endDate, setEndDate] = useState(addDays(editTarget?.written_at ?? today, 6))

	// 날짜 범위 배열
	const dateRange = useMemo(() => getDateRange(startDate, endDate), [startDate, endDate])

	// 시작일 변경 시 종료일 +6일 자동 갱신 + 선택 초기화
	function handleStartDateChange(val: string) {
		setStartDate(val)
		setEndDate(addDays(val, 6))
		setSelectedDates(['매일'])
		setDayWorkouts({ '매일': [newItem()] })
	}

	// ── 폼 상태 ──────────────────────────────────────────────────
	const [content, setContent] = useState(editTarget?.content ?? '')

	// DB days 값에 따른 초기 선택 날짜 복원:
	// - ['전체'] → ['매일']
	// - ['월','화'] → dateRange에서 해당 요일 날짜 찾기
	// - ['2025-03-01'] → 그대로
	const initRange = useMemo(
		() => getDateRange(
			editTarget?.written_at ?? toLocalISO(new Date()),
			addDays(editTarget?.written_at ?? toLocalISO(new Date()), 6)
		),
		[] // 마운트 시 한 번만
	)

	const [selectedDates, setSelectedDates] = useState<string[]>(() => {
		const days = editTarget?.days
		if (!days?.length) return ['매일']

		// '전체' → '매일'
		if (days.includes('전체')) return ['매일']
		if (days.includes('매일')) return ['매일']

		// 날짜 형식이면 그대로
		if (isDateFormat(days[0])) return days

		// 요일값(월/화...) → initRange에서 해당 요일 날짜 찾기
		const weekdayValues = days.filter(d => WEEKDAY_NAMES.includes(d))
		if (weekdayValues.length > 0) {
			const matched = findDatesByDayNames(weekdayValues, initRange)
			return matched.length > 0 ? matched : ['매일']
		}

		return ['매일']
	})
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

	const [dayWorkouts, setDayWorkouts] = useState<Record<string, WorkoutItem[]>>(() => {
		if (!editTarget?.note_workouts?.length) {
			return { '매일': [newItem()] }
		}
		const map: Record<string, WorkoutItem[]> = {}
		for (const w of editTarget.note_workouts.sort((a, b) => a.sort_order - b.sort_order)) {
			let d: string
			if (!w.day || w.day === '전체' || w.day === '매일') {
				d = '매일'
			} else if (isDateFormat(w.day)) {
				d = w.day
			} else if (WEEKDAY_NAMES.includes(w.day)) {
				// 요일값 → initRange에서 해당 요일 날짜 찾기
				const matched = findDatesByDayNames([w.day], initRange)
				d = matched[0] ?? '매일'
			} else {
				d = '매일'
			}
			if (!map[d]) map[d] = []
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
		setTimeout(onClose, 320)
	}

	// ── 날짜 칩 토글 ─────────────────────────────────────────────
	function toggleDate(date: string) {
		if (date === '매일') {
			setSelectedDates(['매일'])
			setDayWorkouts({ '매일': [newItem()] })
			return
		}
		setSelectedDates(prev => {
			const without = prev.filter(d => d !== '매일')
			if (without.includes(date)) {
				const next = without.filter(d => d !== date)
				setDayWorkouts(dw => {
					const updated = { ...dw }
					delete updated[date]
					delete updated['매일']
					return next.length === 0 ? { '매일': [newItem()] } : updated
				})
				return next.length === 0 ? ['매일'] : next
			} else {
				setDayWorkouts(dw => {
					const updated = { ...dw }
					delete updated['매일']
					return { ...updated, [date]: null as any }
				})
				return [...without, date].sort()
			}
		})
	}

	function getPreviousItems(date: string): WorkoutItem[] {
		if (date === '매일') return []
		const idx = dateRange.indexOf(date)
		for (let i = idx - 1; i >= 0; i--) {
			const d = dateRange[i]
			if (dayWorkouts[d]?.length) return dayWorkouts[d]
		}
		return []
	}

	function addTag() {
		const t = tagInput.trim()
		if (t && !tags.includes(t)) setTags(p => [...p, t])
		setTagInput('')
	}

	const activeDates = selectedDates.includes('매일') ? ['매일'] : selectedDates

	// ── 저장 ─────────────────────────────────────────────────────
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)

		const supabase = createClient()
		const { data: { user } } = await supabase.auth.getUser()

		const notePayload = {
			content: content.trim(),
			intensity: 'normal' as Intensity,
			days: selectedDates,
			recommended_mets: totalMetsDisplay,
			written_at: startDate,
			start_at: startDate,   // ← 추가
			end_at: endDate,
		}

		let noteId: string

		try {
			if (editTarget) {
				await supabase.from('notes').update(notePayload).eq('id', editTarget.id)
				noteId = editTarget.id
				await supabase.from('note_tags').delete().eq('note_id', noteId)
				await supabase.from('note_workouts').delete().eq('note_id', noteId)
				await supabase.from('note_videos').delete().eq('note_id', noteId)
			} else {
				const { data: note, error } = await supabase
					.from('notes')
					.insert({ member_id: memberId, instructor_id: user!.id, is_sent: false, ...notePayload })
					.select().single()
				if (error || !note) { setLoading(false); return }
				noteId = note.id
			}

			if (tags.length > 0) {
				await supabase.from('note_tags').insert(tags.map(tag => ({ note_id: noteId, tag })))
			}

			if (videos.length > 0) {
				await supabase.from('note_videos').insert(
					videos.map((v, idx) => ({
						note_id: noteId, video_id: v.videoId, youtube_url: v.youtubeUrl,
						title: v.title || null, thumbnail_url: v.thumbnailUrl || null,
						source: v.source, sort_order: idx,
					}))
				)
			}

			const workoutRows = Object.entries(dayWorkouts).flatMap(([day, items]) =>
				(items ?? []).filter(w => w.workout_type).map((w, idx) => ({
					note_id: noteId, day,
					workout_type: w.workout_type!,
					intensity: w.intensity,
					duration_min: w.duration_min ? Number(w.duration_min) : null,
					mets: calcMets(w), sort_order: idx,
					coach_memo: w.coach_memo?.trim() || null,
				}))
			)
			if (workoutRows.length > 0) {
				await supabase.from('note_workouts').insert(workoutRows)
			}

			setLoading(false)
			onSaved()
		} catch (err) {
			console.error('handleSubmit error:', err)
			setLoading(false)
		}
	}

	return (
		<>
			{/* 배경 오버레이 */}
			<div
				className="fixed inset-0 z-40"
				style={{
					background: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
					transition: 'background 0.3s ease',
				}}
				onClick={handleClose}
			/>

			{/* 슬라이드업 패널 */}
			<div className="fixed inset-x-0 bottom-0 z-50 flex justify-center">
				<div
					className="relative flex flex-col bg-white shadow-2xl overflow-hidden w-full"
					style={{
						maxWidth: '1080px',
						height: '92vh',
						borderRadius: '20px 20px 0 0',
						transform: visible ? 'translateY(0)' : 'translateY(100%)',
						transition: 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
					}}
					onClick={e => e.stopPropagation()}
				>
					{/* ── 헤더 ─────────────────────────────────────── */}
					<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
						<div className="flex items-center gap-3">
							<div className="w-1 h-5 rounded-full bg-primary" />
							<span className="text-base font-bold text-gray-900">
								{memberName ?? `${memberName} 알림장 작성`}
							</span>
							<span className="text-sm text-gray-600">
								{editTarget ? '알림장 수정' : '새 알림장 작성'}
							</span>
						</div>
						<button type="button" onClick={handleClose}
							className="text-gray-500 hover:text-gray-700 transition-colors text-xl leading-none px-2 py-1">
							<X size={20} />
						</button>
					</div>

					{/* ── 바디 2컬럼 ───────────────────────────────── */}
					<form onSubmit={handleSubmit} className="flex flex-1 min-h-0 overflow-hidden">

						{/* 왼쪽: 날짜/메모/태그/영상 */}
						<div className="flex flex-col gap-6 px-6 py-5 overflow-y-auto flex-[4] border-r border-gray-100">

							{/* 날짜 */}
							<div className="flex gap-4">
								<div className="flex flex-col gap-1.5 flex-1">
									<label className="text-xs font-semibold text-gray-500">운동 시작일</label>
									<label htmlFor="note-start-date"
										className="relative flex cursor-pointer  transition-colors bg-white">
										{/* <span className="text-sm text-gray-800">{formatDisplayDate(startDate)}</span> */}

										<input id="note-start-date" type="date" value={startDate}
											onChange={e => handleStartDateChange(e.target.value)} className="flex-1 m-input pl-8" />
										<Calendar size={16} className='absolute text-gray-500 left-2' style={{ top: '50%', transform: ' translateY(-50%)' }} />
									</label>
									<p className="text-[11px] text-primary">· 시작일은 오늘 날짜로 자동 설정 돼요. 수정할 수 있어요</p>
								</div>

								<div className="flex flex-col gap-1.5 flex-1">
									<label className="text-xs font-semibold text-gray-500">운동 마지막일</label>
									<label htmlFor="note-end-date"
										className="relative flex cursor-pointer transition-colors bg-white">
										{/* <span className="text-sm text-gray-800">{formatDisplayDate(endDate)}</span> */}

										<input id="note-end-date" type="date" value={endDate} min={startDate}
											onChange={e => setEndDate(e.target.value)} className="flex-1  m-input pl-8" />
										<Calendar size={16} className='absolute text-gray-500 left-2' style={{ top: '50%', transform: ' translateY(-50%)' }} />
									</label>
									<p className="text-[11px] text-primary">· 운동 마지막일이 없으면 수행 기간은 시작일을 기준으로 하는 한 주가 자동으로 설정돼요.</p>
									<p className="text-[11px] text-primary">예) 시작일 3/1인데 마지막일 설정을 안 한 경우, 마지막일은 3/7로 자동설정됩니다</p>
								</div>
							</div>

							{/* 운동 방향 메모 */}
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-gray-500">
									운동 방향 메모 <span className="font-normal text-gray-400">(선택)</span>
								</label>
								<textarea
									className="w-full  m-input transition-colors"
									rows={4} placeholder="이번 주 운동 방향을 작성해주세요"
									value={content} onChange={e => setContent(e.target.value)}
								/>
							</div>

							{/* 추천 운동 태그 */}
							<div className="flex flex-col gap-2">
								<label className="text-xs font-semibold text-gray-500">
									추천 운동 태그 <span className="font-normal text-gray-400">영상 추천 키워드</span>
								</label>
								{tags.length > 0 ? (
									<div className="flex flex-wrap gap-1.5 p-2.5 border border-gray-200 rounded-xl min-h-[44px]">
										{tags.map(t => (
											<span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary text-xs font-medium rounded-full border border-green-900/20">
												{t}
												<button type="button" onClick={() => setTags(p => p.filter(x => x !== t))}
													className="text-gray-700  leading-none"><X size={14} /></button>
											</span>
										))}
									</div>
								) : (
									<div className="p-2.5 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 text-center">
										추가한 태그는 유튜브 영상 추천에 사용됩니다
									</div>
								)}
								<p className="text-xs font-semibold text-gray-400">기본 추천 태그</p>
								<div className="flex flex-wrap gap-1.5">
									{DEFAULT_TAGS.map(t => {
										const isSel = tags.includes(t)
										return (
											<button key={t} type="button"
												onClick={() => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])}
												className="flex flex-nowrap items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-all  "
												style={{
													background: isSel ? 'rgba(11,180,137,0.08)' : 'white',
													borderColor: isSel ? '#0bb489' : '#e5e7eb',
													color: isSel ? '#0bb489' : '#6b7280',
												}}>
												{isSel ? <Check size={12} /> : <Plus size={12} />}{t}
											</button>
										)
									})}
								</div>
								<div className="flex gap-2">
									<input
										className="flex-1  m-input  transition-colors"
										placeholder="직접 태그 입력 후 엔터 키"
										value={tagInput} onChange={e => setTagInput(e.target.value)}
										onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
									/>
									<button type="button" onClick={addTag}
										className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors">
										추가
									</button>
								</div>
							</div>

							{/* 추천 영상 */}
							<div className="flex flex-col gap-2">
								<label className="text-xs font-semibold text-gray-500">
									추천 영상 <span className="font-normal text-gray-400">· 최대 5개 · 회원 추천영상 탭에 표시됩니다</span>
								</label>
								<NoteVideoSelector
									videos={videos} onChange={setVideos} defaultQuery={defaultVideoQuery}
									suggestedWorkouts={Object.values(dayWorkouts).flat().filter(w => w?.workout_type)
										.map(w => WORKOUT_TYPE_LABELS[w.workout_type!]).filter((v, i, a) => a.indexOf(v) === i)}
									suggestedTags={tags}
								/>
							</div>
						</div>

						{/* 오른쪽: 운동할 날 선택 + 운동 목록 */}
						<div className="flex flex-col flex-[5] min-h-0 overflow-y-auto px-6 py-5 gap-5 bg-gray-50">

							{/* 운동할 날 선택 */}
							<div className="flex flex-col gap-2">
								<label className="text-xs font-semibold text-gray-500">운동할 날 선택</label>
								<div className="flex gap-2 flex-wrap">
									{/* 매일 */}
									<button type="button" onClick={() => toggleDate('매일')}
										className="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
										style={{
											background: selectedDates.includes('매일') ? 'rgba(11,180,137,0.08)' : 'white',
											borderColor: selectedDates.includes('매일') ? '#0bb489' : '#e5e7eb',
											color: selectedDates.includes('매일') ? '#0bb489' : '#6b7280',
										}}>
										매일
									</button>

									{/* 시작일~종료일 날짜 칩 */}
									{dateRange.map(date => {
										const isSelected = selectedDates.includes(date)
										return (
											<button key={date} type="button" onClick={() => toggleDate(date)}
												className="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
												style={{
													background: isSelected ? 'rgba(11,180,137,0.08)' : 'white',
													borderColor: isSelected ? '#0bb489' : '#e5e7eb',
													color: isSelected ? '#0bb489' : '#6b7280',
												}}>
												{formatChipLabel(date)}
											</button>
										)
									})}
								</div>
							</div>

							{/* 날짜별 운동 섹션 */}
							<div className="flex flex-col gap-3">
								{activeDates.map(date => (
									<DaySection
										key={date}
										day={date}
										items={dayWorkouts[date] ?? null}
										previousItems={getPreviousItems(date)}
										onUpdate={items => setDayWorkouts(dw => ({ ...dw, [date]: items }))}
										onAddWorkout={() =>
											setDayWorkouts(dw => ({ ...dw, [date]: [...(dw[date] ?? []), newItem()] }))}
										onRemoveWorkout={localId =>
											setDayWorkouts(dw => ({
												...dw,
												[date]: (dw[date] ?? []).filter(w => w.localId !== localId),
											}))}
									/>
								))}
							</div>
						</div>
					</form>

					{/* ── 하단 버튼 ─────────────────────────────────── */}
					<div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white shrink-0">
						{totalMetsDisplay && (
							<span className="text-xs text-gray-400">
								총 <span className="font-semibold text-primary">{totalMetsDisplay}</span> METs
							</span>
						)}
						<div className="flex gap-3 ml-auto">
							<button type="button" onClick={handleClose}
								className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
								취소
							</button>
							<button type="button" onClick={handleSubmit} disabled={loading}
								className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
								style={{ background: loading ? '#9ca3af' : '#0bb489' }}>
								{loading ? '저장 중...' : editTarget ? '수정 완료' : '저장'}
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
