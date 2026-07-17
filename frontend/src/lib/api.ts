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
  avatar?: string | null
  avatar_url?: string | null
  email_verified_at: string | null
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
}

/**
 * Le login a deux issues possibles :
 * - pas de 2FA -> `token` est présent, on est connecté.
 * - 2FA actif  -> `two_factor` vaut true et on reçoit un `login_token` temporaire,
 *   qui ne donne accès à rien tant qu'il n'est pas échangé sur /2fa/challenge.
 */
export interface LoginResponse {
  message: string
  two_factor: boolean
  token?: string
  login_token?: string
}

export interface TwoFactorChallengeInput {
  login_token: string
  code?: string
  recovery_code?: string
}

export interface ValidationErrors {
  [field: string]: string[]
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/login", { email, password })
  return data
}

/** Second facteur : échange le login_token contre un vrai token Sanctum. */
export async function twoFactorChallenge(
  input: TwoFactorChallengeInput,
): Promise<{ token: string }> {
  const { data } = await api.post<{ token: string }>("/2fa/challenge", input)
  return data
}

/**
 * L'inscription ne connecte plus : elle crée le compte et déclenche l'envoi du lien de
 * vérification. Tant que l'email n'est pas confirmé, le login est refusé (403).
 */
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/register", {
    name,
    email,
    password,
  })
  return data
}

/** Renvoie un nouveau lien de vérification à l'adresse donnée. */
export async function resendVerificationEmail(email: string): Promise<string> {
  const { data } = await api.post<{ message: string }>(
    "/email/verification-notification",
    { email },
  )
  return data.message
}

/** Vrai si l'erreur de login correspond à un email pas encore vérifié (403). */
export function isEmailUnverifiedError(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    error.response?.status === 403 &&
    (error.response.data as { email_unverified?: boolean } | undefined)
      ?.email_unverified === true
  )
}

export async function logout(): Promise<void> {
  await api.post("/logout")
}

/** Étape 1 du reset : demande l'envoi d'un lien de réinitialisation par email. */
export async function forgotPassword(email: string): Promise<string> {
  const { data } = await api.post<{ message: string }>("/forgot-password", {
    email,
  })
  return data.message
}

/** Étape 2 : le token reçu par email + le nouveau mot de passe. */
export async function resetPassword(input: {
  token: string
  email: string
  password: string
  password_confirmation: string
}): Promise<string> {
  const { data } = await api.post<{ message: string }>(
    "/reset-password",
    input,
  )
  return data.message
}

export async function getUser(): Promise<User> {
  const { data } = await api.get<User>("/user")
  return data
}

export type OAuthProvider = "google" | "github"

/**
 * URL de démarrage d'une connexion sociale. On ne passe pas par axios : c'est le
 * navigateur qui doit être redirigé vers le fournisseur (redirection pleine page),
 * qui renverra ensuite vers /auth/callback avec un token.
 */
export function oauthRedirectUrl(provider: OAuthProvider): string {
  return `${api.defaults.baseURL}/auth/${provider}/redirect`
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
