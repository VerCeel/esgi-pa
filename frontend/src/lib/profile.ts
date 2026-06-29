import api from "@/lib/api"
import type { User } from "@/lib/api"

export interface ProfileInput {
  name?: string
  password?: string
  new_password?: string
  new_password_confirmation?: string
  avatar?: File | null
}

export async function getProfile(): Promise<User> {
  const { data } = await api.get<User>("/profile")
  return data
}

export async function updateProfile(input: ProfileInput): Promise<User> {
  const formData = new FormData()

  if (input.name !== undefined) formData.append("name", input.name)
  if (input.password) formData.append("password", input.password)
  if (input.new_password) formData.append("new_password", input.new_password)
  if (input.new_password_confirmation) {
    formData.append("new_password_confirmation", input.new_password_confirmation)
  }
  if (input.avatar) formData.append("avatar", input.avatar)

  const { data } = await api.patch<User>("/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export function getInitials(name?: string) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
