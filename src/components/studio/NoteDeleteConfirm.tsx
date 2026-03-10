import type { NoteWithTags } from './NoteCard'

interface Props {
	note: NoteWithTags
	onCancel: () => void
	onConfirm: () => void
}

export default function NoteDeleteConfirm({ note, onCancel, onConfirm }: Props) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center px-5"
			style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
			onClick={onCancel}
		>
			<div
				className="w-full max-w-xs rounded-2xl p-6 flex flex-col gap-4"
				style={{ background: '#141e2e', border: '1px solid rgba(255,107,91,0.25)' }}
				onClick={e => e.stopPropagation()}
			>
				<div className="text-center">
					<p className="text-2xl mb-2">🗑️</p>
					<p className="text-sm font-semibold text-white">알림장을 삭제할까요?</p>
					<p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
						{note.written_at}
					</p>
					<p className="text-xs mt-1" style={{ color: 'rgba(255,107,91,0.7)' }}>
						삭제 후 복구할 수 없습니다.
					</p>
				</div>
				<div className="flex gap-2">
					<button onClick={onCancel} className="btn-ghost flex-1 py-2.5 text-sm">
						취소
					</button>
					<button
						onClick={onConfirm}
						className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
						style={{ background: 'rgba(255,107,91,0.15)', border: '1px solid rgba(255,107,91,0.4)', color: '#FF6B5B' }}
					>
						삭제
					</button>
				</div>
			</div>
		</div>
	)
}
