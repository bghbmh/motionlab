import BackHeader from '@/components/BackHeader'

export default function NoteNewLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  return (
    <>
      <BackHeader title="알림장 작성" backLabel="← 회원목록" />
      <div className="p-5">{children}</div>
    </>
  )
}
