export function extractVideoId(url: string): string | null {
	const patterns = [
		/youtu\.be\/([^?&\s]+)/,
		/youtube\.com\/watch\?.*v=([^&\s]+)/,
		/youtube\.com\/shorts\/([^?&\s]+)/,
		/youtube\.com\/embed\/([^?&\s]+)/,
	]
	for (const p of patterns) {
		const m = url.match(p)
		if (m) return m[1]
	}
	return null
}

export function getThumbnailUrl(videoId: string) {
	return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

export function getEmbedUrl(videoId: string): string {
	return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
}