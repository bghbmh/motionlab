'use client'

import { useState } from 'react'
import { getThumbnailUrl, getEmbedUrl } from '@/lib/youtubeUtils'

interface NoteVideo {
	id: string
	video_id: string
	youtube_url: string
	title: string | null
	thumbnail_url: string | null
	source: 'manual' | 'search'
	sort_order: number
}

interface Props {
	videos: NoteVideo[]
	tags: string[]
}

export default function VideosClient({ videos, tags }: Props) {
	const [playing, setPlaying] = useState<string | null>(null)

	const hasVideos = videos.length > 0

	return (
		<div className="p-4 flex flex-col gap-4">

			{/* ── 인앱 플레이어 오버레이 ── */}
			{playing && (
				<div
					className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
					style={{ background: 'rgba(0,0,0,0.92)' }}
					onClick={() => setPlaying(null)}
				>
					<div
						className="w-full rounded-2xl overflow-hidden shadow-2xl"
						style={{ maxWidth: 'min(92vw, 480px)' }}
						onClick={e => e.stopPropagation()}
					>
						<iframe
							width="100%"
							height="270"
							src={getEmbedUrl(playing)}
							title="추천 운동 영상"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
							allowFullScreen
							className="block"
						/>
					</div>
					<button
						onClick={() => setPlaying(null)}
						className="btn-ghost px-6 py-2.5 text-sm"
					>
						✕  닫기
					</button>
				</div>
			)}

			{/* ── 태그 배지 (있을 때만) ── */}
			{tags.length > 0 && (
				<div
					className="rounded-xl px-4 py-3"
					style={{
						backgroundColor: 'rgba(61,219,181,0.07)',
						border: '1px solid rgba(61,219,181,0.18)',
					}}
				>
					<p className="text-xs font-semibold mb-1.5" style={{ color: '#3DDBB5' }}>
						알림장 키워드 기반 추천
					</p>
					<div className="flex flex-wrap gap-1.5">
						{tags.map(t => (
							<span key={t} className="ml-tag text-[11px]">{t}</span>
						))}
					</div>
				</div>
			)}

			{/* ── 영상 없음 ── */}
			{!hasVideos && (
				<div className="flex flex-col items-center justify-center pt-20 gap-4">
					<div
						className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl"
						style={{
							background: 'rgba(61,219,181,0.07)',
							border: '1px solid rgba(61,219,181,0.15)',
						}}
					>
						▶️
					</div>
					<div className="text-center">
						<p className="text-white font-semibold text-sm">추천 영상이 없습니다</p>
						<p
							className="text-xs mt-1.5 leading-relaxed"
							style={{ color: 'rgba(255,255,255,0.35)' }}
						>
							강사님이 알림장에 영상을 추가하면<br />여기에 표시됩니다
						</p>
					</div>
				</div>
			)}

			{/* ── 영상 목록 ── */}
			{hasVideos && videos.map((v, idx) => {
				const videoId = v.video_id
				const thumbnail = v.thumbnail_url ?? getThumbnailUrl(videoId)
				const title = v.title || '운동 추천 영상'

				return (
					<div
						key={v.id}
						className="ml-card overflow-hidden"
						style={{ padding: 0 }}
					>
						{/* 썸네일 */}
						<div
							className="relative w-full cursor-pointer"
							style={{ paddingBottom: '52%' }}
							onClick={() => setPlaying(videoId)}
						>
							<img
								src={thumbnail}
								alt={title}
								className="absolute inset-0 w-full h-full object-cover"
								style={{ opacity: 0.85 }}
							/>
							{/* 순서 배지 */}
							<div
								className="absolute top-2.5 left-2.5 font-mono text-[11px] font-bold
                           rounded-md px-1.5 py-0.5"
								style={{
									background: 'rgba(0,0,0,0.55)',
									color: 'rgba(255,255,255,0.7)',
								}}
							>
								{idx + 1}
							</div>
							{/* 재생 버튼 */}
							<div className="absolute inset-0 flex items-center justify-center">
								<div
									className="w-14 h-14 rounded-full flex items-center justify-center
                             text-white text-2xl"
									style={{ background: 'rgba(0,0,0,0.55)' }}
								>
									▶
								</div>
							</div>
						</div>

						{/* 정보 */}
						<div className="p-3.5">
							<p className="text-sm font-semibold text-white leading-snug line-clamp-2">
								{title}
							</p>

							{/* source 배지 */}
							<div className="flex items-center gap-2 mt-1.5">
								<span
									className="text-[10px] font-medium px-2 py-0.5 rounded-full"
									style={{
										background: v.source === 'manual'
											? 'rgba(255,179,71,0.1)'
											: 'rgba(61,219,181,0.1)',
										color: v.source === 'manual' ? '#FFB347' : '#3DDBB5',
										border: `1px solid ${v.source === 'manual'
											? 'rgba(255,179,71,0.25)'
											: 'rgba(61,219,181,0.25)'}`,
									}}
								>
									{v.source === 'manual' ? '강사 추천' : '검색 추천'}
								</span>
							</div>

							{/* 재생 버튼 */}
							<button
								className="btn-primary w-full py-2.5 text-xs mt-3"
								onClick={() => setPlaying(videoId)}
							>
								▶  바로 보기
							</button>
						</div>
					</div>
				)
			})}
		</div>
	)
}