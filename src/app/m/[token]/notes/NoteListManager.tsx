// src/app/m/[token]/notes/NoteListManager.tsx
// 알림장탭 클라이언트 컴포넌트
// page.tsx(서버)에서 받은 initialNotes를 상태로 관리
// 최근 알림장의 운동 완료 토글 → workout_logs insert/delete (단일 진실 공급원)
// note_workout_completions 미사용
//
// [수정 내용]
//   1. 낙관적 업데이트 버그 수정
//      기존: i.id === workoutId 만 비교 → '전체' 타입에서 모든 요일 동시 체크 버그
//      수정: i.id === workoutId && i.dayDate === item.dayDate 둘 다 일치해야 체크
//
//   2. 완료 취소(delete) 버그 수정
//      기존: note_workout_id만으로 삭제 → 다른 날짜 기록도 삭제되는 버그
//      수정: .eq('logged_at', loggedAt) 조건 추가
//
//   3. 미래 날짜 체크 차단
//      showToast 상태 추가 — NoteCard의 onFutureCheck 콜백으로 연결
//      FutureCheckToast 컴포넌트로 3초간 토스트 표시

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import { PageHeader } from '@/components/member/PageHeader'
import NoteCard from '@/components/member//NoteCard'
import type { NoteCardData } from '@/components/member//NoteCard'
import type { NoteWorkoutItemData } from '@/components/member/NoteWorkoutItem'
import FutureCheckToast from '@/components/member/ui/FutureCheckToast'

import { WORKOUT_METS_BY_INTENSITY } from '@/types/database'
import type { Intensity } from '@/types/database'

interface Props {
	memberId: string
	initialNotes: NoteCardData[]
	latestIdx: number
}

export default function NoteListManager({ memberId, initialNotes, latestIdx }: Props) {
	const router = useRouter()
	const [notes, setNotes] = useState<NoteCardData[]>(initialNotes)
	const [showToast, setShowToast] = useState(false)

	// 미래 날짜 체크 시도 시 토스트 표시
	const handleFutureCheck = useCallback(() => {
		setShowToast(true)
	}, [])

	async function handleToggle(workoutId: string, completed: boolean, item: NoteWorkoutItemData) {
		const supabase = createClient()
		const today = new Date().toISOString().split('T')[0]
		const loggedAt = item.dayDate ?? today

		// [버그 수정] workoutId + dayDate 둘 다 일치해야 체크
		setNotes(prev =>
			prev.map((note, idx) => {
				if (idx !== latestIdx) return note
				return {
					...note,
					daySections: note.daySections.map(section => ({
						...section,
						items: section.items.map(i =>
							(i.id === workoutId && i.dayDate === item.dayDate)
								? { ...i, completed }
								: i
						),
					})),
				}
			})
		)

		if (completed) {
			const { error } = await supabase
				.from('workout_logs')
				.insert({
					member_id: memberId,
					logged_at: loggedAt,
					workout_type: item.workoutType,
					duration_min: item.durationMin,
					prescribed_duration_min: item.durationMin,
					mets_score: WORKOUT_METS_BY_INTENSITY[item.workoutType][item.intensity],  // ← 변경
					source: 'routine',
					note_workout_id: workoutId,
					activity_type: null,
					condition_memo: null,
				})

			if (error) {
				console.error('완료 처리 실패:', error)
				setNotes(initialNotes)
			}
		} else {
			// [버그 수정] logged_at 조건 추가 → 해당 날짜 기록만 삭제
			const { error } = await supabase
				.from('workout_logs')
				.delete()
				.eq('note_workout_id', workoutId)
				.eq('member_id', memberId)
				.eq('source', 'routine')
				.eq('logged_at', loggedAt)

			if (error) {
				console.error('완료 취소 실패:', error)
				setNotes(initialNotes)
			}
		}

		router.refresh()
	}

	return (
		<>
			<PageHeader title="알림장" count={notes.length} unit="개" />

			<div className="flex flex-col gap-[16px] pb-[32px]">
				{notes.map((note, idx) => (
					<NoteCard
						key={note.id}
						note={note}
						isLatest={idx === latestIdx}
						onToggle={idx === latestIdx ? handleToggle : undefined}
						onFutureCheck={idx === latestIdx ? handleFutureCheck : undefined}
					/>
				))}
			</div>

			{/* 미래 날짜 체크 시도 시 토스트 */}
			<FutureCheckToast
				visible={showToast}
				onHide={() => setShowToast(false)}
			/>
		</>
	)
}
