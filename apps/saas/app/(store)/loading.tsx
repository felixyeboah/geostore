export default function StoreLoading() {
	return (
		<div className="container py-10" role="status">
			<div className="h-80 animate-pulse rounded-[2rem] bg-muted" />
			<div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
				{Array.from({ length: 4 }, (_, index) => (
					<div
						key={index}
						className="aspect-[4/5] animate-pulse rounded-2xl bg-muted"
					/>
				))}
			</div>
			<span className="sr-only">Loading store</span>
		</div>
	);
}
