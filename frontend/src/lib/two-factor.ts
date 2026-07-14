import api from "@/lib/api"

export interface TwoFactorSetup {
  secret: string
  otpauth_url: string
  /** SVG encodé en data URI, à mettre directement dans <img src>. */
  qr_code: string
}

export interface RecoveryCodesResponse {
  recovery_codes: string[]
}

/** Étape 1 : génère le secret + le QR code. Le 2FA n'est pas encore actif. */
export async function enableTwoFactor(): Promise<TwoFactorSetup> {
  const { data } = await api.post<TwoFactorSetup>("/2fa/enable")
  return data
}

/** Étape 2 : confirme avec un code de l'app. C'est ici que le 2FA s'active. */
export async function confirmTwoFactor(code: string): Promise<string[]> {
  const { data } = await api.post<RecoveryCodesResponse>("/2fa/confirm", { code })
  return data.recovery_codes
}

export async function disableTwoFactor(password: string): Promise<void> {
  await api.post("/2fa/disable", { password })
}

export async function regenerateRecoveryCodes(password: string): Promise<string[]> {
  const { data } = await api.post<RecoveryCodesResponse>("/2fa/recovery-codes", {
    password,
  })
  return data.recovery_codes
}
