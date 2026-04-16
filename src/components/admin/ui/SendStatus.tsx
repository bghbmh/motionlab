// components/admin/ui/SendStatus.tsx
import { Check, X } from "lucide-react"
interface Props {
	done: boolean
}

export default function SendStatus({ done }: Props) {


	return (
		done ? (
			<>
				<Check size={14} strokeWidth={4} className="text-teal-500" />
				<span className="text-teal-500 text-xs font-semibold leading-4">전송함</span>
			</>
		) : (
			<>
				<X size={14} strokeWidth={3} className="text-gray-500" />
				<span className="text-gray-600 text-xs font-medium leading-4">전송안함</span>
			</>
		)
	)
}
