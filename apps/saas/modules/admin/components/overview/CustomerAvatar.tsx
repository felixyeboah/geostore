import { config as storageConfig } from "@repo/storage/config";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@repo/ui/components/avatar";

/**
 * Server-safe twin of UserAvatar: same proxy rule for stored avatars, no hooks,
 * so it can render straight from a Server Component.
 */
export function CustomerAvatar({
	name,
	avatarUrl,
	className,
}: {
	name: string;
	avatarUrl?: string | null;
	className?: string;
}) {
	const initials = name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
	const src = avatarUrl
		? avatarUrl.startsWith("http")
			? avatarUrl
			: `/image-proxy/${storageConfig.bucketNames.avatars}/${avatarUrl}`
		: undefined;

	return (
		<Avatar className={className}>
			<AvatarImage src={src} alt="" />
			<AvatarFallback className="bg-accent font-semibold text-[11px] text-accent-foreground">
				{initials || "?"}
			</AvatarFallback>
		</Avatar>
	);
}
