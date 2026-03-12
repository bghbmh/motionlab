// src/app/api/youtube/search/route.ts — 클라이언트에서 API 키 노출 방지:

import { NextRequest, NextResponse } from 'next/server'
import { searchYouTube } from '@/lib/youtube'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
	// 로그인한 강사만 호출 가능
	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const q = req.nextUrl.searchParams.get('q')
	if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 })

	const results = await searchYouTube(q)
	return NextResponse.json(results)
}