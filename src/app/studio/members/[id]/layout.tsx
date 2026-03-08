import BackHeader from '@/components/BackHeader'

export default function MemberDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <BackHeader title="회원 상세" backLabel="← 회원목록" />
      <div className="p-5">{children}</div>
    </>
  )
}
