// components/admin/ui/NoteCard.tsx

export function NoteCardContainer({ className = '', children = null }: { className?: string, children?: React.ReactNode }) {

	return (
		<div className={` overflow-y-auto ${className}`}>
			{/* 요일 헤더 */}
			{children}
		</div>
	)

}

export function NoteCard({ children = null }: { children?: React.ReactNode }) {

	return (
		<div className="bg-white rounded-lg border border-neutral-200 flex flex-col overflow-hidden">
			{/* 요일 헤더 */}
			{children}
		</div>
	)

}

export function NcHeader({ children = null }: { children?: React.ReactNode }) {
	return (
		<div className="px-2.5 py-1 bg-neutral-200 flex justify-between items-center">
			{children}
		</div>
	)
}

export function ItemCounter({ completed, total }: { completed?: number, total?: number }) {
	return (
		<div className="inline-flex items-center gap-0.5">
			<span className="text-neutral-900 text-xs font-medium leading-4">{completed}</span>
			<span className="text-neutral-900 text-xs ">/</span>
			<span className="text-neutral-900 text-xs font-medium leading-4">{total}</span>
		</div>
	)
}

export function NcWorkOutList({ children = null }: { children?: React.ReactNode }) {
	return (
		<div className="px-2.5 flex flex-col zzz">
			{children}
		</div>
	)
}

export function NcWorkOutTitle({ type, status }: { type: string, status: boolean }) {
	return (
		<div className="flex justify-between items-center">
			<span className="text-gray-800 text-xs font-semibold leading-4">
				{type}
			</span>
			{status ? (
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" >
					<rect width="16" height="16" rx="2" fill="#ecfdf5" />
					<path d="M4 8l3 3 5-5" stroke="#0bb489" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			) : (
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path d="M4 4l8 8M12 4l-8 8" stroke="#ef4444" strokeWidth="1.75" strokeLinecap="round" />
				</svg>
			)}
		</div>
	)
}

export function WoItem({ children = null }: { children?: React.ReactNode }) {
	return (
		<div className="py-2 flex flex-col gap-0.5 overflow-hidden">
			{children}
		</div>
	)
}

export function NcExtraInfo({ className = '', children }: { className?: string, children: React.ReactNode }) {
	return (
		<span className={`px-0.5 flex items-center   ${className}`}>
			{children}
		</span>
	)
}

export function NceiItem({ info = '', className = '' }:
	{ info: string, className?: string }) {
	return (
		<span className={`text-neutral-600 text-xs leading-5 ${className}`}>
			{info}
		</span>
	)
}

export function NcKeyWord({ word, className }: { word: string, className?: string }) {
	return (
		<span className={`px-2 py-[5px] rounded-3xl outline outline-1 outline-gray-300 text-neutral-600 text-xs leading-3 ${className}`}>
			{word}
		</span>
	)
}

export function NcCoachMemo({ memo }: { memo?: string }) {
	return (
		<div className="coach-memo p-1 bg-orange-50 rounded-md flex items-start gap-1">
			<div className="coach-memo-icon p-1 bg-white rounded-full shrink-0">
				{/* 📢 megaphone icon */}
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none" >
					<g clipPath="url(#clip0_104_308)">
						<path fillRule="evenodd" clipRule="evenodd" d="M6.52684 2.99731C6.4085 2.79233 6.14639 2.7221 5.94141 2.84045C5.73642 2.95879 5.66619 3.2209 5.78454 3.42589L5.80035 3.45328L0.303011 9.33356C0.174192 9.47131 0.15061 9.67711 0.244924 9.84048L0.766986 10.7448C0.8613 10.908 1.05134 10.9906 1.23507 10.9479L2.69913 10.608L2.98893 11.1099L2.98992 11.1116C3.21003 11.4888 3.57097 11.7632 3.99336 11.8743C4.41574 11.9854 4.86496 11.9242 5.2422 11.7041C5.61944 11.484 5.89379 11.123 6.0049 10.7006C6.07966 10.4164 6.0764 10.1201 5.99921 9.84168L9.0762 9.12716L9.09111 9.15296C9.2094 9.35799 9.47151 9.42819 9.67654 9.30982C9.88149 9.19153 9.95177 8.92942 9.8334 8.72439L9.67174 8.44436C9.66446 8.43002 9.65649 8.41618 9.64774 8.4029L6.71339 3.32041C6.70624 3.30625 6.69826 3.29241 6.68946 3.27897L6.52684 2.99731ZM5.16272 10.0359L3.57188 10.4053L3.7307 10.6804C3.83628 10.8609 4.00916 10.9921 4.21142 11.0454C4.41395 11.0986 4.62935 11.0693 4.81024 10.9638C4.99113 10.8582 5.12268 10.6851 5.17596 10.4826C5.21494 10.3344 5.20968 10.1793 5.16272 10.0359Z" fill="#FF6900" />
						<path fillRule="evenodd" clipRule="evenodd" d="M6.15533 0C6.51037 0 6.79819 0.287817 6.79819 0.642857V1.71728C6.79819 2.07231 6.51037 2.36013 6.15533 2.36013C5.80029 2.36013 5.51247 2.07231 5.51247 1.71728V0.642857C5.51247 0.287817 5.80029 0 6.15533 0ZM11.9892 5.83377C11.9892 6.1888 11.7014 6.47662 11.3463 6.47662H10.2719C9.91689 6.47662 9.62906 6.1888 9.62906 5.83377C9.62906 5.47873 9.91689 5.19091 10.2719 5.19091H11.3463C11.7014 5.19091 11.9892 5.47873 11.9892 5.83377ZM2.03954 6.47662C2.39458 6.47662 2.68239 6.1888 2.68239 5.83377C2.68239 5.47873 2.39458 5.19091 2.03954 5.19091H0.965125C0.610082 5.19091 0.322266 5.47873 0.322266 5.83377C0.322266 6.1888 0.610082 6.47662 0.965125 6.47662H2.03954ZM3.69863 3.37751C3.44757 3.62856 3.04054 3.62856 2.78949 3.37751L2.02977 2.61778C1.77871 2.36673 1.77871 1.95969 2.02977 1.70865C2.28081 1.45759 2.68785 1.45759 2.9389 1.70865L3.69863 2.46837C3.94968 2.71942 3.94968 3.12645 3.69863 3.37751ZM10.2806 2.61777C10.5316 2.36671 10.5316 1.95968 10.2806 1.70863C10.0295 1.45757 9.62254 1.45757 9.37149 1.70863L8.61172 2.46836C8.36067 2.71941 8.36067 3.12644 8.61172 3.37749C8.86277 3.62854 9.26983 3.62854 9.52089 3.37749L10.2806 2.61777Z" fill="#FFB86A" />
					</g>
					<defs>
						<clipPath id="clip0_104_308">
							<rect width="12" height="12" fill="white" />
						</clipPath>
					</defs>
				</svg>

			</div>
			<p className="text-orange-600 text-xs leading-4 flex-1 pt-1" >
				{memo}
			</p>
		</div>
	)
}

export function NcCoachDirection({ direction = '' }: { direction?: string }) {
	return (
		<span className="text-neutral-700 text-xs leading-4">{direction}</span>
	)
}


interface DescriptionItem {
	label: string;
	value: React.ReactNode;
}

interface Props {
	items: DescriptionItem[];
	className?: string;
}

export function DescriptionList({ items, className = '' }: Props) {
	return (
		<dl className={` ${className}`}>
			{items.map((item, index) => (
				<div key={index} className="flex items-center gap-1 py-0.5">
					{/* 제목 (dt) */}
					{item.label && <dt className="text-neutral-500 text-xs  font-medium leading-4">{item.label}</dt>}
					{/* 내용 (dd) */}
					<dd className="text-neutral-700 text-xs font-semibold leading-4">
						{item.value}
					</dd>
				</div>
			))}
		</dl>
	);
}
