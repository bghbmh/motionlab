import BackHeader from '@/components/BackHeader'

export default function InbodyNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <BackHeader title="인바디 입력" backLabel="← 회원목록" />
      <div className="p-5">{children}</div>
    </>
  )
}
