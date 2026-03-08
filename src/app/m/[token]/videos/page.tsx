'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Video {
	id: string
	title: string
	channel: string
	videoId: string
	mets: string
	duration: string
	tags: string[]
}

const TAG_VIDEOS: Record<string, Video[]> = {
	'코어강화': [
		{
			id: '1', title: '코어 강화 플랭크 30일 챌린지', channel: '필라테스TV',
			videoId: 'DHKKdmS57Cg', mets: '3.5', duration: '15분', tags: ['코어강화', '플랭크']
		},
	],
	'스트레칭': [
		{
			id: '2', title: '전신 스트레칭 10분 루틴', channel: '홈트레이닝TV',
			videoId: 'OyVFRSxqPsQ', mets: '2.5', duration: '10분', tags: ['스트레칭']
		},
	],
	'필라테스기초': [
		{
			id: '3', title: '필라테스 기초 동작 완벽 가이드', channel: '운동하는 언니',
			videoId: 'RqcOCBb4arc', mets: '4.0', duration: '20분', tags: ['필라테스기초']
		},
	],
	'_default': [
		{
			id: '4', title: '집에서 하는 전신 루틴 20분', channel: '홈트레이닝TV',
			videoId: 'RqcOCBb4arc', mets: '4.5', duration: '20분', tags: []
		},
		{
			id: '5', title: '초보자 필라테스 루틴', channel: '필라테스TV',
			videoId: 'DHKKdmS57Cg', mets: '3.5', duration: '15분', tags: []
		},
	],
}

export default function VideosPage() {
	const { token } = useParams<{ token: string }>()   // ← useParams 사용
	const [playing, setPlaying] = useState<string | null>(null)
	const [tags, setTags] = useState<string[]>([])
	const [videos, setVideos] = useState<Video[]>([])

	useEffect(() => {
		async function load() {
			const supabase = createClient()

			const { data: member } = await supabase
				.from('members')
				.select('id')
				.eq('access_token', token)
				.single()
			if (!member) return

			const { data: note } = await supabase
				.from('notes')
				.select('note_tags(tag)')
				.eq('member_id', member.id)
				.order('written_at', { ascending: false })
				.limit(1)
				.single()

			const noteTags: string[] = note?.note_tags?.map((t: any) => t.tag) ?? []
			setTags(noteTags)

			const matched = new Map<string, Video>()
			for (const tag of noteTags) {
				const vids = TAG_VIDEOS[tag] ?? []
				vids.forEach(v => matched.set(v.id, v))
			}
			setVideos(matched.size > 0 ? Array.from(matched.values()) : TAG_VIDEOS['_default'])
		}
		load()
	}, [token])

	return (
		<div className="p-4 flex flex-col gap-4">
			{/* 유튜브 인앱 플레이어 */}
			{playing && (
				<div
					className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
					style={{ background: 'rgba(0,0,0,0.88)' }}
					onClick={() => setPlaying(null)}
				>
					<div
						className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
						style={{ maxWidth: 'min(92vw, 480px)' }}
						onClick={e => e.stopPropagation()}
					>
						<iframe
							width="100%"
							height="270"
							src={`https://www.youtube.com/embed/${playing}?autoplay=1&rel=0`}
							title="운동 추천 영상"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
							allowFullScreen
							className="block"
						/>
					</div>
					<button onClick={() => setPlaying(null)} className="btn-ghost px-6 py-2.5 text-sm">
						✕  닫기
					</button>
				</div>
			)}

			{/* 태그 */}
			{tags.length > 0 && (
				<div className="rounded-xl px-4 py-3"
					style={{ backgroundColor: 'rgba(61,219,181,0.1)', border: '1px solid rgba(61,219,181,0.2)' }}>
					<p className="text-xs font-semibold mb-1.5" style={{ color: '#3DDBB5' }}>
						알림장 키워드 기반 추천
					</p>
					<div className="flex flex-wrap gap-1.5">
						{tags.map(t => <span key={t} className="ml-tag text-[11px]">{t}</span>)}
					</div>
				</div>
			)}

			{/* 영상 목록 */}
			{videos.map(v => (
				<div key={v.id} className="ml-card overflow-hidden" style={{ padding: 0 }}>
					<div
						className="relative w-full cursor-pointer"
						style={{ paddingBottom: '50%' }}
						onClick={() => setPlaying(v.videoId)}
					>
						<img
							src={`https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`}
							alt={v.title}
							className="absolute inset-0 w-full h-full object-cover"
							style={{ opacity: 0.8 }}
						/>
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
								style={{ background: 'rgba(0,0,0,0.6)' }}>▶</div>
						</div>
					</div>
					<div className="p-3">
						<p className="text-sm font-semibold text-white leading-snug">{v.title}</p>
						<p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{v.channel}</p>
						<div className="mt-2">
							{[`METs ${v.mets}`, v.duration].map(label => (
								<span key={label} className="inline-block rounded px-2 py-0.5 text-[10px] font-mono mr-1.5"
									style={{ backgroundColor: '#1a2740', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
									{label}
								</span>
							))}
						</div>
						<div className="flex gap-2 mt-3">
							<button className="btn-primary flex-1 py-2 text-xs" onClick={() => setPlaying(v.videoId)}>
								▶  앱에서 바로 보기
							</button>
							<button className="btn-ghost px-3 py-2 text-xs">완료 기록</button>
						</div>
					</div>
				</div>
			))}
		</div>
	)
}
