// src/components/member/NoteListManager.tsx
// 알림장탭 클라이언트 컴포넌트
// page.tsx(서버)에서 받은 initialNotes를 상태로 관리
// 최근 알림장의 운동 완료 토글 → workout_logs insert/delete (단일 진실 공급원)
// note_workout_completions 미사용

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import { PageHeader } from '@/components/member/PageHeader'
import NoteCard from '@/components/member//NoteCard'
import type { NoteCardData } from '@/components/member//NoteCard'
import type { NoteWorkoutItemData } from '@/components/member/NoteWorkoutItem'

interface Props {
	memberId: string
	initialNotes: NoteCardData[]
	latestIdx: number   // 오늘이 포함된 주차 카드 인덱스 (-1이면 없음)
}

export default function NoteListManager({ memberId, initialNotes, latestIdx }: Props) {
	const router = useRouter()
	const [notes, setNotes] = useState<NoteCardData[]>(initialNotes)

	// 오늘 포함 주차 카드(latestIdx)만 토글 가능
	// completed=true  → note_workout_completions + workout_logs insert
	// completed=false → note_workout_completions + workout_logs delete
	async function handleToggle(workoutId: string, completed: boolean, item: NoteWorkoutItemData) {
		const supabase = createClient()
		const today = new Date().toISOString().split('T')[0]
		// 체크한 운동의 실제 날짜 사용 — 과거 요일 운동을 오늘 체크해도 해당 날짜로 기록
		const loggedAt = item.dayDate ?? today

		// 낙관적 업데이트 — 먼저 UI 반영
		setNotes(prev =>
			prev.map((note, idx) => {
				if (idx !== latestIdx) return note  // 현재 주차 카드만 토글 가능
				return {
					...note,
					daySections: note.daySections.map(section => ({
						...section,
						items: section.items.map(i =>
							i.id === workoutId ? { ...i, completed } : i
						),
					})),
				}
			})
		)

		if (completed) {
			// ── 완료 처리 — workout_logs insert ───────────────────────
			const { error } = await supabase
				.from('workout_logs')
				.insert({
					member_id: memberId,
					logged_at: loggedAt,  // 운동한 요일의 실제 날짜
					workout_type: item.workoutType,
					duration_min: item.durationMin,
					prescribed_duration_min: item.durationMin,
					mets_score: item.mets,
					source: 'routine',
					note_workout_id: workoutId,
					activity_type: null,
					condition_memo: null,
				})

			if (error) {
				console.error('완료 처리 실패:', error)
				setNotes(initialNotes)  // 실패 시 UI 롤백
			}
		} else {
			// ── 완료 취소 — workout_logs delete ───────────────────────
			const { error } = await supabase
				.from('workout_logs')
				.delete()
				.eq('note_workout_id', workoutId)
				.eq('member_id', memberId)
				.eq('source', 'routine')

			if (error) {
				console.error('완료 취소 실패:', error)
				setNotes(initialNotes)  // 실패 시 UI 롤백
			}
		}

		router.refresh()
	}

	return (
		<>
			{/* 페이지 헤더 */}
			<PageHeader title="알림장" count={notes.length} unit="개" />

			{/* 알림장 목록 */}
			<div className="flex flex-col gap-[16px] pb-[32px]">
				{notes.map((note, idx) => (
					<NoteCard
						key={note.id}
						note={note}
						isLatest={idx === latestIdx}
						onToggle={idx === latestIdx ? handleToggle : undefined}
					/>
				))}
			</div>
		</>
	)
}
