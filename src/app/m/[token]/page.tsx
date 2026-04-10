// src/app/m/[token]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getCurrentWeekStart } from '@/lib/weekUtils'
import HelloUserInfo from '@/components/member/HelloUserInfo'
import ActivitySummaryCard from '@/components/member/ActivitySummaryCard'
import TodayNoteCard from '@/components/member/TodayNoteCard'
import TodayWorkoutCard from '@/components/member/TodayWorkoutCard'
import DailyActivityCard from '@/components/member/DailyActivityCard'

function toLocalISO(date: Date): string {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

function parseLocalDate(dateStr: string): Date {
	const [y, m, d] = dateStr.split('-').map(Number)
	return new Date(y, m - 1, d)
}

export default async function MemberHomePage({
	params,
}: {
	params: Promise<{ token: string }>
}) {


	await new Promise(resolve => setTimeout(resolve, 1000))


	const { token } = await params
	const supabase = await createClient()

	const { data: member } = await supabase
		.from('members')
		.select('id, name, week_start_date')
		.eq('access_token', token)
		.single()

	if (!member) return null

	const today = toLocalISO(new Date())
	const todayDayLabel = ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()]
	const baseDate = member.week_start_date ?? today
	const weekStart = getCurrentWeekStart(baseDate)
	const weekEndDate = parseLocalDate(weekStart)
	weekEndDate.setDate(weekEndDate.getDate() + 6)
	const weekEnd = toLocalISO(weekEndDate)

	// ─── 병렬 데이터 조회 ─────────────────────────────────────────
	const [
		weekLogsRes,
		latestNoteRes,
		todayRoutineLogsRes,
		todayManualLogsRes,
		dailyActivitiesRes,
		todayDailyLogsRes,
		everDailyLogsRes,
		unreadCountRes,          // ← 추가: 읽지 않은 알림 개수
	] = await Promise.all([
		// 주간 운동 로그
		supabase
			.from('workout_logs')
			.select('logged_at, mets_score, duration_min, source')
			.eq('member_id', member.id)
			.in('source', ['routine', 'manual'])
			.gte('logged_at', weekStart)
			.lte('logged_at', weekEnd)
			.order('logged_at'),

		// 최근 알림장 (없으면 null)
		supabase
			.from('notes')
			.select('id, recommended_mets, note_workouts(id, day, workout_type, intensity, duration_min, mets, sort_order, coach_memo)')
			.eq('member_id', member.id)
			.eq('is_sent', true)
			.order('written_at', { ascending: false })
			.limit(1)
			.single(),

		// 오늘 완료된 루틴 로그
		supabase
			.from('workout_logs')
			.select('id, note_workout_id, duration_min, prescribed_duration_min, mets_score')
			.eq('member_id', member.id)
			.eq('logged_at', today)
			.eq('source', 'routine')
			.not('note_workout_id', 'is', null),

		// 오늘 직접 기록한 운동 (TodayWorkoutCard 초기값)
		supabase
			.from('workout_logs')
			.select('id, workout_type, duration_min, mets_score, condition_memo, source')
			.eq('member_id', member.id)
			.eq('logged_at', today)
			.eq('source', 'manual')
			.order('created_at', { ascending: true }),

		// 일상생활 패턴
		supabase
			.from('daily_activities')
			.select('id, activity_type, activity_label, mets_value, duration_min_per_day, frequency_per_week, paper_code')
			.eq('member_id', member.id)
			.order('created_at', { ascending: true }),

		// 오늘 저장된 일상생활 로그 (체크 상태 복원용)
		supabase
			.from('workout_logs')
			.select('activity_type')
			.eq('member_id', member.id)
			.eq('logged_at', today)
			.eq('source', 'daily'),

		// 과거에 한 번이라도 저장된 일상생활 activity_type (자동 기록 판단용)
		supabase
			.from('workout_logs')
			.select('activity_type')
			.eq('member_id', member.id)
			.eq('source', 'daily')
			.lt('logged_at', today)
			.not('activity_type', 'is', null),

		// 읽지 않은 알림 개수 (hasNews 판단용)
		supabase
			.from('notifications')
			.select('id', { count: 'exact', head: true })
			.eq('member_id', member.id)
			.eq('is_read', false),
	])

	const weekLogs = weekLogsRes.data ?? []
	const latestNote = latestNoteRes.data
	const todayRoutineLogs = todayRoutineLogsRes.data ?? []
	const todayManualLogs = todayManualLogsRes.data ?? []
	const dailyActivities = dailyActivitiesRes.data ?? []
	const todayLoggedDailyTypes = (todayDailyLogsRes.data ?? [])
		.map(l => l.activity_type)
		.filter(Boolean) as string[]

	// 과거 daily 기록 타입 — 중복 제거
	const everLoggedDailyTypes = [...new Set(
		(everDailyLogsRes.data ?? [])
			.map(l => l.activity_type)
			.filter(Boolean) as string[]
	)]

	const unreadCount = unreadCountRes.count ?? 0
	console.log('unreadCount:', unreadCount, 'res:', unreadCountRes)

	// ─── 통계 계산 ─────────────────────────────────────────────────
	const weekTotalMets = weekLogs.reduce((s, l) => s + l.mets_score * l.duration_min, 0)
	const weekTotalMin = weekLogs.reduce((s, l) => s + l.duration_min, 0)
	const activeDays = new Set(weekLogs.map(l => l.logged_at)).size

	// ─── 오늘 알림장 운동 처방 ─────────────────────────────────────
	const noteWorkouts = (latestNote?.note_workouts ?? [])
		.filter((w: any) => w.day === '전체' || w.day === todayDayLabel)
		.sort((a: any, b: any) => a.sort_order - b.sort_order)

	const completedLogs = todayRoutineLogs.map((l: any) => ({
		note_workout_id: l.note_workout_id,
		log_id: l.id,
		duration_min: l.duration_min ?? 0,
		prescribed_duration_min: l.prescribed_duration_min ?? null,
		mets_score: l.mets_score ?? 0,
	}))

	// ─── TodayWorkoutCard 초기 데이터 ─────────────────────────────
	const initialRecords = todayManualLogs.map((l: any) => ({
		id: l.id,
		workout_type: l.workout_type,
		intensity: 'normal',
		duration_min: l.duration_min ?? 0,
		mets_score: l.mets_score ?? 0,
		condition_memo: l.condition_memo ?? null,
		source: l.source,
	}))

	return (
		<>
			{/* 인사 */}
			<HelloUserInfo
				token={token}
				memberName={member.name}
				hasNews={unreadCount > 0}
			/>

			{/* 기간별 활동 통계
			<ActivitySummaryCard
				weekStart={weekStart}
				weekEnd={weekEnd}
				metsScore={weekTotalMets}
				durationMin={weekTotalMin}
				activeDays={activeDays}
			/> */}

			{/* 오늘 알림장 */}
			<TodayNoteCard
				memberId={member.id}
				token={token}
				noteWorkouts={noteWorkouts as any}
				completedLogs={completedLogs}
				today={today}
				hasNote={latestNote !== null}
			/>

			{/* 오늘의 운동 — 직접 기록 */}
			<TodayWorkoutCard
				memberId={member.id}
				token={token}
				today={today}
				initialRecords={initialRecords as any}
			/>

			{/* 일상생활활동 */}
			<DailyActivityCard
				memberId={member.id}
				patterns={dailyActivities as any}
				today={today}
				todayLoggedTypes={todayLoggedDailyTypes}
				everLoggedTypes={everLoggedDailyTypes}
			/>
		</>
	)
}
