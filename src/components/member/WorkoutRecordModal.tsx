// src/components/member/WorkoutRecordModal.tsx
// Figma: 섹션 "오늘의 운동" > Dialog-새 운동 기록 (18:17695)
// add / edit 두 모드 공용
// isRoutine=true: 알림장 운동 수정 — 운동종류/강도 읽기전용, 처방시간 표시
// embeddedMode=true: BottomSheet/ModalHeader 없이 콘텐츠만 렌더링 (탭 안에 삽입 시)

'use client'

import { useEffect, useState } from 'react'
import {
	WORKOUT_TYPE_LABELS,
	WORKOUT_METS_BY_INTENSITY,
	INTENSITY_LABELS
} from '@/types/database'
import type { WorkoutType, Intensity } from '@/types/database'
import BottomSheet from './ui/BottomSheet'
import ModalHeader from './ui/ModalHeader'
import ModalContents from './ui/ModalContents'
import WorkoutTypeIcon from './ui/WorkoutTypeIcon'

import { toLocalISO, formatDisplayDate } from '@/lib/weekUtils'

// ─── 상수 ──────────────────────────────────────────────────────

const WORKOUT_TYPES = Object.keys(WORKOUT_TYPE_LABELS) as WorkoutType[]

const INTENSITY_OPTIONS: { value: Intensity; label: string }[] = (
	['recovery', 'normal', 'high'] as Intensity[]
).map((value) => ({
	value,
	label: INTENSITY_LABELS[value],
}))


// ─── 타입 ──────────────────────────────────────────────────────

interface SaveData {
	workout_type: WorkoutType
	intensity: string
	duration_min: number
	logged_at?: string
	condition_memo?: string
}

interface Props {
	mode: 'add' | 'edit'
	isRoutine?: boolean
	embeddedMode?: boolean   // ← 추가: true면 BottomSheet/헤더 없이 콘텐츠만
	initialData?: {
		workout_type?: WorkoutType
		intensity?: string
		logged_at?: string
		duration_min?: number
		prescribed_duration_min?: number
		condition_memo?: string | null
	}
	onSave: (data: SaveData) => Promise<void>
	onClose: () => void
}

// ─── 내부 콘텐츠 컴포넌트 ──────────────────────────────────────

function WorkoutRecordContents({
	mode,
	isRoutine,
	embeddedMode,
	initialData,
	onSave,
	onClose,
}: Props) {
	const [workoutType, setWorkoutType] = useState<WorkoutType>(
		initialData?.workout_type ?? 'strength'
	)
	const [intensity, setIntensity] = useState<Intensity>(
		(initialData?.intensity as Intensity) ?? 'normal'
	)
	const [loggedAt, setLoggedAt] = useState(
		initialData?.logged_at ?? toLocalISO(new Date())
	)
	const [duration, setDuration] = useState(String(initialData?.duration_min ?? ''))
	const [memo, setMemo] = useState(initialData?.condition_memo ?? '')
	const [saving, setSaving] = useState(false)

	const prescribedMin = initialData?.prescribed_duration_min ?? null

	useEffect(() => {
		if (initialData) {
			setWorkoutType(initialData.workout_type ?? 'strength')
			setIntensity((initialData.intensity as Intensity) ?? 'normal')
			setLoggedAt(initialData.logged_at ?? toLocalISO(new Date()))
			setDuration(String(initialData.duration_min ?? ''))
			setMemo(initialData.condition_memo ?? '')
		}
	}, [initialData])

	const durationNum = Number(duration)
	const metsScore = WORKOUT_METS_BY_INTENSITY[workoutType][intensity]
	const totalMets = duration && durationNum > 0
		? Math.round(metsScore * durationNum)
		: 0

	const isValid = !!duration && durationNum > 0

	async function handleSave() {
		if (!isValid) return
		setSaving(true)
		await onSave({
			workout_type: workoutType,
			intensity,
			duration_min: durationNum,
			logged_at: loggedAt,
			condition_memo: memo || undefined,
		})
		setSaving(false)
	}

	const contents = (
		<>
			{/* ── 운동 종류 ── */}
			{!isRoutine ? (
				<div className="flex flex-col gap-1.5">
					<label className="m-label">운동 종류</label>
					<div className="grid grid-cols-3 gap-[4px]">
						{WORKOUT_TYPES.map(type => {
							const isActive = workoutType === type
							return (
								<button
									key={type}
									type="button"
									onClick={() => setWorkoutType(type)}
									className="flex flex-col items-center justify-center gap-[2px] p-[12px] rounded-[12px] transition-all"
									style={{
										backgroundColor: isActive ? '#e6faf5' : '#ffffff',
										border: `1px solid ${isActive ? 'rgba(11,180,137,0.7)' : '#e5e7eb'}`,
									}}
								>
									<WorkoutTypeIcon workoutType={type} size={46} />
									<span
										className="text-[14px] leading-[20px] w-full text-center truncate mt-2"
										style={{ color: isActive ? '#099970' : '#364153' }}
									>
										{WORKOUT_TYPE_LABELS[type]}
									</span>
								</button>
							)
						})}
					</div>
				</div>
			) : (
				<div className="flex flex-col gap-1.5">
					<label className="m-label">운동 종류</label>
					<div
						className="m-input flex items-center gap-3"
						style={{ backgroundColor: '#f5f5f5', color: '#364153', cursor: 'default' }}
					>
						<WorkoutTypeIcon workoutType={workoutType} size={28} />
						<span>{WORKOUT_TYPE_LABELS[workoutType]}</span>
					</div>
				</div>
			)}

			{/* ── 운동 강도 ── */}
			{!isRoutine ? (
				<div className="flex flex-col gap-1.5">
					<label className="m-label">운동 강도</label>
					<div className="flex gap-[4px]">
						{INTENSITY_OPTIONS.map(opt => {
							const isActive = intensity === opt.value
							return (
								<button
									key={opt.value}
									type="button"
									onClick={() => setIntensity(opt.value)}
									className="flex-1 py-[12px] rounded-[12px] text-[14px] transition-all"
									style={{
										backgroundColor: isActive ? '#e6faf5' : '#ffffff',
										border: `1px solid ${isActive ? 'rgba(11,180,137,0.7)' : '#e5e7eb'}`,
										color: isActive ? '#099970' : '#364153',
									}}
								>
									{opt.label}
								</button>
							)
						})}
					</div>
				</div>
			) : (
				<div className="flex flex-col gap-1.5">
					<label className="m-label">운동 강도</label>
					<div
						className="m-input"
						style={{ backgroundColor: '#f5f5f5', color: '#364153', cursor: 'default' }}
					>
						{INTENSITY_OPTIONS.find(o => o.value === intensity)?.label ?? intensity}
					</div>
				</div>
			)}

			{/* ── 날짜 ── */}
			<div className="flex flex-col gap-1.5">
				<label className="m-label">날짜</label>
				{mode === 'edit' ? (
					<div
						className="m-input flex items-center justify-between select-none"
						style={{ backgroundColor: '#f5f5f5', color: '#364153', cursor: 'default' }}
					>
						<span>{formatDisplayDate(loggedAt)}</span>
						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 opacity-40">
							<rect x="1.5" y="3" width="15" height="13.5" rx="2" stroke="#62748E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
							<path d="M1.5 7.5H16.5" stroke="#62748E" strokeWidth="1.5" strokeLinecap="round" />
							<path d="M6 1.5V4.5" stroke="#62748E" strokeWidth="1.5" strokeLinecap="round" />
							<path d="M12 1.5V4.5" stroke="#62748E" strokeWidth="1.5" strokeLinecap="round" />
						</svg>
					</div>
				) : (
					<label
						htmlFor="workout-date"
						className="m-input flex items-center justify-between cursor-pointer"
					>
						<span className="text-[#364153]">{formatDisplayDate(loggedAt)}</span>
						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
							<rect x="1.5" y="3" width="15" height="13.5" rx="2" stroke="#62748E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
							<path d="M1.5 7.5H16.5" stroke="#62748E" strokeWidth="1.5" strokeLinecap="round" />
							<path d="M6 1.5V4.5" stroke="#62748E" strokeWidth="1.5" strokeLinecap="round" />
							<path d="M12 1.5V4.5" stroke="#62748E" strokeWidth="1.5" strokeLinecap="round" />
						</svg>
						<input
							id="workout-date"
							type="date"
							value={loggedAt}
							onChange={e => setLoggedAt(e.target.value)}
							className="sr-only"
						/>
					</label>
				)}
			</div>

			{/* ── 운동 시간 ── */}
			<div className="flex flex-col gap-1.5">
				<label className="m-label">
					{isRoutine && prescribedMin
						? `실제 운동 시간 (분) — 알림장 처방: ${prescribedMin}분`
						: '운동 시간 (분)'}
				</label>
				<div className="grid grid-cols-3 gap-2">
					<div className="col-span-2">
						<input
							className="m-input w-full"
							type="number"
							inputMode="numeric"
							min={1}
							max={300}
							placeholder={prescribedMin ? String(prescribedMin) : '예: 40'}
							value={duration}
							onChange={e => setDuration(e.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<div
							className="m-input select-none"
							style={{ backgroundColor: '#f5f5f5', color: '#364153', cursor: 'default' }}
						>
							{totalMets || '-'}
						</div>
					</div>
				</div>
				{isRoutine && prescribedMin && (
					<p className="text-xs text-gray-400">
						처방 시간과 다를 경우 기록탭에서 취소선으로 표시돼요
					</p>
				)}
			</div>

			{/* ── 컨디션 메모 ── */}
			<div className="flex flex-col gap-1.5">
				<label className="m-label">컨디션 메모 (선택)</label>
				<textarea
					className="m-input"
					placeholder="예: 허리가 약간 뻐근했어요"
					value={memo}
					onChange={e => setMemo(e.target.value)}
					rows={3}
					style={{ resize: 'none', lineHeight: '1.5' }}
				/>
			</div>
		</>
	)

	// ── 하단 버튼 ──────────────────────────────────────────────
	const footer = (
		<div
			className="grid grid-cols-3 gap-2 px-5 py-4 shrink-0"
			style={{ borderTop: '1px solid #e2e8f0' }}
		>
			<button
				type="button"
				onClick={onClose}
				className="col-span-1 px-[16px] py-[12px] rounded-[8px] text-[14px] font-medium text-[#364153]"
				style={{ backgroundColor: '#f1f5f9' }}
			>
				취소
			</button>
			<button
				type="button"
				className="btn-primary col-span-2"
				style={{
					borderRadius: '8px',
					padding: '12px 16px',
					opacity: saving || !isValid ? 0.5 : 1,
				}}
				onClick={handleSave}
				disabled={saving || !isValid}
			>
				{saving
					? '저장 중...'
					: mode === 'add' ? '추가 운동 등록' : '수정 저장'
				}
			</button>
		</div>
	)

	// ── embeddedMode: 래퍼 없이 콘텐츠만 ──────────────────────
	if (embeddedMode) {
		return (
			<>
				<div className="flex-1 overflow-y-auto min-h-0">
					<ModalContents>{contents}</ModalContents>
				</div>
				{footer}
			</>
		)
	}

	// ── 일반 모드: BottomSheet + ModalHeader 포함 ──────────────
	const title = mode === 'add' ? '새 운동 기록' : '운동 기록 수정'
	const subtitle = mode === 'add'
		? '오늘 하루 추가로 한 운동을 기록해요'
		: isRoutine
			? '실제로 운동한 시간을 수정해요'
			: '기록된 운동 정보를 수정해요'

	return (
		<BottomSheet onClose={onClose}>
			<ModalHeader title={title} subtitle={subtitle} onClose={onClose} />
			<div className="flex-1 overflow-y-auto min-h-0">
				<ModalContents>{contents}</ModalContents>
			</div>
			{footer}
		</BottomSheet>
	)
}

export default function WorkoutRecordModal(props: Props) {
	return <WorkoutRecordContents {...props} />
}
