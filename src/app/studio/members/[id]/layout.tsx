import BackHeader from '@/components/BackHeader'

export default function MemberDetailLayout({
	children,
}: {
	children: React.ReactNode
}) {
	// return (
	// 	<>
	// 		<BackHeader title="회원 상세" backLabel="← 뒤로" />
	// 		<div className="p-5">{children}</div>
	// 	</>
	// )
	// 전역 studio layout에 사이드바/헤더가 있으므로 BackHeader 불필요
	return <>{children}</>
}
