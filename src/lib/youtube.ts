//src/lib/youtube.ts 서버 전용 유틸

export interface YouTubeSearchResult {
	videoId: string
	title: string
	channelTitle: string
	thumbnailUrl: string
	youtubeUrl: string
}

export async function searchYouTube(
	query: string,
	maxResults = 5
): Promise<YouTubeSearchResult[]> {
	const key = process.env.YOUTUBE_API_KEY
	if (!key) throw new Error('YOUTUBE_API_KEY가 없습니다')

	const params = new URLSearchParams({
		part: 'snippet',
		q: query,
		type: 'video',
		maxResults: String(maxResults),
		key,
		relevanceLanguage: 'ko',
		regionCode: 'KR',
	})

	const res = await fetch(
		`https://www.googleapis.com/youtube/v3/search?${params}`,
		{ next: { revalidate: 3600 } }  // 1시간 캐시
	)
	const data = await res.json()

	return (data.items ?? []).map((item: any) => ({
		videoId: item.id.videoId,
		title: item.snippet.title,
		channelTitle: item.snippet.channelTitle,
		thumbnailUrl: item.snippet.thumbnails.medium.url,
		youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
	}))
}