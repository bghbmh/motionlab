import { createClient } from '@/lib/supabase/server'
import VideosClient from '@/components/member/VideosClient'

export default async function VideosPage({
	params,
}: {
	params: Promise<{ token: string }>
}) {
	const { token } = await params
	const supabase = await createClient()

	const { data: member } = await supabase
		.from('members')
		.select('id')
		.eq('access_token', token)
		.single()

	if (!member) return null

	// 가장 최근 알림장의 영상 조회
	const { data: latestNote } = await supabase
		.from('notes')
		.select(`
      id,
      note_tags(tag),
      note_workouts(workout_type),
      note_videos(
        id, video_id, youtube_url, title, thumbnail_url, source, sort_order
      )
    `)
		.eq('member_id', member.id)
		.eq('is_sent', true)
		.order('written_at', { ascending: false })
		.limit(1)
		.single()

	const videos = latestNote?.note_videos
		?.sort((a: any, b: any) => a.sort_order - b.sort_order) ?? []

	const tags = latestNote?.note_tags?.map((t: any) => t.tag) ?? []

	return <VideosClient videos={videos} tags={tags} />
} 