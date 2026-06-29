import axios from "axios"

const api = axios.create({
  baseURL: "/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api

export interface User {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  message: string
  token: string
}

export interface ValidationErrors {
  [field: string]: string[]
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/login", { email, password })
  return data
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const { data } = await api.post<User>("/register", { name, email, password })
  return data
}

export async function logout(): Promise<void> {
  await api.post("/logout")
}

export async function getUser(): Promise<User> {
  const { data } = await api.get<User>("/user")
  return data
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (typeof data === "object" && data !== null) {
      if ("message" in data && typeof data.message === "string") {
        return data.message
      }
      const errors = data as ValidationErrors
      const firstField = Object.keys(errors)[0]
      if (firstField && Array.isArray(errors[firstField])) {
        return errors[firstField][0]
      }
    }
    return error.message
  }
  return "An unexpected error occurred"
}

export function getFieldErrors(error: unknown): ValidationErrors {
  if (axios.isAxiosError(error) && error.response?.status === 422) {
    return error.response.data as ValidationErrors
  }
  return {}
}
