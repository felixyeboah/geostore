import { config as storageConfig } from "@repo/storage/config";
import { cn } from "@repo/ui";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@repo/ui/components/avatar";
import { useMemo } from "react";

export const UserAvatar = ({
	name,
	avatarUrl,
	className,
	fallbackClassName,
	ref,
}: React.ComponentProps<typeof Avatar> & {
	name: string;
	avatarUrl?: string | null;
	className?: string;
	/** Overrides the initials tile — the admin wants ink on white, not tinted. */
	fallbackClassName?: string;
}) => {
	const initials = useMemo(
		() =>
			name
				.split(" ")
				.slice(0, 2)
				.map((n) => n[0])
				.join(""),
		[name],
	);

	const avatarSrc = useMemo(
		() =>
			avatarUrl
				? avatarUrl.startsWith("http")
					? avatarUrl
					: `/image-proxy/${storageConfig.bucketNames.avatars}/${avatarUrl}`
				: undefined,
		[avatarUrl],
	);

	return (
		<Avatar ref={ref} className={className}>
			<AvatarImage src={avatarSrc} />
			<AvatarFallback
				className={cn("bg-primary/10 text-primary", fallbackClassName)}
			>
				{initials}
			</AvatarFallback>
		</Avatar>
	);
};

UserAvatar.displayName = "UserAvatar";
