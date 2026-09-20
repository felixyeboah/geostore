export default function StoreLoading() {
	return (
		<output className="mx-auto block w-full max-w-[1360px] px-6 pt-12 lg:px-12 lg:pt-20">
			<div className="h-3 w-40 animate-pulse rounded-[2px] bg-muted" />
			<div className="mt-6 h-12 w-72 animate-pulse rounded-[4px] bg-muted" />
			<div className="mt-8 h-[52px] animate-pulse rounded-[4px] bg-muted" />
			<div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
				{Array.from({ length: 8 }, (_, index) => (
					<div key={index}>
						<div className="aspect-[294/270] animate-pulse rounded-[4px] bg-muted" />
						<div className="mt-6 h-3 w-24 animate-pulse rounded-[2px] bg-muted" />
						<div className="mt-3 h-4 w-40 animate-pulse rounded-[2px] bg-muted" />
					</div>
				))}
			</div>
			<span className="sr-only">Loading store</span>
		</output>
	);
}
