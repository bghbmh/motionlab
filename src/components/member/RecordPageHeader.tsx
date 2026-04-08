// src/components/member/RecordPageHeader.tsx

interface RecordPageHeaderProps {
  totalDays: number
}

export function RecordPageHeader({ totalDays }: RecordPageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2 pt-2 pb-1">
      <h1 className="text-2xl font-bold text-[#1d211c]">내 운동 기록</h1>
      <span className="m-sublabel">총 {totalDays}일</span>
    </div>
  )
}
