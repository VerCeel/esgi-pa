import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/profile"
import type { User } from "@/lib/api"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  user?: User | null
  previewUrl?: string | null
  className?: string
  fallbackClassName?: string
}

export function UserAvatar({
  user,
  previewUrl,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const imageUrl = previewUrl ?? user?.avatar_url

  return (
    <Avatar className={cn("size-9", className)}>
      {imageUrl && <AvatarImage src={imageUrl} alt={user?.name ?? "Profile"} />}
      <AvatarFallback
        className={cn(
          "bg-primary/10 text-primary text-xs font-semibold",
          fallbackClassName,
        )}
      >
        {getInitials(user?.name)}
      </AvatarFallback>
    </Avatar>
  )
}
