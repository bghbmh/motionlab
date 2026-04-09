import { createClient } from '@supabase/supabase-js'  // ← 이걸로
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
	const { memberId } = await req.json()

	const supabase = createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!
	)

	const { error } = await supabase
		.from('notifications')
		.update({ is_read: true })
		.eq('member_id', memberId)
		.eq('is_read', false)

	console.log('[read-all] error:', error)

	if (error) return NextResponse.json({ error }, { status: 500 })
	return NextResponse.json({ ok: true })
}