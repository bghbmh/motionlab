'use client'

// src/components/admin/record/MemberRecordSection.tsx
// 회원 정보 기록 탭 — 기본정보 · 운동통계 · 알림장통계 · 인바디변화 · 생활패턴 · PWA · 앱접속이력

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Member, WorkoutLog, Note, InbodyRecord, WorkoutType, DailyActivity } from '@/types/database'
import { WORKOUT_TYPE_LABELS } from '@/types/database'
import { User, Dumbbell, BookOpen, BarChart2, Activity, Smartphone, X, Pencil, Trash2, ChevronRight, ArrowLeft, Dot } from 'lucide-react'
import { ALL_DAILY_ACTIVITY_OPTIONS, DAILY_ACTIVITY_CATEGORIES, type DailyActivityOption, type DailyActivityCategory } from '@/data/dailyActivityOptions'
import { toLocalISO, formatDate as formatDateUtil, DAY_MAP, DAY_KO_SHORT } from '@/lib/weekUtils'

// ─── 타입 ────────────────────────────────────────────────────────
interface NoteWithWorkoutIds extends Pick<Note, 'id' | 'is_sent' | 'written_at'> {
	note_workouts: { id: string }[]  // 실제 쿼리에서 가져오는 것만
}

interface NoteCompletion {
	id: string
	note_workout_id: string
}

interface AppSession {
	id: string
	opened_at: string
	user_agent: string | null
}

interface PushSub {
	id: string
	created_at: string
}
// MemberRecordSection.tsx 상단 타입 영역에 추가
// UI 전용 — 저장 전 임시 상태용 (member_id, created_at은 저장 시 서버에서 처리)
interface LocalActivity extends Omit<DailyActivity, 'member_id' | 'created_at' | 'paper_code'> {
	paper_code?: string | null  // 목록 선택 시에만 있고, 직접 입력 시엔 없음
}

interface Props {
	member: Member
	workoutLogs: Pick<WorkoutLog, 'id' | 'logged_at' | 'workout_type' | 'duration_min' | 'mets_score'>[]
	notes: NoteWithWorkoutIds[]
	noteCompletions: NoteCompletion[]
	inbodyRecords: Pick<InbodyRecord, 'id' | 'measured_at' | 'weight' | 'muscle_mass' | 'body_fat_pct' | 'visceral_fat'>[]
	activities: DailyActivity[]
	sessions: AppSession[]
	pushSubs: PushSub[]
}

// ─── 유틸 ────────────────────────────────────────────────────────
function formatDate(dateStr: string | null) {
	if (!dateStr) return '—'
	return formatDateUtil(dateStr)
}

function formatDateTime(isoStr: string) {
	const d = new Date(isoStr)
	const yy = String(d.getFullYear()).slice(2)
	const mm = String(d.getMonth() + 1).padStart(2, '0')
	const dd = String(d.getDate()).padStart(2, '0')
	const hh = String(d.getHours()).padStart(2, '0')
	const min = String(d.getMinutes()).padStart(2, '0')
	return `${yy}.${mm}.${dd} ${hh}:${min}`
}

function parseUserAgent(ua: string | null): string {
	if (!ua) return '알 수 없음'
	if (ua.includes('iPhone')) return '📱 iPhone'
	if (ua.includes('Android')) return '📱 Android'
	if (ua.includes('iPad')) return '📟 iPad'
	if (ua.includes('Mac')) return '💻 Mac'
	if (ua.includes('Windows')) return '🖥️ Windows'
	return '기타'
}

function daysBetween(a: string, b: string) {
	return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24))
}

// ─── 요일 유틸 ──────────────────────────────────────────────────────
const DAYS_OPTIONS = ['매일', ...DAY_KO_SHORT.slice(1), DAY_KO_SHORT[0]] as const  // 매일, 월~토, 일

/** selected_days → 표시 문자열. 예: ['금','월','수'] → '주 3일 (월·수·금)' */
function formatSelectedDays(selected: string[] | null): string {
	if (!selected || selected.length === 0) return '—'
	if (selected.includes('매일')) return '주 7일 (매일)'
	const sorted = [...selected].sort((a, b) => (DAY_MAP[a] ?? 9) - (DAY_MAP[b] ?? 9))
	return `주 ${sorted.length}일 (${sorted.join('·')})`
}

/** selected_days → frequency_per_week 숫자 */
function calcFrequency(selected: string[]): number {
	if (selected.includes('매일')) return 7
	return selected.length
}

/** 직접 입력 항목용 커스텀 paper_code 생성. 예: CUSTOM_PAPER_001 */
function generateCustomPaperCode(activities: LocalActivity[]): string {
	const nums = activities
		.map(a => a.paper_code)
		.filter((c): c is string => c?.startsWith('CUSTOM_PAPER_') ?? false)
		.map(c => parseInt(c.replace('CUSTOM_PAPER_', ''), 10))
		.filter(n => !isNaN(n))
	const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
	return `CUSTOM_PAPER_${String(next).padStart(3, '0')}`
}

// ─── 바텀시트 ────────────────────────────────────────────────────
function BottomSheet({
	open,
	onClose,
	title,
	children,
}: {
	open: boolean
	onClose: () => void
	title: string
	children: React.ReactNode
}) {
	return (
		<>
			{/* 오버레이 */}
			<div
				onClick={onClose}
				className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300
					${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
			/>
			{/* 시트 */}
			<div
				className={`fixed bottom-0 left-2/4 -translate-2/4 right-0 z-50 bg-white rounded-t-2xl
					border-t border-neutral-200 transition-transform duration-300 ease-out
					 h-[90dvh] w-full max-w-full xl:max-w-5xl flex flex-col
					${open ? 'translate-y-0' : 'translate-y-full'}`}
			>
				{/* 핸들 */}
				<div className="w-9 h-1 bg-neutral-300 rounded-full mx-auto mt-3 shrink-0" />
				{/* 헤더 */}
				<div className="flex items-center justify-between px-5 py-1 border-b border-neutral-100 shrink-0">
					<h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
					<button
						onClick={onClose}
						className="p-2 rounded-lg text-neutral-700 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
					>
						<X size={20} />
					</button>
				</div>
				{/* 컨텐츠 — 스크롤 가능 */}
				<div className="overflow-hidden flex-1  flex flex-col">
					{children}
				</div>
			</div>
		</>
	)
}

// ─── 섹션 래퍼 ───────────────────────────────────────────────────
function Section({
	icon,
	title,
	onEdit,
	children,
}: {
	icon: React.ReactNode
	title: string
	onEdit?: () => void
	children: React.ReactNode
}) {
	return (
		<div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
			<div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100">
				<span className="text-neutral-500">{icon}</span>
				<h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
				{onEdit && (
					<button
						onClick={onEdit}
						className="ml-auto flex items-center gap-1 text-xs text-neutral-500 px-2.5 py-1
							bg-neutral-50 border border-neutral-200 rounded-lg
							hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
					>
						<Pencil size={11} />
						수정
					</button>
				)}
			</div>
			<div className="p-4">{children}</div>
		</div>
	)
}

// 기본 정보 행
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex-1 min-w-25 flex items-start flex-row md:flex-col gap-0.5 py-2 px-2 bg-neutral-50 ">
			<span className="text-xs text-neutral-600 w-28 shrink-0 pt-0.5">{label}</span>
			<span className="text-sm text-neutral-800 flex-1">{value || '—'}</span>
		</div>
		// <div className="flex items-start gap-3 py-2 border-b border-neutral-50 last:border-b-0">
		// 	<span className="text-xs text-neutral-500 w-28 shrink-0 pt-0.5">{label}</span>
		// 	<span className="text-sm text-neutral-800 flex-1">{value || '—'}</span>
		// </div>
	)
}

// 통계 카드
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
	return (
		<div className="flex-1 min-w-25 bg-neutral-50 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
			<span className="text-xs text-neutral-600">{label}</span>
			<div className='flex items-end flex-wrap gap-x-2 gap-y-0'>
				<span className="text-base font-bold text-neutral-800 font-mono">{value}</span>
				{sub && <span className="text-[11px] text-neutral-500">{sub}</span>}
			</div>

		</div>
	)
}

// ─── 폼 공통 컴포넌트 ────────────────────────────────────────────
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-1.5">
			<label className="text-xs font-medium text-neutral-600">{label}</label>
			{children}
		</div>
	)
}


// ─── 기본 정보 수정 폼 ───────────────────────────────────────────
function MemberEditForm({ member, onClose }: { member: Member; onClose: () => void }) {

	const router = useRouter()

	const [form, setForm] = useState({
		name: member.name ?? '',
		phone: member.phone ?? '',
		birth_date: member.birth_date ?? '',
		sessions_per_week: member.sessions_per_week ?? 3,
		memo: member.memo ?? '',
	})

	const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
		setForm(prev => ({ ...prev, [key]: e.target.value }))

	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)

	const handleSave = () => {
		setError(null)
		startTransition(async () => {
			const supabase = createClient()
			const { error } = await supabase
				.from('members')
				.update({
					name: form.name,
					phone: form.phone || null,
					birth_date: form.birth_date || null,
					sessions_per_week: form.sessions_per_week,
					memo: form.memo || null,
				})
				.eq('id', member.id)
			if (error) { setError('저장에 실패했습니다.'); return }
			onClose()
		})
		router.refresh()
	}

	return (
		<>
			<div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
				<div className="grid grid-cols-2 gap-3">
					<FormField label="이름">
						<input className="m-input" value={form.name} onChange={set('name')} />
					</FormField>
					<FormField label="연락처">
						<input className="m-input" value={form.phone} onChange={set('phone')} placeholder="010-0000-0000" />
					</FormField>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<FormField label="생년월일">
						<input className="m-input" type="date" value={form.birth_date} onChange={set('birth_date')} />
					</FormField>
					<FormField label="주 수업 횟수">
						<input
							className="m-input"
							type="number"
							min={1}
							max={7}
							value={form.sessions_per_week}
							onChange={e => setForm(prev => ({ ...prev, sessions_per_week: Number(e.target.value) }))}
						/>
					</FormField>
				</div>
				<FormField label="특이사항">
					<textarea
						className={`m-input resize-none`}
						rows={3}
						value={form.memo}
						onChange={set('memo')}
						placeholder="특이사항을 입력하세요"
					/>
				</FormField>
			</div>
			<div className="px-5 pb-8 flex gap-2.5 border-t border-neutral-100 pt-4">
				<button
					onClick={onClose}
					className="flex-1 py-2.5 text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors"
				>
					취소
				</button>
				<button
					onClick={handleSave}
					className="flex-[2] py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors"
				>
					저장
				</button>
			</div>
		</>
	)
}

// ─── 활동 폼 공통 서브 컴포넌트 (중첩 금지 — 렌더링마다 재생성되면 포커스 끊김) ──

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
	return (
		<button onClick={onClick} className="flex items-center font-medium gap-1 text-xs text-primary px-5 pt-4 pb-1">
			<ArrowLeft size={16} /> {label}
		</button>
	)
}

function ActivityBottomActions({ onCancel, onSave, saveLabel, isPending, error }: {
	onCancel: () => void
	onSave: () => void
	saveLabel: string
	isPending: boolean
	error: string | null
}) {
	return (
		<div className="flex-none flex flex-col gap-1 px-5 pb-8 border-t border-neutral-100 pt-4">
			{error && <p className="text-xs text-red-500 mb-1">{error}</p>}
			<div className="flex gap-2.5">
				<button onClick={onCancel} disabled={isPending} className="flex-1 py-2.5 text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100 disabled:opacity-50 transition-colors">취소</button>
				<button onClick={onSave} disabled={isPending} className="flex-[2] py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors">
					{isPending ? '처리 중...' : saveLabel}
				</button>
			</div>
		</div>
	)
}

function DaySelector({ value, onChange }: {
	value: string[]
	onChange: (days: string[]) => void
}) {
	const toggleDay = (day: string) => {
		if (day === '매일') {
			onChange(value.includes('매일') ? [] : ['매일'])
			return
		}
		const withoutAll = value.filter(d => d !== '매일')
		if (withoutAll.includes(day)) {
			onChange(withoutAll.filter(d => d !== day))
		} else {
			const next = [...withoutAll, day]
			if (DAY_KO_SHORT.every(d => next.includes(d))) {
				onChange(['매일'])
			} else {
				onChange([...next].sort((a, b) => (DAY_MAP[a] ?? 9) - (DAY_MAP[b] ?? 9)))
			}
		}
	}
	return (
		<div>
			<div className="flex items-center mb-1.5">
				<label className="text-xs font-medium text-neutral-600">요일 선택</label>
				{value.length > 0 && (
					<><Dot size={12} /><p className="text-xs font-medium text-primary-600">{formatSelectedDays(value)}</p></>
				)}
			</div>
			<div className="flex flex-wrap gap-1.5">
				{DAYS_OPTIONS.map(day => {
					const isActive = value.includes(day) || (day !== '매일' && value.includes('매일'))
					return (
						<button
							key={day}
							type="button"
							onClick={() => toggleDay(day)}
							className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
								${isActive
									? 'bg-primary text-white border-primary'
									: 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
								}`}
						>
							{day}
						</button>
					)
				})}
			</div>
		</div>
	)
}

function ActivitySettingsForm({
	metsValue,
	durationMin: dur,
	selectedDays: days,
	note,
	onChangeDuration,
	onChangeDays,
	onChangeNote,
}: {
	metsValue: number
	durationMin: number
	selectedDays: string[]
	note: string
	onChangeDuration: (v: number) => void
	onChangeDays: (days: string[]) => void
	onChangeNote: (v: string) => void
}) {
	return (
		<>
			<FormField label="하루 몇 분">
				<input className="m-input" type="number" min={1} value={dur}
					onChange={e => onChangeDuration(Number(e.target.value))} />
			</FormField>
			<DaySelector value={days} onChange={onChangeDays} />
			<div className="flex items-center justify-between px-3 py-2.5 bg-primary-50 rounded-xl border border-primary-100">
				<span className="text-xs text-primary-600">주간 METs 예상</span>
				<span className="text-sm font-bold font-mono text-primary">
					{Math.round(metsValue * dur * calcFrequency(days)).toLocaleString()} METs/주
				</span>
			</div>
			<FormField label="메모 (선택)">
				<textarea rows={4} className="m-input" value={note}
					onChange={e => onChangeNote(e.target.value)}
					placeholder="추가 설명" />
			</FormField>
		</>
	)
}

// ─── 생활 패턴 수정 폼 ───────────────────────────────────────────
// step: list(항목 관리) | pick(활동 선택) | duration(시간 설정) | edit(기존 항목 수정)
type ActivityStep = 'list' | 'pick' | 'duration' | 'manual' | 'edit'

function ActivityEditForm({
	activities,
	memberId,
	onClose,
}: {
	activities: DailyActivity[]
	memberId: string
	onClose: () => void
}) {
	const router = useRouter()

	const supabase = createClient()
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [step, setStep] = useState<ActivityStep>('list')
	const [localActivities, setLocalActivities] = useState<LocalActivity[]>(activities)
	const [category, setCategory] = useState<DailyActivityCategory>('전체')
	const [pickedOption, setPickedOption] = useState<DailyActivityOption | null>(null)
	const [durationMin, setDurationMin] = useState(30)
	const [selectedDays, setSelectedDays] = useState<string[]>([])
	const [durationNote, setDurationNote] = useState('')   // duration step 메모
	const [editTarget, setEditTarget] = useState<LocalActivity | null>(null)
	// 새 항목 추가 탭: 'select'(목록 선택) | 'manual'(직접 입력)
	const [addTab, setAddTab] = useState<'select' | 'manual'>('select')
	const [manualForm, setManualForm] = useState({
		activity_label: '',
		mets_value: 3.5,
		duration_min_per_day: 30,
		selected_days: [] as string[],
		note: '',
	})

	const existingTypes = localActivities.map(a => a.activity_type)
	const filteredOptions = ALL_DAILY_ACTIVITY_OPTIONS.filter(o =>
		(category === '전체' || o.category === category) &&
		!existingTypes.includes(o.activity_type)
	)

	// ── 핸들러 ────────────────────────────────────────────────────
	const handlePickOption = (option: DailyActivityOption) => {
		setPickedOption(option)
		setDurationMin(30)
		setSelectedDays([])
		setDurationNote('')
		setStep('duration')
	}

	const handleAddSave = () => {
		if (!pickedOption || selectedDays.length === 0) return
		setError(null)
		startTransition(async () => {
			const { data, error } = await supabase
				.from('daily_activities')
				.insert({
					member_id: memberId,
					activity_type: pickedOption.activity_type,
					activity_label: pickedOption.activity_label,
					mets_value: pickedOption.mets_value,
					duration_min_per_day: durationMin,
					frequency_per_week: calcFrequency(selectedDays),
					selected_days: selectedDays,
					paper_code: pickedOption.paper_code ?? null,
					note: durationNote || null,
					recorded_at: toLocalISO(new Date()),
				})
				.select()
				.single()
			if (error) { setError('저장에 실패했습니다.'); return }
			setLocalActivities(prev => [data, ...prev])
			setPickedOption(null)
			setSelectedDays([])
			setDurationNote('')
			router.refresh()
			setStep('list')
		})
	}

	const handleManualSave = () => {
		if (!manualForm.activity_label.trim() || manualForm.selected_days.length === 0) return
		setError(null)
		startTransition(async () => {
			const paperCode = generateCustomPaperCode(localActivities)
			const { data, error } = await supabase
				.from('daily_activities')
				.insert({
					member_id: memberId,
					activity_type: `manual_${Date.now()}`,
					activity_label: manualForm.activity_label,
					mets_value: manualForm.mets_value,
					duration_min_per_day: manualForm.duration_min_per_day,
					frequency_per_week: calcFrequency(manualForm.selected_days),
					selected_days: manualForm.selected_days,
					paper_code: paperCode,
					note: manualForm.note || null,
					recorded_at: toLocalISO(new Date()),
				})
				.select()
				.single()
			if (error) { setError('저장에 실패했습니다.'); return }
			setLocalActivities(prev => [data, ...prev])
			setManualForm({ activity_label: '', mets_value: 3.5, duration_min_per_day: 30, selected_days: [], note: '' })
			router.refresh()
			setStep('list')
		})
	}

	const handleEditStart = (activity: LocalActivity) => {
		setEditTarget({ ...activity })
		setStep('edit')
	}

	const handleEditSave = () => {
		if (!editTarget) return
		setError(null)
		startTransition(async () => {
			const { error } = await supabase
				.from('daily_activities')
				.update({
					duration_min_per_day: editTarget.duration_min_per_day,
					frequency_per_week: editTarget.frequency_per_week,
					selected_days: editTarget.selected_days,
					note: editTarget.note || null,
				})
				.eq('id', editTarget.id)
			if (error) { setError('저장에 실패했습니다.'); return }
			setLocalActivities(prev => prev.map(a => a.id === editTarget.id ? editTarget : a))
			setEditTarget(null)
			router.refresh()
			setStep('list')
		})
	}

	const handleDelete = (id: string) => {
		setError(null)
		startTransition(async () => {
			const { error } = await supabase
				.from('daily_activities')
				.delete()
				.eq('id', id)
			if (error) { setError('삭제에 실패했습니다.'); return }
			setLocalActivities(prev => prev.filter(a => a.id !== id))
		})
		router.refresh()
	}

	// ── STEP: list ────────────────────────────────────────────────
	if (step === 'list') return (
		<>
			{localActivities.length === 0 ? (
				<div className="flex-1 px-5 py-10 text-center">
					<p className="text-sm text-neutral-400">등록된 생활 패턴이 없습니다</p>
					<button onClick={() => setStep('pick')} className="mt-3 text-xs text-primary underline">새 항목 추가하기</button>
				</div>
			) : (
				<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5">
					{localActivities.map(a => (
						<div key={a.id} className="flex items-center gap-3 px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-100">
							<div className="flex flex-col gap-0.5 flex-1 min-w-0">
								<span className="text-sm font-medium text-neutral-800">{a.activity_label}</span>
								<span className="text-xs text-neutral-500">
									하루 {a.duration_min_per_day}분 · {formatSelectedDays(a.selected_days) || `주 ${a.frequency_per_week}일`}{a.note ? ` · ${a.note}` : ''}
								</span>
							</div>
							<div className="flex flex-col items-end shrink-0 mr-2">
								<span className="text-xs font-mono text-neutral-400">{a.mets_value} METs/h</span>
								<span className="text-xs font-mono font-semibold text-primary">
									주 {Math.round(a.mets_value * a.duration_min_per_day * a.frequency_per_week)} METs
								</span>
							</div>
							<div className="flex gap-1.5 shrink-0">
								<button onClick={() => handleEditStart(a)} className="p-1.5 rounded-lg text-neutral-400 hover:text-primary hover:bg-primary-50 transition-colors">
									<Pencil size={13} />
								</button>
								<button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors">
									<Trash2 size={13} />
								</button>
							</div>
						</div>
					))}
				</div>
			)}
			<div className="flex-none px-5 pb-8 border-t border-neutral-100 pt-4 flex gap-2.5">
				<button onClick={onClose} className="flex-1 py-2.5 text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors">닫기</button>
				<button onClick={() => setStep('pick')} className="flex-[2] py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors">+ 항목 추가</button>
			</div>
		</>
	)

	// ── STEP: pick — 새 항목 추가 (목록 선택 / 직접 입력 탭) ────
	if (step === 'pick') return (
		<>
			<BackButton label="항목 관리" onClick={() => setStep('list')} />

			{/* 추가 방식 탭 */}
			<div className="flex-none flex gap-2 px-5 pt-3 pb-1">
				{(['select', 'manual'] as const).map(t => (
					<button
						key={t}
						onClick={() => setAddTab(t)}
						className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
							${addTab === t
								? 'bg-primary-50 text-primary border border-primary-200'
								: 'text-neutral-500 border border-neutral-200 hover:bg-neutral-50'
							}`}
					>
						{t === 'select' ? '목록에서 선택' : '직접 입력'}
					</button>
				))}
			</div>

			{/* 목록에서 선택 */}
			{addTab === 'select' && (
				<>
					<div className="flex-none flex gap-1.5 px-5 py-3 overflow-x-auto">
						{DAILY_ACTIVITY_CATEGORIES.map(c => (
							<button
								key={c}
								onClick={() => setCategory(c)}
								className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors
									${category === c
										? 'bg-primary-50 text-primary border border-primary-200'
										: 'text-neutral-500 border border-neutral-200 hover:bg-neutral-50'
									}`}
							>
								{c}
							</button>
						))}
					</div>
					<div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-2">
						{filteredOptions.length === 0 ? (
							<p className="text-sm text-neutral-400 text-center py-8">추가할 활동이 없습니다</p>
						) : (
							filteredOptions.map(opt => (
								<button
									key={opt.activity_type}
									onClick={() => handlePickOption(opt)}
									className="flex items-center justify-between px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-left hover:bg-primary-50 hover:border-primary-100 transition-colors"
								>
									<div className="flex flex-col gap-0.5">
										<span className="text-sm font-medium text-neutral-800 hover:text-primary-datk">{opt.activity_label}</span>
										<span className="text-xs text-neutral-500">{opt.mets_value} METs/h · {opt.paper_code}</span>
									</div>
									<ChevronRight size={14} className="text-neutral-500 shrink-0" />
								</button>
							))
						)}
					</div>
				</>
			)}

			{/* 직접 입력 */}
			{addTab === 'manual' && (
				<>
					<div className="flex-1 px-5 py-4 flex flex-col gap-4">
						<div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
							<div className='col-span-full md:col-span-2'>
								<FormField label="활동 이름">
									<input
										className="m-input"
										value={manualForm.activity_label}
										onChange={e => setManualForm(p => ({ ...p, activity_label: e.target.value }))}
										placeholder="예: 골프, 테니스, 줄넘기"
									/>
								</FormField>
							</div>
							<div className='col-span-full md:col-span-1'>
								<FormField label="METs/h">
									<input className="m-input" type="number" step="0.1" min="0"
										value={manualForm.mets_value}
										onChange={e => setManualForm(p => ({ ...p, mets_value: Number(e.target.value) }))} />
								</FormField>
							</div>
						</div>
						<ActivitySettingsForm
							metsValue={manualForm.mets_value}
							durationMin={manualForm.duration_min_per_day}
							selectedDays={manualForm.selected_days}
							note={manualForm.note}
							onChangeDuration={v => setManualForm(p => ({ ...p, duration_min_per_day: v }))}
							onChangeDays={days => setManualForm(p => ({ ...p, selected_days: days }))}
							onChangeNote={v => setManualForm(p => ({ ...p, note: v }))}
						/>
					</div>
					<ActivityBottomActions onCancel={() => setStep('list')} onSave={handleManualSave} saveLabel="추가" isPending={isPending} error={error} />
				</>
			)}
		</>
	)

	// ── STEP: duration — 시간/빈도 설정 ──────────────────────────
	if (step === 'duration' && pickedOption) return (
		<>
			<BackButton label="활동 선택" onClick={() => setStep('pick')} />
			<div className="px-5 py-4 flex flex-col gap-4">
				<div className="flex items-center gap-3 px-4 py-3 bg-primary-50 rounded-xl border border-primary-100">
					<div className="flex flex-col gap-0.5 flex-1">
						<span className="text-sm font-medium text-neutral-800">{pickedOption.activity_label}</span>
						<span className="text-xs text-primary-600">{pickedOption.mets_value} METs/h</span>
					</div>
				</div>
				<ActivitySettingsForm
					metsValue={pickedOption.mets_value}
					durationMin={durationMin}
					selectedDays={selectedDays}
					note={durationNote}
					onChangeDuration={setDurationMin}
					onChangeDays={setSelectedDays}
					onChangeNote={setDurationNote}
				/>
			</div>
			<ActivityBottomActions onCancel={() => setStep('pick')} onSave={handleAddSave} saveLabel="추가" isPending={isPending} error={error} />
		</>
	)

	// ── STEP: edit — 기존 항목 수정 ──────────────────────────────
	if (step === 'edit' && editTarget) return (
		<>
			<BackButton label="항목 관리" onClick={() => { setEditTarget(null); setStep('list') }} />
			<div className="px-5 py-4 flex flex-col gap-4">
				<div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-100">
					<div className="flex flex-col gap-0.5 flex-1">
						<span className="text-sm font-medium text-neutral-800">{editTarget.activity_label}</span>
						<span className="text-xs text-neutral-400">{editTarget.mets_value} METs/h</span>
					</div>
				</div>
				<ActivitySettingsForm
					metsValue={editTarget.mets_value}
					durationMin={editTarget.duration_min_per_day}
					selectedDays={editTarget.selected_days ?? []}
					note={editTarget.note ?? ''}
					onChangeDuration={v => setEditTarget(prev => prev ? { ...prev, duration_min_per_day: v } : null)}
					onChangeDays={days => setEditTarget(prev => prev ? { ...prev, selected_days: days, frequency_per_week: calcFrequency(days) } : null)}
					onChangeNote={v => setEditTarget(prev => prev ? { ...prev, note: v } : null)}
				/>
			</div>
			<ActivityBottomActions
				onCancel={() => { setEditTarget(null); setStep('list') }}
				onSave={handleEditSave}
				saveLabel="수정 저장"
				isPending={isPending}
				error={error}
			/>
		</>
	)

	return null
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────
export default function MemberRecordSection({
	member, workoutLogs, notes, noteCompletions,
	inbodyRecords, activities, sessions, pushSubs,
}: Props) {
	const [editMemberOpen, setEditMemberOpen] = useState(false)
	const [editActivityOpen, setEditActivityOpen] = useState(false)

	const today = toLocalISO(new Date())

	// ── 운동 통계 계산 ──────────────────────────────────────────
	const totalLogs = workoutLogs.length
	const totalMets = workoutLogs.reduce((s, l) => s + l.mets_score, 0)
	const uniqueDates = new Set(workoutLogs.map(l => l.logged_at))
	const totalDays = uniqueDates.size
	const firstLog = workoutLogs[0]?.logged_at ?? null
	const lastLog = workoutLogs[workoutLogs.length - 1]?.logged_at ?? null
	const activeDays = firstLog && lastLog ? daysBetween(firstLog, lastLog) + 1 : 0
	const avgDaysPerWeek = activeDays > 0 ? (totalDays / activeDays * 7).toFixed(1) : '—'
	const avgMetsPerDay = totalDays > 0 ? Math.round(totalMets / totalDays) : 0

	// 가장 많이 한 운동
	const typeCounts = workoutLogs.reduce<Record<string, number>>((acc, l) => {
		acc[l.workout_type] = (acc[l.workout_type] ?? 0) + 1
		return acc
	}, {})
	const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]


	// 연속 운동일 (streak) 계산
	let streak = 0
	const sortedDates = [...uniqueDates].sort().reverse()
	let cur = today
	for (const d of sortedDates) {
		if (d === cur) {
			streak++
			cur = new Date(new Date(cur).getTime() - 86400000).toISOString().split('T')[0]
		} else break
	}

	// ── 알림장 통계 계산 ────────────────────────────────────────
	const totalNotes = notes.length
	const sentNotes = notes.filter(n => n.is_sent).length
	const totalPrescribed = notes.reduce((s, n) => s + (n.note_workouts?.length ?? 0), 0)
	const totalCompleted = noteCompletions.length
	const completionRate = totalPrescribed > 0
		? Math.round(totalCompleted / totalPrescribed * 100)
		: null

	// ── 인바디 변화 계산 ────────────────────────────────────────
	const latestInbody = inbodyRecords[0] ?? null
	const earliestInbody = inbodyRecords[inbodyRecords.length - 1] ?? null
	const inbodyCount = inbodyRecords.length

	const weightChange = latestInbody && earliestInbody && latestInbody.id !== earliestInbody.id && latestInbody.weight && earliestInbody.weight
		? (latestInbody.weight - earliestInbody.weight).toFixed(1)
		: null
	const muscleChange = latestInbody && earliestInbody && latestInbody.id !== earliestInbody.id && latestInbody.muscle_mass && earliestInbody.muscle_mass
		? (latestInbody.muscle_mass - earliestInbody.muscle_mass).toFixed(1)
		: null
	const fatChange = latestInbody && earliestInbody && latestInbody.id !== earliestInbody.id && latestInbody.body_fat_pct && earliestInbody.body_fat_pct
		? (latestInbody.body_fat_pct - earliestInbody.body_fat_pct).toFixed(1)
		: null

	// ── 생활패턴 주간 METs ──────────────────────────────────────
	const weeklyActivityMets = activities.reduce((sum, a) => {
		return sum + (a.mets_value * a.duration_min_per_day * a.frequency_per_week)
	}, 0)

	// ── PWA ─────────────────────────────────────────────────────
	const isPwaInstalled = pushSubs.length > 0
	const pwaInstalledAt = pushSubs[0]?.created_at ?? null

	// ── 접속 패턴 ───────────────────────────────────────────────
	const totalSessions = sessions.length
	const lastSession = sessions[0]?.opened_at ?? null

	// 요일별 접속 빈도
	const dayNames = ['일', '월', '화', '수', '목', '금', '토']
	const dayFreq = sessions.reduce<Record<number, number>>((acc, s) => {
		const d = new Date(s.opened_at).getDay()
		acc[d] = (acc[d] ?? 0) + 1
		return acc
	}, {})
	const topDay = Object.entries(dayFreq).sort((a, b) => Number(b[1]) - Number(a[1]))[0]

	// 가입 후 경과일
	const memberDays = daysBetween(member.registered_at, today)

	const gridSt = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3';
	return (
		<>
			<div className="flex flex-col gap-4 py-4 ">

				{/* ── 기본 정보 ──────────────────────────────────────── */}
				<Section icon={<User size={16} />} title="기본 정보" onEdit={() => setEditMemberOpen(true)}>
					<div className={gridSt}>
						<InfoRow label="이름" value={member.name} />
						<InfoRow label="연락처" value={member.phone} />
						<InfoRow label="생년월일" value={formatDate(member.birth_date)} />
						<InfoRow label="등록일" value={`${formatDate(member.registered_at)} (${memberDays}일 경과)`} />
						<InfoRow label="주 수업 횟수" value={`주 ${member.sessions_per_week}회`} />
						<InfoRow label="특이사항" value={member.memo} />
					</div>
				</Section>

				{/* ── 운동 통계 ──────────────────────────────────────── */}
				<Section icon={<Dumbbell size={16} />} title="운동 기록 통계">
					{totalLogs === 0 ? (
						<p className="text-sm text-neutral-500 text-center py-4">운동 기록이 없습니다</p>
					) : (
						<>
							<div className={gridSt}>
								<StatCard label="총 운동 횟수" value={`${totalLogs}회`} />
								<StatCard label="총 운동일수" value={`${totalDays}일`} />
								<StatCard label="누적 METs" value={Math.round(totalMets).toLocaleString()} />
								<StatCard label="연속 운동일" value={`${streak}일`} sub="현재 streak" />
								<StatCard label="주 평균 운동일" value={`${avgDaysPerWeek}일`} />
								<StatCard label="일 평균 METs" value={`${avgMetsPerDay}`} />
								{topType && (
									<StatCard
										label="최다 운동 종목"
										value={WORKOUT_TYPE_LABELS[topType[0] as WorkoutType] ?? topType[0]}
										sub={`${topType[1]}회`}
									/>
								)}
							</div>
							<div className="flex gap-3 text-xs text-neutral-500 pt-1">
								<span>첫 운동 {formatDate(firstLog)}</span>
								<span>·</span>
								<span>최근 운동 {formatDate(lastLog)}</span>
							</div>
						</>

					)}
				</Section>

				{/* ── 알림장 통계 ────────────────────────────────────── */}
				<Section icon={<BookOpen size={16} />} title="알림장 통계">
					{totalNotes === 0 ? (
						<p className="text-sm text-neutral-500 text-center py-4">알림장이 없습니다</p>
					) : (
						<div className={gridSt}>
							<StatCard label="총 알림장" value={`${totalNotes}개`} />
							<StatCard label="전송 완료" value={`${sentNotes}개`} sub={`미전송 ${totalNotes - sentNotes}개`} />
							<StatCard label="처방 운동 수" value={`${totalPrescribed}개`} />
							<StatCard
								label="수행률"
								value={completionRate !== null ? `${completionRate}%` : '—'}
								sub={`${totalCompleted} / ${totalPrescribed}`}
							/>
						</div>
					)}
				</Section>

				{/* ── 인바디 변화 ────────────────────────────────────── */}
				<Section icon={<BarChart2 size={16} />} title="인바디 변화">
					{inbodyCount === 0 ? (
						<p className="text-sm text-neutral-500 text-center py-4">인바디 기록이 없습니다</p>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
							<StatCard label="측정 횟수" value={`${inbodyCount}회`} />
							{latestInbody && (
								<StatCard label="최근 측정일" value={formatDate(latestInbody.measured_at)} />
							)}
							{earliestInbody && inbodyCount > 1 && (
								<StatCard label="첫 측정일" value={formatDate(earliestInbody.measured_at)} />
							)}

							{inbodyCount > 1 && (
								<>
									{weightChange !== null && (
										<StatCard
											label="첫 측정 대비 체중 변화"
											value={`${Number(weightChange) > 0 ? '+' : ''}${weightChange} kg`}
											sub={Number(weightChange) < 0 ? '▼ 감소' : Number(weightChange) > 0 ? '▲ 증가' : '변화 없음'}
										/>
									)}
									{muscleChange !== null && (
										<StatCard
											label="첫 측정 대비 근육량 변화"
											value={`${Number(muscleChange) > 0 ? '+' : ''}${muscleChange} kg`}
											sub={Number(muscleChange) > 0 ? '▲ 증가' : Number(muscleChange) < 0 ? '▼ 감소' : '변화 없음'}
										/>
									)}
									{fatChange !== null && (
										<StatCard
											label="첫 측정 대비 체지방률 변화"
											value={`${Number(fatChange) > 0 ? '+' : ''}${fatChange} %`}
											sub={Number(fatChange) < 0 ? '▼ 감소' : Number(fatChange) > 0 ? '▲ 증가' : '변화 없음'}
										/>
									)}
								</>

							)}
						</div>
					)}
				</Section>

				{/* ── 생활패턴 ───────────────────────────────────────── */}
				<Section icon={<Activity size={16} />} title="비방문일 생활 패턴" onEdit={() => setEditActivityOpen(true)}>
					{activities.length === 0 ? (
						<p className="text-sm text-neutral-500 text-center py-4">등록된 생활 패턴이 없습니다</p>
					) : (
						<>
							<div className="flex items-center gap-2 mb-3 px-3 py-2 bg-primary-50 rounded-xl border border-primary-100">
								<span className="text-xs font-medium text-primary-600">생활패턴 주간 METs 합산</span>
								<span className="ml-auto font-mono text-sm font-bold text-primary">
									{Math.round(weeklyActivityMets).toLocaleString()} METs/주
								</span>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
								{activities.map(a => (
									<div key={a.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-neutral-50 rounded-xl">
										<div className="flex flex-col gap-0.5 flex-1 min-w-0">
											<span className="text-sm font-medium text-neutral-800">{a.activity_label}</span>
											<span className="text-xs text-neutral-500">
												하루 {a.duration_min_per_day}분 · {formatSelectedDays(a.selected_days) || `주 ${a.frequency_per_week}일`}
												{a.note && ` · ${a.note}`}
											</span>
										</div>
										<div className="flex flex-col items-end shrink-0">
											<span className="text-xs font-mono text-neutral-500">{a.mets_value} METs/h</span>
											<span className="text-xs font-mono font-semibold text-primary">
												주 {Math.round(a.mets_value * a.duration_min_per_day * a.frequency_per_week)} METs
											</span>
										</div>
									</div>
								))}
							</div>
						</>
					)}
				</Section>

				{/* ── PWA 및 앱 접속 ─────────────────────────────────── */}
				<Section icon={<Smartphone size={16} />} title="앱 사용 현황">
					<div className="flex flex-col gap-4">

						{/* PWA 설치 */}
						<div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border"
							style={{
								background: isPwaInstalled ? 'rgba(11,180,137,0.05)' : '#fafafa',
								borderColor: isPwaInstalled ? 'rgba(11,180,137,0.2)' : '#e5e7eb',
							}}>
							<span className="text-lg">{isPwaInstalled ? '📲' : '🌐'}</span>
							<div className="flex flex-col gap-0.5">
								<span className="text-sm font-semibold text-neutral-800">
									PWA {isPwaInstalled ? '설치됨' : '미설치 (브라우저 접속)'}
								</span>
								{isPwaInstalled && pwaInstalledAt && (
									<span className="text-xs text-neutral-500">
										설치일 {formatDateTime(pwaInstalledAt)}
									</span>
								)}
							</div>
						</div>

						{/* 접속 통계 */}
						<div className="flex flex-wrap gap-2">
							<StatCard label="총 접속 횟수" value={`${totalSessions}회`} sub="최근 20건 기준" />
							{lastSession && (
								<StatCard label="마지막 접속" value={formatDateTime(lastSession)} />
							)}
							{topDay && (
								<StatCard
									label="주로 접속하는 요일"
									value={`${dayNames[Number(topDay[0])]}요일`}
									sub={`${topDay[1]}회`}
								/>
							)}
						</div>

						{/* 접속 이력 */}
						{sessions.length > 0 && (
							<div className="flex flex-col mt-1">
								<p className="text-xs text-neutral-500 mb-2">최근 접속 이력</p>
								{sessions.map((s, i) => (
									<div key={s.id} className="flex items-center gap-3 py-2 border-b border-neutral-50 last:border-b-0">
										<span className="text-xs text-neutral-300 w-5 text-right shrink-0">{i + 1}</span>
										<span className="text-xs text-neutral-500 w-24 shrink-0">{parseUserAgent(s.user_agent)}</span>
										<span className="text-xs font-mono text-neutral-600">{formatDateTime(s.opened_at)}</span>
									</div>
								))}
							</div>
						)}
					</div>
				</Section>
			</div>
			{/* ── 기본 정보 수정 바텀시트 ──────────────────────────── */}
			<BottomSheet
				open={editMemberOpen}
				onClose={() => setEditMemberOpen(false)}
				title="기본 정보 수정"
			>
				<MemberEditForm member={member} onClose={() => setEditMemberOpen(false)} />
			</BottomSheet>

			{/* ── 생활 패턴 수정 바텀시트 ──────────────────────────── */}
			<BottomSheet
				open={editActivityOpen}
				onClose={() => setEditActivityOpen(false)}
				title="비방문일 생활 패턴 수정"
			>
				<ActivityEditForm activities={activities} memberId={member.id} onClose={() => setEditActivityOpen(false)} />
			</BottomSheet>

		</>

	)
}
