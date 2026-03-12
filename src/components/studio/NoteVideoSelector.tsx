'use client'

import { useState } from 'react'
import { extractVideoId, getThumbnailUrl } from '@/lib/youtubeUtils'

export interface VideoItem {
	videoId: string
	title: string
	thumbnailUrl: string
	youtubeUrl: string
	source: 'manual' | 'search'
}

// VideoItem과 별도로 검색 결과용 타입 추가
interface SearchResultItem {
	videoId: string
	title: string
	channelTitle: string    // ← 검색 결과에만 있는 필드
	thumbnailUrl: string
	youtubeUrl: string
}

interface Props {
	videos: VideoItem[]
	onChange: (videos: VideoItem[]) => void
	defaultQuery?: string   // 태그나 운동종류 기반 기본 검색어
}

export default function NoteVideoSelector({ videos, onChange, defaultQuery = '' }: Props) {
	const [tab, setTab] = useState<'search' | 'manual'>('search')
	const [query, setQuery] = useState(defaultQuery)
	const [results, setResults] = useState<SearchResultItem[]>([])
	const [searching, setSearching] = useState(false)
	const [urlInput, setUrlInput] = useState('')
	const [urlError, setUrlError] = useState('')

	async function handleSearch() {
		if (!query.trim()) return
		setSearching(true)
		const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`)
		const data = await res.json()
		setResults(data)
		setSearching(false)
	}

	// addFromSearch 함수 — 파라미터 타입 변경
	function addFromSearch(item: SearchResultItem) {
		if (videos.length >= 5) return
		if (videos.some(v => v.videoId === item.videoId)) return
		onChange([...videos, {
			videoId: item.videoId,
			title: item.title,
			thumbnailUrl: item.thumbnailUrl,
			youtubeUrl: item.youtubeUrl,
			source: 'search',
		}])
	}

	function addFromUrl() {
		setUrlError('')
		const videoId = extractVideoId(urlInput.trim())
		if (!videoId) {
			setUrlError('올바른 YouTube URL이 아닙니다')
			return
		}
		if (videos.some(v => v.videoId === videoId)) {
			setUrlError('이미 추가된 영상입니다')
			return
		}
		if (videos.length >= 5) return

		onChange([...videos, {
			videoId,
			title: '',           // URL 직접 입력은 제목 없음
			thumbnailUrl: getThumbnailUrl(videoId),
			youtubeUrl: urlInput.trim(),
			source: 'manual',
		}])
		setUrlInput('')
	}

	function removeVideo(videoId: string) {
		onChange(videos.filter(v => v.videoId !== videoId))
	}

	const isAdded = (videoId: string) => videos.some(v => v.videoId === videoId)

	return (
		<div className="flex flex-col gap-4">

			{/* 추가된 영상 목록 */}
			{videos.length > 0 && (
				<div className="flex flex-col gap-2">
					<p className="ml-card-label m-0">
						추가된 영상
						<span className="font-normal normal-case ml-1"
							style={{ color: 'rgba(255,255,255,0.3)' }}>
							{videos.length} / 5
						</span>
					</p>
					{videos.map((v, i) => (
						<div key={v.videoId}
							className="flex items-center gap-3 rounded-xl p-2"
							style={{ background: '#111927', border: '1px solid rgba(255,255,255,0.06)' }}>
							<span className="font-mono text-[10px] shrink-0"
								style={{ color: 'rgba(255,255,255,0.3)', width: 14 }}>
								{i + 1}
							</span>
							<img
								src={v.thumbnailUrl}
								className="rounded shrink-0 object-cover"
								style={{ width: 72, height: 40 }}
							/>
							<div className="flex-1 min-w-0">
								<p className="text-xs font-medium text-white truncate">
									{v.title || v.youtubeUrl}
								</p>
								<p className="text-[10px] mt-0.5"
									style={{ color: v.source === 'manual' ? '#FFB347' : '#3DDBB5' }}>
									{v.source === 'manual' ? 'URL 직접 입력' : '검색으로 추가'}
								</p>
							</div>
							<button
								type="button"
								onClick={() => removeVideo(v.videoId)}
								className="shrink-0 rounded px-2 py-1 text-[11px]"
								style={{
									background: 'rgba(255,107,91,0.08)',
									border: '1px solid rgba(255,107,91,0.2)',
									color: 'rgba(255,107,91,0.7)',
								}}>
								삭제
							</button>
						</div>
					))}
				</div>
			)}

			{/* 5개 도달 시 안내 */}
			{videos.length >= 5 && (
				<p className="text-xs text-center py-2 rounded-xl"
					style={{ background: 'rgba(255,179,71,0.07)', color: '#FFB347', border: '1px solid rgba(255,179,71,0.2)' }}>
					최대 5개까지 추가할 수 있습니다
				</p>
			)}

			{videos.length < 5 && (
				<>
					{/* 탭 */}
					<div className="flex gap-1 p-1 rounded-xl"
						style={{ background: '#111927' }}>
						{(['search', 'manual'] as const).map(t => (
							<button key={t} type="button" onClick={() => setTab(t)}
								className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
								style={{
									background: tab === t ? '#1a2740' : 'transparent',
									color: tab === t ? '#3DDBB5' : 'rgba(255,255,255,0.35)',
									border: tab === t ? '1px solid rgba(61,219,181,0.2)' : '1px solid transparent',
								}}>
								{t === 'search' ? '🔍 YouTube 검색' : '🔗 URL 직접 입력'}
							</button>
						))}
					</div>

					{/* 검색 탭 */}
					{tab === 'search' && (
						<div className="flex flex-col gap-3">
							<div className="flex gap-2">
								<input
									className="ml-input flex-1"
									placeholder="예: 필라테스 코어 초보자"
									value={query}
									onChange={e => setQuery(e.target.value)}
									onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
								/>
								<button type="button" onClick={handleSearch}
									disabled={searching}
									className="btn-primary px-4 flex-none text-xs"
									style={{ opacity: searching ? 0.5 : 1 }}>
									{searching ? '검색 중...' : '검색'}
								</button>
							</div>

							{results.length > 0 && (
								<div className="flex flex-col gap-2">
									{results.map((item: SearchResultItem) => {
										const added = isAdded(item.videoId)
										return (
											<div key={item.videoId}
												className="flex items-center gap-3 rounded-xl p-2.5"
												style={{
													background: added ? 'rgba(61,219,181,0.05)' : '#111927',
													border: `1px solid ${added ? 'rgba(61,219,181,0.2)' : 'rgba(255,255,255,0.05)'}`,
												}}>
												<img
													src={item.thumbnailUrl}
													className="rounded shrink-0 object-cover"
													style={{ width: 80, height: 45 }}
												/>
												<div className="flex-1 min-w-0">
													<p className="text-xs font-medium text-white line-clamp-2">
														{item.title}
													</p>
													<p className="text-[10px] mt-0.5"
														style={{ color: 'rgba(255,255,255,0.3)' }}>
														{item.channelTitle}
													</p>
												</div>
												<button
													type="button"
													onClick={() => addFromSearch(item)}
													disabled={added}
													className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all"
													style={{
														background: added ? 'rgba(61,219,181,0.1)' : 'rgba(61,219,181,0.15)',
														border: `1px solid ${added ? 'rgba(61,219,181,0.2)' : 'rgba(61,219,181,0.4)'}`,
														color: added ? 'rgba(61,219,181,0.4)' : '#3DDBB5',
													}}>
													{added ? '추가됨' : '+ 추가'}
												</button>
											</div>
										)
									})}
								</div>
							)}
						</div>
					)}

					{/* URL 직접 입력 탭 */}
					{tab === 'manual' && (
						<div className="flex flex-col gap-2">
							<div className="flex gap-2">
								<input
									className="ml-input flex-1"
									placeholder="https://youtu.be/xxxxx"
									value={urlInput}
									onChange={e => { setUrlInput(e.target.value); setUrlError('') }}
									onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFromUrl() } }}
								/>
								<button type="button" onClick={addFromUrl}
									className="btn-ghost px-4 flex-none text-xs">
									추가
								</button>
							</div>
							{urlError && (
								<p className="text-xs" style={{ color: '#FF6B5B' }}>{urlError}</p>
							)}
						</div>
					)}
				</>
			)}
		</div>
	)
}