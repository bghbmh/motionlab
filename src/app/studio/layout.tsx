import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudioHeader from '@/components/studio/StudioHeader'

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 강사 정보 조회
  const { data: instructor } = await supabase
    .from('instructors')
    .select('*, studios(name)')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-navy">
      <StudioHeader instructor={instructor} />
      <main className="p-5">
        {children}
      </main>
    </div>
  )
}
