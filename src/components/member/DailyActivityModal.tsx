// src/components/member/DailyActivityModal.tsx
// 일상생활 활동 선택 BottomSheet
// Figma: Dialog-일상생활활동추가
// embeddedMode=true: BottomSheet 없이 콘텐츠만 렌더링 (탭 안에 삽입 시)

'use client'

import { useState } from 'react'
import BottomSheet from './ui/BottomSheet'
import DailyActivityDurationModal from './DailyActivityDurationModal'
import DailyActivityModalItem from './DailyActivityModalItem'

import {
	ALL_DAILY_ACTIVITY_OPTIONS,
	DAILY_ACTIVITY_CATEGORIES,
	type DailyActivityOption,
	type DailyActivityCategory,
} from '@/data/dailyActivityOptions'

// ── Props ─────────────────────────────────────────────────────

interface Props {
	excludeTypes: string[]
	onAdd: (option: DailyActivityOption, durationMin: number) => void
	onClose: () => void
	embeddedMode?: boolean  // ← 추가: true면 BottomSheet 없이 콘텐츠만
}

// ── 컴포넌트 ─────────────────────────────────────────────────

export default function DailyActivityModal({ excludeTypes, onAdd, onClose, embeddedMode }: Props) {
	const [tab, setTab] = useState<DailyActivityCategory>('전체')
	const [selected, setSelected] = useState<DailyActivityOption | null>(null)

	const filtered = ALL_DAILY_ACTIVITY_OPTIONS.filter(o =>
		(tab === '전체' || o.category === tab) &&
		!excludeTypes.includes(o.activity_type)
	)

	function handleSelectActivity(option: DailyActivityOption) {
		setSelected(option)
	}

	function handleBackToList() {
		setSelected(null)
	}

	function handleConfirm(option: DailyActivityOption, durationMin: number) {
		onAdd(option, durationMin)
	}

	// ── 공통 콘텐츠 (카테고리 탭 + 목록) ──────────────────────
	const listContents = (
		<>
			{/* 카테고리 탭 */}
			<div className="flex gap-1.5 px-5 pb-3 overflow-x-auto shrink-0">
				{DAILY_ACTIVITY_CATEGORIES.map(c => {
					const isActive = tab === c
					return (
						<button
							key={c}
							type="button"
							onClick={() => setTab(c)}
							className="shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-[8px] transition-all"
							style={{
								backgroundColor: isActive ? '#e6faf5' : '#fafafa',
								border: `1px solid ${isActive ? 'rgba(11,180,137,0.7)' : '#e5e7eb'}`,
								color: isActive ? '#099970' : '#4a5565',
							}}
						>
							{c}
						</button>
					)
				})}
			</div>

			<hr className="m-divider mx-5 shrink-0" />

			{/* 활동 목록 */}
			<div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2">
				{filtered.length === 0 ? (
					<p className="text-sm text-center py-8 text-[#7f847d]">
						추가할 활동이 없습니다.
					</p>
				) : (
					filtered.map(opt => (
						<DailyActivityModalItem
							key={opt.activity_type}
							option={opt}
							onSelect={handleSelectActivity}
						/>
					))
				)}
			</div>
		</>
	)

	// ── embeddedMode: 래퍼 없이 콘텐츠만 ──────────────────────
	// embeddedMode일 때 — onSelect를 onAdd로 연결
	if (embeddedMode) {
		return (
			<div className="pt-3 flex flex-col flex-1 overflow-hidden">
				{/* 카테고리 탭 */}
				<div className="flex gap-1.5 px-5 pb-3 overflow-x-auto shrink-0">
					{DAILY_ACTIVITY_CATEGORIES.map(c => {
						const isActive = tab === c
						return (
							<button
								key={c}
								type="button"
								onClick={() => setTab(c)}
								className="shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-[8px] transition-all"
								style={{
									backgroundColor: isActive ? '#e6faf5' : '#fafafa',
									border: `1px solid ${isActive ? 'rgba(11,180,137,0.7)' : '#e5e7eb'}`,
									color: isActive ? '#099970' : '#4a5565',
								}}
							>
								{c}
							</button>
						)
					})}
				</div>

				<hr className="m-divider mx-5 shrink-0" />

				{/* 활동 목록 — onSelect 시 onAdd로 직접 연결 */}
				<div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2">
					{filtered.length === 0 ? (
						<p className="text-sm text-center py-8 text-[#7f847d]">
							추가할 활동이 없습니다.
						</p>
					) : (
						filtered.map(opt => (
							<DailyActivityModalItem
								key={opt.activity_type}
								option={opt}
								onSelect={(option) => onAdd(option, 0)}  // ← 여기가 핵심
							/>
						))
					)}
				</div>
			</div>
		)
	}

	// ── 일반 모드: BottomSheet 포함 ───────────────────────────
	return (
		<>
			<BottomSheet onClose={onClose}>
				{/* 헤더 */}
				<div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
					<p className="text-[16px] font-medium text-[#1d211c]">
						활동 선택
					</p>
					<button
						type="button"
						onClick={onClose}
						className="opacity-70 hover:opacity-100 transition-opacity"
						aria-label="닫기"
					>
						<svg width="20" height="20" viewBox="0 0 11.5 11.5" fill="none">
							<path
								d="M10.75 0.75004L0.750042 10.75M0.75 0.75L10.75 10.75"
								stroke="#020618"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="1.5"
							/>
						</svg>
					</button>
				</div>

				{listContents}
			</BottomSheet>

			{/* 수행시간 입력 중앙 모달 */}
			{selected && (
				<DailyActivityDurationModal
					option={selected}
					onConfirm={handleConfirm}
					onBack={handleBackToList}
					onClose={handleBackToList}
				/>
			)}
		</>
	)
}

export type { DailyActivityOption }
