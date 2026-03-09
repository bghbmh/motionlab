'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Member, WorkoutLog, getActivityStatus, ACTIVITY_STATUS_LABELS } from '@/types/database'

// 이번 주 월요일 날짜 계산
function getWeekStart() {
	const d = new Date()
	const day = d.getDay()
	const diff = d.getDate() - day + (day === 0 ? -6 : 1)
	d.setDate(diff)
	return d.toISOString().split('T')[0]
}

interface MemberWithData extends Member {
	inbody_records: Array<{
		weight: number
		muscle_mass: number
		body_fat_pct: number      // %
		body_fat_mass: number     // kg
		bmi: number
		bmr: number              // kcal, 기초대사량
		visceral_fat: number
		measured_at: string
	}>
	workout_logs: WorkoutLog[]
}

export default function StudioPage() {
	const [members, setMembers] = useState<MemberWithData[]>([])
	const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
	const [loading, setLoading] = useState(true);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		const fetchMembers = async () => {
			const supabase = createClient()
			const { data: { user } } = await supabase.auth.getUser()

			// 강사 정보
			const { data: instructor } = await supabase
				.from('instructors')
				.select('studio_id')
				.eq('id', user!.id)
				.single()

			if (!instructor) {
				setLoading(false)
				return
			}

			// 회원 목록 + 최근 인바디 + 이번 주 운동 기록
			const { data: membersData } = await supabase
				.from('members')
				.select(`
					*,
					inbody_records (
						weight, muscle_mass, body_fat_pct,body_fat_mass, bmi,bmr, visceral_fat, measured_at
					),
					workout_logs (
						logged_at, mets_score
					)
					`)
				.eq('studio_id', instructor.studio_id)
				.eq('is_active', true)
				.order('name')

			if (membersData) {
				setMembers(membersData as MemberWithData[])
				// 첫 회원 자동 선택
				if (membersData.length > 0) {
					setSelectedMemberId(membersData[0].id)
				}
			}
			setLoading(false)
		}

		fetchMembers()
	}, [])

	const selectedMember = selectedMemberId
		? members.find(m => m.id === selectedMemberId)
		: null;

	const weekStart = getWeekStart();

	const getWeeklyStats = (member: MemberWithData) => {
		const weekLogs = (member.workout_logs ?? []).filter(
			l => l.logged_at >= weekStart
		)
		const avgMets = weekLogs.length
			? weekLogs.reduce((s, l) => s + l.mets_score, 0) / weekLogs.length
			: 0
		return { weekLogs, avgMets }
	}

	const getLatestInbody = (member: MemberWithData) => {
		const records = member.inbody_records ?? []
		return records.length > 0 ? records[0] : null
	}

	const renderWeekChart = (member: MemberWithData) => {
		const weekLogs = (member.workout_logs ?? []).filter(
			l => l.logged_at >= weekStart
		)
		const days = ['월', '화', '수', '목', '금', '토', '일']
		const weekData = days.map((_, i) => {
			const dayStart = new Date(weekStart)
			dayStart.setDate(dayStart.getDate() + i)
			const dayStr = dayStart.toISOString().split('T')[0]
			const dayLog = weekLogs.filter(
				l => l.logged_at.split('T')[0] === dayStr
			)
			return dayLog.length > 0
				? dayLog.reduce((s, l) => s + l.mets_score, 0) / dayLog.length
				: 0
		})

		const maxValue = Math.max(...weekData, 1)

		return (
			<div className="flex items-end gap-2 h-16">
				{weekData.map((value, i) => (
					<div key={i} className="flex-1 flex flex-col items-center gap-2">
						<div
							className="w-full rounded-t transition-all"
							style={{
								height: `${(value / maxValue) * 100}%`,
								backgroundColor: value > 5 ? 'rgb(61, 219, 181)' : value > 0 ? 'rgba(61, 219, 181, 0.35)' : 'transparent',
								border: value === 0 ? '1px dashed rgba(74, 92, 120, 1)' : 'none',
								minHeight: value > 0 ? '4px' : '0px',
							}}
						/>
						<span className="text-xs font-mono text-white/30">{days[i]}</span>
					</div>
				))}
			</div>
		)
	}

	// 회원앱 링크 복사 함수
	// function handleCopyMemberLink(accessToken: string) {
	// 	const url = `${window.location.origin}/m/${accessToken}`
	// 	navigator.clipboard.writeText(url).then(() => {
	// 		setCopied(true)
	// 		setTimeout(() => setCopied(false), 2000)  // 2초 후 원복
	// 	})
	// }

	function handleCopyMemberLink(accessToken: string) {
		const url = `${window.location.origin}/m/${accessToken}`

		// clipboard API 지원 여부 확인 (HTTPS 환경에서만 동작)
		if (navigator.clipboard?.writeText) {
			navigator.clipboard.writeText(url).then(() => {
				setCopied(true)
				setTimeout(() => setCopied(false), 2000)
			})
		} else {
			// fallback: textarea 방식 (HTTP 환경, 구형 브라우저 대응)
			const textarea = document.createElement('textarea')
			textarea.value = url
			textarea.style.position = 'fixed'
			textarea.style.opacity = '0'
			document.body.appendChild(textarea)
			textarea.focus()
			textarea.select()
			try {
				document.execCommand('copy')
				setCopied(true)
				setTimeout(() => setCopied(false), 2000)
			} catch (e) {
				// 복사 실패 시 URL을 alert로 보여줌
				alert(`링크를 복사해주세요:\n${url}`)
			} finally {
				document.body.removeChild(textarea)
			}
		}
	}

	if (loading) {
		return (
			<div className="flex gap-5 h-[calc(100vh-64px)] items-center justify-center">
				<p className="text-white/40">로딩 중...</p>
			</div>
		)
	}

	return (
		<div className="flex gap-5 h-[calc(100vh-64px)] px-4 py-4">
			{/* Left: 회원 목록 */}
			<div className="w-64 shrink-0 flex flex-col gap-3">
				<input
					className="ml-input"
					placeholder="🔍  회원 검색..."
				/>
				<div className="flex flex-col gap-2 overflow-y-auto flex-1">
					{members.map(m => {
						const { weekLogs, avgMets } = getWeeklyStats(m)
						const status = getActivityStatus(avgMets)
						const badgeClass = {
							low: 'badge-low',
							good: 'badge-good',
							high: 'badge-high',
						}[status]
						const isSelected = selectedMemberId === m.id

						return (
							<button
								key={m.id}
								onClick={() => setSelectedMemberId(m.id)}
								className={`bg-card2 border rounded-xl p-3 text-left transition-all ${isSelected
									? 'border-mint/60 bg-card2'
									: 'border-white/[0.07] hover:border-mint/40'
									}`}
							>
								<div className="flex justify-between items-center">
									<span className="font-semibold text-sm text-white">{m.name}</span>
									<span className={`text-xs px-2 py-1 rounded-full ${badgeClass}`}>
										{ACTIVITY_STATUS_LABELS[status]}
									</span>
								</div>
								<p className="text-xs text-white/30 font-mono mt-1">
									이번 주 {weekLogs.length}일 · METs {avgMets.toFixed(1)}
								</p>
								<p className="text-xs text-white/20 font-mono mt-0.5">
									주 {m.sessions_per_week}회 수업
								</p>
							</button>
						)
					})}

					{members.length === 0 && (
						<p className="text-xs text-white/30 text-center mt-8">
							등록된 회원이 없습니다.
							<br />
							헤더의 신규회원 추가 버튼을 눌러주세요.
						</p>
					)}
				</div>
			</div>

			{/* Right: 선택된 회원 정보 또는 안내 메시지 */}
			{selectedMember ? (
				<div className="flex-1 flex flex-col gap-4 overflow-y-auto">
					{/* 회원 이름 + 상태 배지 + 상세보기 */}
					<div className="bg-card border border-white/[0.07] rounded-lg p-4 flex justify-between items-start">
						<div className="flex items-center gap-4">
							<div>
								<div className="flex items-center gap-3">
									<p className="text-lg font-bold text-white">{selectedMember.name}</p>
									{(() => {
										const { avgMets } = getWeeklyStats(selectedMember)
										const status = getActivityStatus(avgMets)
										const badgeClass = {
											low: 'badge-low',
											good: 'badge-good',
											high: 'badge-high',
										}[status]
										return (
											<span className={`text-sm px-3 py-1 rounded-full ${badgeClass}`}>
												{ACTIVITY_STATUS_LABELS[status]}
											</span>
										)
									})()}
								</div>


								<p className="text-xs text-white/40 mt-1">
									주 {selectedMember.sessions_per_week}회 수업
								</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							{/* 회원앱 링크 복사 버튼 */}
							<button
								onClick={() => handleCopyMemberLink(selectedMember.access_token)}
								title="회원앱 링크 복사"
								className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
								style={{
									background: copied
										? 'rgba(61,219,181,0.15)'
										: 'rgba(255,255,255,0.04)',
									border: copied
										? '1px solid rgba(61,219,181,0.4)'
										: '1px solid rgba(255,255,255,0.1)',
									color: copied ? '#3DDBB5' : 'rgba(255,255,255,0.5)',
								}}
							>
								{copied ? (
									<>
										<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
											<path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
										복사됨
									</>
								) : (
									<>
										<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
											<rect x="4" y="1" width="7" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
											<path d="M1 4h2v6.5A.5.5 0 003.5 11H8v1H3a2 2 0 01-2-2V4z" fill="currentColor" />
										</svg>
										회원 공유 링크
									</>
								)}
							</button>

							<Link
								href={`/studio/members/${selectedMember.id}`}
								className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs 
                       hover:bg-white/10 transition-colors text-white/80 hover:text-white"
							>
								상세 보기 →
							</Link>


						</div>
					</div>

					{/* 이번 주 홈트 기록 */}
					<div className="bg-card border border-white/[0.07] rounded-lg p-4">
						<p className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4">
							이번 주 홈트 기록
						</p>
						{renderWeekChart(selectedMember)}
						<p className="text-xs text-white/40 mt-3 font-mono">
							평균{' '}
							<span className="text-mint">
								{(() => {
									const { avgMets } = getWeeklyStats(selectedMember)
									return avgMets.toFixed(1)
								})()}{' '}
								METs
							</span>{' '}
							· 권장 대비{' '}
							<span className="text-amber">
								{(() => {
									const { avgMets } = getWeeklyStats(selectedMember)
									return Math.round((avgMets / 5) * 100)
								})()}%
							</span>
						</p>
					</div>

					{/* 인바디 최근 정보 */}
					<div className="bg-card border border-white/[0.07] rounded-lg p-4">
						<p className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4">
							인바디 최근_입력값 모두 보이게 수정{' '}
							{(() => {
								const latest = getLatestInbody(selectedMember)
								return latest
									? `· ${new Date(latest.measured_at).toLocaleDateString('ko-KR', {
										month: '2-digit',
										day: '2-digit',
									})}`
									: '· 기록 없음'
							})()}
						</p>
						{getLatestInbody(selectedMember) ? (
							<div className="grid grid-cols-6 gap-3">
								{(() => {
									const latest = getLatestInbody(selectedMember)!
									return [
										['체중', `${latest.weight}kg`, ''],
										['근육량', `${latest.muscle_mass}kg`, '↑'],
										['체지방률', `${latest.body_fat_pct}%`, '↓'],
										['체지방량', `${latest.body_fat_mass}kg`, '↓'],
										['BMI', `${latest.bmi}`, ''],
										['내장지방레벨', `${latest.visceral_fat}`, '↓']
									].map(([label, value, arrow]) => (
										<div
											key={label}
											className="bg-card2 border border-white/[0.07] rounded-xl p-3 text-center"
										>
											<p className="text-xs text-white/40 mb-2">{label}</p>
											<p className="font-mono text-sm text-white">
												{value !== 'null' ? value : '-'}
												{arrow && (
													<span
														className={
															arrow === '↑'
																? 'text-mint'
																: 'text-coral'
														}
													>
														{arrow}
													</span>
												)}
											</p>
										</div>
									))
								})()}
							</div>
						) : (
							<p className="text-xs text-white/40">기록된 인바디 정보가 없습니다.</p>
						)}
					</div>

					{/* 액션 버튼 */}
					<div className="flex gap-3">
						<Link
							href={`/studio/members/${selectedMember.id}?tab=note`}
							className="flex-1 px-4 py-2.5 bg-mint text-navy rounded-lg font-semibold text-sm
                     hover:bg-mint/90 transition-colors"
						>
							알림장 작성 →
						</Link>
						<Link
							href={`/studio/members/${selectedMember.id}?tab=inbody`}
							className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg 
                     hover:bg-white/10 transition-colors text-white text-sm"
						>
							인바디 입력 →
						</Link>
					</div>
				</div>
			) : (
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<p className="text-4xl mb-4">👈</p>
						<p className="text-white/40 text-sm">왼쪽에서 회원을 선택하세요</p>
					</div>
				</div>
			)}
		</div>
	)
}
