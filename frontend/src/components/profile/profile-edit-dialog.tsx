import { useEffect, useRef, useState, type FormEvent } from "react"
import { AlertCircle, Camera } from "lucide-react"
import { toast } from "sonner"
import { UserAvatar } from "@/components/UserAvatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { getErrorMessage, getFieldErrors } from "@/lib/api"
import { updateProfile } from "@/lib/profile"

interface ProfileEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open && user) {
      setName(user.name)
      setPassword("")
      setNewPassword("")
      setNewPasswordConfirmation("")
      setAvatarFile(null)
      setAvatarPreview(null)
      setError("")
      setFieldErrors({})
    }
  }, [open, user])

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null)
      return
    }
    const url = URL.createObjectURL(avatarFile)
    setAvatarPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setAvatarFile(file)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      const updated = await updateProfile({
        name,
        ...(password
          ? {
              password,
              new_password: newPassword,
              new_password_confirmation: newPasswordConfirmation,
            }
          : {}),
        ...(avatarFile ? { avatar: avatarFile } : {}),
      })
      updateUser(updated)
      toast.success("Profile updated successfully")
      onOpenChange(false)
    } catch (err) {
      const errors = getFieldErrors(err)
      if (Object.keys(errors).length > 0) {
        const mapped: Record<string, string> = {}
        for (const [field, messages] of Object.entries(errors)) {
          mapped[field] = messages[0]
        }
        setFieldErrors(mapped)
      } else {
        const message = getErrorMessage(err)
        setError(message)
        toast.error(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your photo, name, or password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <UserAvatar
                user={user}
                previewUrl={avatarPreview}
                className="size-20"
                fallbackClassName="text-lg"
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -right-1 -bottom-1 size-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="size-4" />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="text-muted-foreground text-xs">
              JPG, PNG or GIF. Max 2 MB.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name && (
              <p className="text-destructive text-sm">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              value={user?.email ?? ""}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">Change password</p>
            <p className="text-muted-foreground text-xs">
              Leave blank to keep your current password.
            </p>

            <div className="space-y-2">
              <Label htmlFor="profile-password">Current password</Label>
              <Input
                id="profile-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password && (
                <p className="text-destructive text-sm">{fieldErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-new-password">New password</Label>
              <Input
                id="profile-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                aria-invalid={!!fieldErrors.new_password}
              />
              {fieldErrors.new_password && (
                <p className="text-destructive text-sm">
                  {fieldErrors.new_password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-confirm-password">
                Confirm new password
              </Label>
              <Input
                id="profile-confirm-password"
                type="password"
                value={newPasswordConfirmation}
                onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                autoComplete="new-password"
                aria-invalid={!!fieldErrors.new_password_confirmation}
              />
              {fieldErrors.new_password_confirmation && (
                <p className="text-destructive text-sm">
                  {fieldErrors.new_password_confirmation}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
